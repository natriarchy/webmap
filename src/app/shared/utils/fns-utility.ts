import { LyrConstants, MapTableOpts } from "../models";
import { BSIconOptions, svgPath } from "./constants";

/**
 * @function createElementWith - Function to create an SVG or HTML element and set various attributes at the same time
 * @param {boolean} useSvg - Enter true if you're generating an SVG Element
 * @param {string} elTag - TagName of the Element you're generating
 * @param {Object} attributes - Object of Other Attributes you want to set
 **/
export function createElementWith<T extends boolean, SVGType extends keyof SVGElementTagNameMap, HTMLType extends keyof HTMLElementTagNameMap>(
    useSvg: T,
    elTag: T extends true ? SVGType : HTMLType,
    attributes: { [key: string]: any }
  ): T extends true ? SVGElementTagNameMap[SVGType] : HTMLElementTagNameMap[HTMLType] {
    const newEl = useSvg ? document.createElementNS(`http://www.w3.org/2000/${elTag}`, elTag) : document.createElement(elTag);
    Object.entries(attributes).forEach(i => {
      if (i[0] === 'children') {
        newEl.append(...i[1]);
      } else if (i[0] === 'innerHTML') {
        newEl.innerHTML = i[1];
      } else if (i[0].startsWith('data') || typeof i[1] === 'string') {
        newEl.setAttribute(i[0], i[1]);
      } else {
        Object.assign(newEl, Object.fromEntries([i]));
      };
    });

    return newEl as T extends true ? SVGElementTagNameMap[SVGType] : HTMLElementTagNameMap[HTMLType];
};

export function createFormField<T extends 'checkbox' | 'radio' | 'select' | 'button'>(
    inputType: T,
    inputHidden: boolean,
    inputValues: Array<{label: string; value?: boolean | string | number;}>,
    wrapper: T extends 'checkbox' ? undefined : {label: string, group: string, addClass?: string},
    fn?: {type: 'click'|'change', fn: (e: any) => any}
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
        onclick: fn?.type === 'click' ? fn.fn : undefined,
        onchange: fn?.type === 'change' ? fn.fn : undefined
      })
    ];
    const fieldEls = inputType === 'select' && wrapper
      ? [createElementWith(false, 'select', {
          id: fixId(wrapper.group),
          innerHTML: inputValues.map(iv => `<option value="${iv.value}">${iv.label}</option>`).join('')
        })]
      : inputValues.flatMap(iv => makeInputEls(iv.label, iv.value).sort((a,b) => compare(a, b, inputHidden)));
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
export const generatePointSVG = <T extends boolean> (
  shape: BSIconOptions,
  mapIcon: T,
  setAttributes?:  {[prop: string]: any }
  ): T extends true ? string : (SVGElement | HTMLElement) => {
    const svgEl = createElementWith(true, 'svg', {
        'xmlns': 'http://www.w3.org/2000/svg',
        'viewBox': '0 0 16 16',
        'height': mapIcon ? '21' : '1em',
        'width': mapIcon ? '20' : '1em',
        'fill': 'currentColor',
        'stroke': 'none'
    });
    if (setAttributes) Object.entries(setAttributes).forEach(attr => { svgEl.setAttribute(attr[0], attr[1]); });
    svgEl.innerHTML = mapIcon && shape !== 'geo-alt-filled' ? svgPath[shape].replace(/<path\s/g,'<path style="fill:white;stroke:inherit;stroke-width:0.5;') : svgPath[shape];
    const returnEl = mapIcon ? `data:image/svg+xml;utf8,${svgEl.outerHTML}` : svgEl;

    return returnEl as T extends true ? string : (SVGElement | HTMLElement);
};

/**
 * Utility to convert a string to titlecase
 * @param {string} str Input String to Transform
 * @param {string} separator If Input String has no spaces, include the character to convert to spaces
 * @returns {string} Returns the corrected string with each word capitalized and with spaces between them.
 **/
