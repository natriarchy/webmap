import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import Fill from 'ol/style/Fill';
import Icon from 'ol/style/Icon';
import Stroke from 'ol/style/Stroke';
import Style, { StyleFunction } from 'ol/style/Style';
import Text from 'ol/style/Text';
import { LyrConstants, LyrStyleOpts } from '../models';
import { generatePointSVG } from '../utils/fns-utility';

interface IObj<V extends any> {[key: string]: V;}

export class LyrStylr<ST extends LyrConstants['style-type'], FT extends LyrConstants['feat-type']>{
  public type: LyrConstants['style-type'];
  public featType: LyrConstants['feat-type'];
  public opts: LyrStyleOpts<ST, FT>;
  private sizing = {
    xs: {font: "600 0.5rem 'Segoe UI Semibold'", stroke: 2, scale: 0.5},
    sm: {font: "600 0.66rem 'Segoe UI Semibold'", stroke: 3, scale: 0.75},
    rg: {font: "500 0.75rem 'Segoe UI'", stroke: 4, scale: 1},
    lg: {font: "600 0.85rem 'Segoe UI Semibold'", stroke: 5, scale: 1.25},
    xl: {font: "600 1rem 'Segoe UI Semibold'", stroke: 6, scale: 1.5}
  };
  constructor(styleType: ST, featType: FT, opts: LyrStyleOpts<ST, FT>) {
    this.type = styleType;
    this.featType = featType;
    this.opts = opts;
  }
  makeStyleFn(_lyrType: 'VectorLayer'|'VectorTileLayer'): Style|Array<Style>|StyleFunction {
    const _labelOpts = this.opts.labels;
    const _baseOpts = this.opts.base;
    const _keyProp = this.opts.keyProp || '';
    const _textStyle = _labelOpts ? this.makeText(this.featType, _labelOpts) : undefined;
    const _classObj: IObj<LyrConstants[FT]> = this.type.startsWith('ramp') ? (this.opts as any).classes : {};
    const _strDivider = this.strDivider;
    const checkPoint = () => !String((_baseOpts as any)['src']).match(/^(http|assets)/i);
    if (this.featType === 'Point' && this.type === 'basic' && checkPoint()) {
      (_baseOpts as any).src = generatePointSVG(
        (this.opts.base as any).src ?? 'geo-alt-filled' as any,
        true,
        {style: ['-webkit-',''].map(i => `${i}filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.3))`).join(';') + `;stroke:black;`}
      );
    }
    const _makeStyle = this[`make${this.featType}Style`].bind(this) as (opts: FT extends 'Point' ? LyrConstants['Point-base'] : LyrConstants[FT]) => Style | Array<Style>;
    return function styleFn(feat: Feature<any> | RenderFeature, res: number): Style|Array<Style> {
      const lyrType = _lyrType;
      const labels = _labelOpts;
      const textStyle = _textStyle;
      const keyVal = !_keyProp && lyrType === 'VectorTileLayer' ? feat.getId() : feat.get(_keyProp);
      const newStyle = _makeStyle(Object.assign(_baseOpts, keyVal && _classObj.hasOwnProperty(keyVal) ? _classObj[keyVal] : {}));
      const validRes = (current: number, min = 0, max = Infinity) => [min, max] !== [0, Infinity] ? (current >= min && current <= max) : true;
      if (lyrType === 'VectorLayer') (feat as Feature<any>).setId(keyVal || 'N/A');
      if (textStyle && labels && validRes(res, labels.resolution?.min, labels.resolution?.max)) {
        textStyle.setText(lyrType === 'VectorTileLayer' ? feat.getId() : (feat.get(labels.prop) || ''));
        Array.isArray(newStyle) ? newStyle[newStyle.length - 1].setText(textStyle) : newStyle.setText(textStyle);
      };
      return newStyle;
    };
  }

  makeText = (featType: string, opts: LyrConstants['labels']): Text => new Text({
    font: `${this.sizing[opts.size||'rg'].font},Verdana,sans-serif`,
    textAlign: featType === 'Point' ? 'left' : 'center',
    overflow: true,
    placement: featType === 'Line' ? 'line' : 'point',
    padding: [1, 5, 1, 5],
    fill: new Fill({color: opts.fill || '#F0F0F0'}),
    stroke: new Stroke({color: opts.stroke || this.reColor('contrast', opts.fill || '#d3d3d3'), width: this.sizing[opts.size||'rg'].stroke}),
    ...(opts.offset && {offsetX: opts.offset[0], offsetY: opts.offset[1]}),
    ...(!opts.offset && featType === 'Point' && {offsetX: 15, offsetY: -10 })
  });

