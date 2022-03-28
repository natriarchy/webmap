import { BSIconOptions, svgPath } from "./constants";

export function createElementWith<T extends boolean, SVGType extends keyof SVGElementTagNameMap, HTMLType extends keyof HTMLElementTagNameMap>(
  svgNamespace: T,
  elementType: SVGType | HTMLType,
  setAttributes: {[key: string]: any}
  ): T extends true ? SVGElementTagNameMap[SVGType] : HTMLElementTagNameMap[HTMLType] {
  const newElement = svgNamespace
    ? document.createElementNS(`http://www.w3.org/2000/${elementType}`, elementType)
    : document.createElement(elementType);
  Object.entries(setAttributes).forEach(i => {
    if (i[0] === 'innerHTML') {
      newElement.innerHTML = i[1];
    } else if (typeof i[1] === 'string' || i[0].startsWith('data')) {
      newElement.setAttribute(i[0], i[1]);
    } else {
      Object.assign(newElement, Object.fromEntries([i]));
    };
  });

  return newElement as T extends true ? SVGElementTagNameMap[SVGType] : HTMLElementTagNameMap[HTMLType];
};

export const generatePointSVG = (shape: BSIconOptions, mapIcon = false, setAttributes?: {[prop: string]: any}): SVGSVGElement => {
  const svgEl = createElementWith(true, 'svg', {
    'xmlns': 'http://www.w3.org/2000/svg',
    'viewBox': '0 0 16 16',
    'height': mapIcon ? '21' : '1em',
    'width': mapIcon ? '20' : '1em',
    'fill': 'currentColor',
    'stroke': 'none'
  });
  if (setAttributes) Object.entries(setAttributes).forEach(attr => { svgEl.setAttribute(attr[0],attr[1]); });
  svgEl.innerHTML = mapIcon ? svgPath[shape].replace(/<path\s/g, '<path fill="white" stroke="inherit" stroke-width="1"') : svgPath[shape];

  return svgEl;
};

export const makeTitleCase = (str: string, separator: string): string => str.split(separator || ' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

export const generateAttrTable = (
  header: string,
  subheader: string,
  attributes?: {[key: string]: any}
  ): HTMLTableElement => {
  const newTable = createElementWith(false, 'table', { class: 'attribute-table', innerHTML: `<tr><th>${makeTitleCase(header,'-')}</th></tr><tr><td>${subheader}</td></tr>` });
  if (attributes) Object.entries(attributes).filter(a => !['geometry','_symbol','layer'].includes(a[0]) && header !== a[1]).forEach(entry => {
    const newRow = createElementWith(false, 'tr', {
      class: 'attribute-row',
      innerHTML: `<td class='attribute-prop'>${entry[0]}</td><td class='attribute-val'>${entry[1]}</td>`
    });
    newTable.appendChild(newRow);
  });

  return newTable;
};

export const getContrastYIQ = (colorString: string): string => {
  const colorType = colorString[0] === '#' ? 'hex' : 'rgb';
  const yiqCalc = (r: number, g: number, b: number): number => ((r * 299) + (g * 587) + (b * 114)) / 1000;
  const colorStringFix = colorType === 'hex' ? colorString.slice(1) : colorString.replace(/^(rgba?\()/i, '').slice(0,-1);
  const rgbObj = {
    r: colorType === 'hex' ? parseInt(colorStringFix.slice(0, 2), 16) : parseInt(colorStringFix.split(',')[0]),
    g: colorType === 'hex' ? parseInt(colorStringFix.slice(2, 4), 16) : parseInt(colorStringFix.split(',')[1]),
    b: colorType === 'hex' ? parseInt(colorStringFix.slice(4, 6), 16) : parseInt(colorStringFix.split(',')[2])
  };

  return yiqCalc(rgbObj.r, rgbObj.g, rgbObj.b) >= 160 ? 'rgba(100,100,100,0.9)' : 'rgba(245,245,245,0.9)';
};

export const convertToHexOpacity = (opacityDecimal: number): string => {
  const hexOpacities: {[key: string]: string} = {
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

  return hexOpacities[opacityDecimal.toFixed(1) as string];
};
