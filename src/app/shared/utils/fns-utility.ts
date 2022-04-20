import { ClassObjectBase, MapTableOpts } from "../models";
import { BSIconOptions, svgPath } from "./constants";

/**
 * @function createElementWith - Function to create an SVG or HTML element and set various attributes at the same time
 * @param {boolean} svgNamespace - Enter true if you're generating an SVG Element
 * @param {string} elementType - TagName of the Element you're generating
 * @param {Object} setAttributes - Object of Other Attributes you want to set
 **/
export function createElementWith<T extends boolean, SVGType extends keyof SVGElementTagNameMap, HTMLType extends keyof HTMLElementTagNameMap>(
    svgNamespace: T,
    elementType: T extends true ? SVGType : HTMLType,
    setAttributes: { [key: string]: any }
  ): T extends true ? SVGElementTagNameMap[SVGType] : HTMLElementTagNameMap[HTMLType] {
    const newElement = svgNamespace ? document.createElementNS(`http://www.w3.org/2000/${elementType}`, elementType) : document.createElement(elementType);
    Object.entries(setAttributes).forEach(i => {
        if (i[0] === 'children') {
            newElement.append(...i[1]);
        } else if (i[0] === 'innerHTML') {
            newElement.innerHTML = i[1];
        } else if (typeof i[1] === 'string' || i[0].startsWith('data')) {
            newElement.setAttribute(i[0], i[1]);
        } else {
            Object.assign(newElement, Object.fromEntries([i]));
        };
    });

    return newElement as T extends true ? SVGElementTagNameMap[SVGType] : HTMLElementTagNameMap[HTMLType];
};

export function createFormField<T extends 'checkbox' | 'radio' | 'select' | 'button'>(
    inputType: T,
    inputHidden: boolean,
    inputValues: Array<{label: string; value?: boolean | string | number;}>,
    wrapper: T extends 'checkbox' ? undefined : {label: string, group: string, addClass?: string},
    fn?: (e: any) => any
  ): HTMLElement {
    const fixId = (id: string | undefined) => id ? id.replace(/(_|\s|\&)/gi, '-').toLowerCase() : undefined;
    const makeInputEls = (label: string, value: any): Array<HTMLElement> => [
      createElementWith(false, 'label', {
        for: fixId(label) + '-' + inputType,
        innerHTML: makeTitleCase(inputType === 'button' && wrapper ? wrapper.label : label)
      }),
      createElementWith(false, 'input', {
        type: inputType,
        id:  fixId(label) + '-' + inputType,
        name: fixId(wrapper?.group),
        checked: value || false,
        value: value || label,
        onclick: fn ? fn : undefined
      })
    ];
    const fieldEls = inputType === 'select' && wrapper
      ? [createElementWith(false, 'select', {
          id: fixId(wrapper.group),
          innerHTML: inputValues.map(iv => `<option value="${iv.value}">${iv.label}</option>`).join('')
        })]
      : inputValues.flatMap(iv => makeInputEls(iv.label, iv.value).sort((a,b) => compareValues(a, b, inputHidden ? 'asc' : 'desc')));
    return createElementWith(false, 'div', {
        class: `input-field-group ${wrapper && wrapper.addClass ? ' '+wrapper.addClass : ''}`,
        ...(inputType !== 'button' && wrapper && {innerHTML: wrapper.label}),
        children: fieldEls
    });
}

/**
 * Function to quickly generate an SVG Element
 * @param {string} shape Name of the BootStrap Icon you want as an SVG Element
 * @param {boolean} mapIcon If true, will set it up to respond to the color attribute in OL Styles
 * @param {object} setAttributes Object of Other Attributes you want to set
 * @returns {SVGSVGElement} Returns an SVG Element
 **/
export const generatePointSVG = (
  shape: BSIconOptions,
  mapIcon = false,
  setAttributes?:  {[prop: string]: any }
  ): SVGSVGElement => {
    const svgEl = createElementWith(true, 'svg', {
        'xmlns': 'http://www.w3.org/2000/svg',
        'viewBox': '0 0 16 16',
        'height': mapIcon ? '21' : '1em',
        'width': mapIcon ? '20' : '1em',
        'fill': 'currentColor',
        'stroke': 'none'
    });
    if (setAttributes) Object.entries(setAttributes).forEach(attr => { svgEl.setAttribute(attr[0], attr[1]); });
    svgEl.innerHTML = mapIcon ? svgPath[shape].replace(/<path\s/g, '<path style="fill:white;stroke:inherit;stroke-width:1;"') : svgPath[shape];

    return svgEl;
};

/**
 * Utility to convert a string to titlecase
 * @param {string} str Input String to Transform
 * @param {string} separator If Input String has no spaces, include the character to convert to spaces
 * @returns {string} Returns the corrected string with each word capitalized and with spaces between them.
 **/