  makePointStyle = (opts: LyrConstants['Point-base']): Style|Array<Style> => new Style({
    image: new Icon({
      scale: this.sizing[opts.size || 'rg'].scale,
      crossOrigin: 'anonymous',
      src: opts.src,
      ...(!String(opts.src).match(/(.png|.jpg|.jpeg)$/i) && {color: opts.fill || '#03899c', displacement: [0,10], imgSize: [20,21]})
    })
  });

  makeLineStyle = (opts: LyrConstants['Line']): Array<Style> => [
    {color: this.reColor('contrast', opts.stroke), width: 4.5, lineDash: undefined},
    {color: opts.stroke, width: 1.5, lineDash: opts.strokeType === 'dashed' ? [5,2] : undefined}
  ].map(
    (v,i) => new Style({stroke: new Stroke({lineCap: 'round', lineJoin: 'round', ...v}), zIndex: i})
  );

  makePolygonStyle = (opts: LyrConstants['Polygon']): Style => new Style({
    fill: ['basic','ramp-basic','ramp-special'].includes(this.type)
      ? new Fill({color: this.reColor('opacity', opts.fill, 0.5)})
      : undefined,
    stroke: new Stroke({
      color: opts.stroke || 'rgba(150,150,150,0.5)',
      width: 1,
      lineCap: 'round',
      lineJoin: 'round',
      lineDash: opts.strokeType === 'dashed' ? [5,2.5] : undefined
    })
  });

  strDivider = (text: string, width=15, divChar='\n'): string => {
    const str = text.replace(/(Redevelopment|District|Census|Tract)/gi, '');
    if (str.length > width) {
        let p = width;
        while (p > 0 && ![' ','-'].includes(str[p])) p--;
        const left = str.slice(0, str.slice(p, p + 1) === '-' ? p + 1 : p);
        const leftTitle = left.toLowerCase().replace(/\w+/g, t => t[0].toUpperCase() + t.slice(1));
        if (p > 0) return `${leftTitle}${divChar}${this.strDivider(str.slice(p + 1), width, divChar)}`;
    }

    return str;
  };

  /**
  * Utility to easily set opacity or get a contrasting color for any rgb, rgba or hex color string.
  * If type is 'contrast', generates a simplified brightness score (YIQ) for a given color.
  * If the YIQ is above 159 then it's considered a bright color.
  * @param {'opacity'|'contrast'} type whether to just set opacity or get contrasting color
  * @param {string} color An rgb, rgba or hex color (3, 6 or 8 character) string.
  * @param {number} opacity The Opacity level to apply to the final color.
  * @returns {string} returns the same color with the input opacity level in the original notation.
  **/
  reColor = (type: 'opacity'|'contrast', color: string, opacity = 0.8): string => {
    const isHex = color[0] === '#';
    // if 3 character hex string (i.e. #fff) make normal 6 character hex
    const _color = color.length === 4 ? color.split('').map((v,i) => i < 1 ? v : v + v).join('') : color;
    const rgbRaw = isHex ? _color.slice(1).match(/.{2}/g)!.slice(0,3) : _color.replace(/[a-z\s\(\)]/ig,'').split(',', 3);
    const _hexOpacity = () => Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255).toString(16).padStart(2, '0');
    const getYiq = () => rgbRaw.map(i => parseInt(i, isHex ? 16 : undefined)).reduce((s,v,i) => s + (v * [299, 587, 114][i])) / 1000;
    if (type === 'opacity') {
      return isHex ? `#${rgbRaw.join('')}${_hexOpacity()}`.toUpperCase() : `rgba(${rgbRaw.join(',')},${opacity})`;
    } else {
      return getYiq() >= 128 ? `rgba(100,100,100,${opacity})` : `rgba(245,245,245,${opacity})`;
    }
  };

  // getWeightedAvgSideAngle = (feat: any) => {
  //   const arrPoints = feat.getGeometry().getCoordinates()[0];

  //   const sideAngles: Array<[number,number]> = [];

  //   for (let i = 1; i < arrPoints.length; i++) {
  //     const pointFrom = arrPoints[i - 1];
  //     const pointTo = arrPoints[i];

  //     const xDiff = pointFrom[0] - pointTo[0];
  //     const yDiff = pointFrom[1] - pointTo[1];

  //     const sqDistance = xDiff * xDiff + yDiff * yDiff;
  //     const curRotation = Math.atan(-yDiff / xDiff);
  //     sideAngles.push([Number(curRotation.toFixed(2)),Number(sqDistance.toFixed(2))]);
  //   }
  //   const weightAvg = sideAngles.reduce((sum, a) => sum + (a[0] * a[1]), 0)/sideAngles.reduce((sum, a) => sum + a[1], 0);
  //   return weightAvg;
  // };
}