export const makeTitleCase = (str: string, separator?: string): string => str.split(separator || ' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

export const generateTable = <T extends keyof MapTableOpts>(type: T, content: MapTableOpts[T]): HTMLTableElement => {
  const tableHeader: Array<HTMLTableRowElement> = type === 'legend' ? [] : [
    createElementWith(false, 'tr', {
      innerHTML: `<th>${type === 'basic' ? makeTitleCase((content as MapTableOpts['basic']).header,'-') : 'Property'}</th>${type === 'attribute' ? '<th>Value</th>' : ''}`
    })
  ];
  const baseStyle = type === 'legend' ? (content as MapTableOpts['legend']).classes['base'] : undefined;
  const contentArray = type === 'basic' ? undefined : Object.entries(type === 'legend' && content ? (content as MapTableOpts['legend']).classes : (content as MapTableOpts['attribute']).attributes);
  const svgStyling = {
    Line: (fill: string, strokeColor: string, strokeType?: string) => `
      <path d="M15 85 Q 25 50 85 50 L115 50 Q175 50 185 15" style="stroke:${getContrastYIQ(strokeColor)};stroke-width:20;fill:transparent;stroke-linecap:round" />
      <path d="M15 85 Q 25 50 85 50 L115 50 Q175 50 185 15" style="stroke:${strokeColor};${strokeType === 'dashed'?'stroke-dasharray:45 20;':''}stroke-width:12;fill:transparent;stroke-linecap:round" />
    `,
    Polygon: (fill: string, strokeColor: string, strokeType?: string) => `
      <rect x="10" y="10" width="180" height="80" style="fill:${fill};fill-opacity:0.7;stroke-width:10;${strokeType === 'dashed'?'stroke-dasharray:45 20;':''}stroke:${strokeColor}" />
    `
  };
  const pointPatch = (src = '', fill = 'rgb(128,147,241)') => src.startsWith('data:image/svg') ? src.slice(24).replace('fill:white;',`fill:${fill};`) : `<img src='${src}' />`;
  const makePatch = <FT extends 'Point'|'Line'|'Polygon'|'Point-base'>(type: FT, row: LyrConstants[FT]) => type === 'Point'
    ? pointPatch((row as LyrConstants['Point'|'Point-base']).src, (row as LyrConstants['Point'|'Point-base']).fill)
    : `<svg width="1em" height="0.5em" viewBox="0 0 200 100">${svgStyling[type as 'Line'|'Polygon'](
      (row as LyrConstants['Polygon']).fill || (baseStyle as LyrConstants['Polygon']).fill || 'transparent',
      (row as LyrConstants['Polygon'|'Line']).stroke || (baseStyle as LyrConstants['Polygon'|'Line']).stroke || getContrastYIQ((row as LyrConstants['Polygon']).fill || (baseStyle as LyrConstants['Polygon']).fill),
      (row as LyrConstants['Polygon'|'Line']).strokeType
      )}</svg>
  `;
  const legendRow = (type: LyrConstants['feat-type'], row: LyrConstants['Point'|'Line'|'Polygon'|'Point-base']) => `<td class='patch'>${makePatch(type, row)}</td><td class='label'>${row.label}</td>`;
  const tableRows = type === 'basic' ? [
    createElementWith(false, 'tr', {
      innerHTML: `</tr><tr><td>${(content as MapTableOpts['basic']).subheader}</td></tr>`
    })
  ] : contentArray!.filter(a => !['geometry', '_symbol', 'layer'].includes(a[0]))
  .map(e => createElementWith(false, 'tr', {
    innerHTML: type === 'legend' ? legendRow((content as MapTableOpts['legend']).featType, e[1]) : `<td class='prop'>${e[0]}</td><td class='val'>${e[1]}</td>`,
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
 * @param {string} color A hex or rgb string representation of a color
 * @returns {string} Returns a dark or light color that will contrast well with the input.
 **/
  export const getContrastYIQ = (color: string): string => {
    const rgbRaw = color[0] === '#'
      ? color.slice(1).match(/.{2}/g)!.slice(0,3)
      : color.replace(/[a-z\s\(\)]/ig,'').split(',', 3);
    const rgb = rgbRaw.map((i) => parseInt(i, color[0] === '#' ? 16 : undefined));
    const yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;

    return yiq >= 160 ? 'rgba(100,100,100,0.9)' : 'rgba(245,245,245,0.9)';
  };

/**
 * Utility to easily get the Hex color string opacity notation.
 * @param {number} opacity The Opacity Fraction to convert to Hexadecimal. Fn will round to the nearest 10th.
 * @returns {string} returns the two characters to add to the end of a 6 character Hex color string.
 **/
 export const getHexOpacity = (opacity: number): string => {
  const _opacity = Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255).toString(16);
  return  _opacity.padStart(2, '0').toUpperCase();
};

/**
 * @function compare - Function used in .sort() to sort strings in ascending or descending order.
 **/
export const compare = (v1: any, v2: any, asc = true): number => {
  // check if property doesn't exist on either object
  if (!v1 || !v2) return 0;
  const a = typeof v1 === 'string' ? v1.toUpperCase() : v1;
  const b = typeof v2 === 'string' ? v2.toUpperCase() : v2;

  return a === b
    ? 0
    : Number(a > b || -1) * Number(asc || -1);
};