export const makeTitleCase = (str: string, separator ? : string): string => str.split(separator || ' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

export const generateTable = <T extends keyof MapTableOpts>(
  type: T,
  content: MapTableOpts[T]
  ): HTMLTableElement => {
    const tableHeader: Array<HTMLTableRowElement> = type === 'legend' ? [] : [
      createElementWith(false, 'tr', {
        innerHTML: `<th>${type === 'basic' ? makeTitleCase((content as MapTableOpts['basic']).header,'-') : 'Property'}</th>${type === 'attribute' ? '<th>Value</th>' : ''}`
      })
    ];
    const contentArray = type === 'basic' ? undefined : Object.entries(type === 'legend' && content ? (content as MapTableOpts['legend']).classes! : (content as MapTableOpts['attribute']).attributes);
    const svgStyling = {
      line: (fill: string, strokeColor: string, strokeType?: string) => `
        <path d="M15 85 Q 25 50 85 50 L115 50 Q175 50 185 15" style="stroke:${getContrastYIQ(strokeColor)};stroke-width:20;fill:transparent;stroke-linecap:round" />
        <path d="M15 85 Q 25 50 85 50 L115 50 Q175 50 185 15" style="stroke:${strokeColor};${strokeType === 'dashed'?'stroke-dasharray:45 20;':''}stroke-width:12;fill:transparent;stroke-linecap:round" />
      `,
      polygon: (fill: string, strokeColor: string, strokeType?: string) => `
        <rect x="10" y="10" width="180" height="80" style="fill:${fill};fill-opacity:0.7;stroke-width:10;${strokeType === 'dashed'?'stroke-dasharray:45 20;':''}stroke:${strokeColor}" />
      `,
      point: (fill: string, strokeColor: string, strokeType?: string) => ''
    };
    const makePatch = (row: ClassObjectBase, type: 'point'|'line'|'polygon') => row.iconSrc
      ? `<img src='${row.iconSrc}' />`
      : `<svg width="1em" height="0.5em" viewBox="0 0 200 100">${svgStyling[type](row.fill || 'transparent', row.strokeColor || getContrastYIQ(row.fill), row.strokeType)}</svg>
    `;
    const legendRow = (row: ClassObjectBase) => `<td class='patch'>${makePatch(row, (content as MapTableOpts['legend']).featType)}</td><td class='label'>${row.label}</td>`;
    const tableRows = type === 'basic' ? [
      createElementWith(false, 'tr', {
        innerHTML: `</tr><tr><td>${(content as MapTableOpts['basic']).subheader}</td></tr>`
      })
    ] : contentArray!.filter(a => !['geometry', '_symbol', 'layer'].includes(a[0]))
    .map(e => createElementWith(false, 'tr', {
      innerHTML: type === 'legend' ? legendRow(e[1]) : `<td class='prop'>${e[0]}</td><td class='val'>${e[1]}</td>`,
      onclick: (e: MouseEvent) => {
        navigator.clipboard.writeText((e.currentTarget as HTMLElement).textContent!);
      }
    }));
    const newTable = createElementWith(false, 'table', {class: `map-table ${type}`, children: tableHeader.concat(tableRows)});

    return newTable;
};

/**
 * Utility to get a contrasting color from the input color. Generates a simplified
 * brightness score (YIQ) for a given color in hex or rgb notation. If the score is
 * above 159 then it's considered a bright color.
 * @param {string} colorString A hex or rgb string representation of a color
 * @returns {string} Returns a dark or light color that will contrast well with the input.
 **/
export const getContrastYIQ = (colorString: string): string => {
    const colorType = colorString[0] === '#' ? 'hex' : 'rgb';
    const yiqCalc = (r: number, g: number, b: number): number => ((r * 299) + (g * 587) + (b * 114)) / 1000;
    const colorStringFix = colorType === 'hex' ? colorString.slice(1) : colorString.replace(/^(rgba?\()/i, '').slice(0, -1);
    const rgbObj = {
        r: colorType === 'hex' ? parseInt(colorStringFix.slice(0, 2), 16) : parseInt(colorStringFix.split(',')[0]),
        g: colorType === 'hex' ? parseInt(colorStringFix.slice(2, 4), 16) : parseInt(colorStringFix.split(',')[1]),
        b: colorType === 'hex' ? parseInt(colorStringFix.slice(4, 6), 16) : parseInt(colorStringFix.split(',')[2])
    };

    return yiqCalc(rgbObj.r, rgbObj.g, rgbObj.b) >= 160 ? 'rgba(100,100,100,0.9)' : 'rgba(245,245,245,0.9)';
};

/**
 * Utility to easily get the Hex color string opacity notation.
 * @param {number} opacityLevel The Opacity Fraction to convert to Hexadecimal. Fn will round to the nearest 10th.
 * @returns {string} returns the two characters to add to the end of a 6 character Hex color string.
 **/
export const convertToHexOpacity = (opacityLevel: number): string => {
    const hexOpacities: {
        [key: string]: string } = {
        '1.0': 'FF',
        '0.9': 'E6',
        '0.8': 'CC',
        '0.7': 'B3',
        '0.6': '99',
        '0.5': '80',
        '0.4': '66',
        '0.3': '4D',
        '0.2': '33',
        '0.1': '1A'
    };

    return hexOpacities[opacityLevel.toFixed(1) as string];
};

/**
 * @function compareValues - Function used in .sort() to sort strings in ascending or descending order.
 **/
export function compareValues(valA: any, valB: any, order: 'asc' | 'desc' = 'asc') {
    if (!valA || !valB) {
        // property doesn't exist on either object
        return 0;
    }

    const varA = (typeof valA === 'string') ?
        valA.toUpperCase() : valA;
    const varB = (typeof valB === 'string') ?
        valB.toUpperCase() : valB;

    let comparison = 0;
    if (varA > varB) {
        comparison = 1;
    } else if (varA < varB) {
        comparison = -1;
    }
    return (
        (order === 'desc') ? (comparison * -1) : comparison
    );
};

/**
 * @function firstOrLast - Function used to check if item is first or last in an array
 * @param {number} curIndex Index of Current Item
 * @param {number} max Upper limit of array
 * @returns {string} Returns first, last, or an empty string
 **/
export const firstOrLast = (curIndex: number, max: number): 'first' | 'last' | '' => {
    if (curIndex === 0) {
        return 'first';
    } else if (curIndex === (max - 1)) {
        return 'last';
    } else {
        return '';
    }
};
