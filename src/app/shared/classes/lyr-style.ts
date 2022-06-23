import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
import { StyleFunction } from 'ol/style/Style';
import { LyrConstants, LyrStyleOpts } from '../models';
import { generatePointSVG } from '../utils/fns-utility';

export class LyrStylr<ST extends LyrConstants['style-type'], FT extends LyrConstants['feat-type']>{
  type: LyrConstants['style-type'];
  geom: LyrConstants['feat-type'];
  opts: LyrStyleOpts<ST, FT>;

  makeStyleFn: (type: 'VectorLayer'|'VectorTileLayer') => Style|Array<Style>|StyleFunction;

  constructor(type: ST, geom: FT, opts: LyrStyleOpts<ST, FT>) {
    this.type = type;
    this.geom = geom;
    this.opts = opts;

    // Utility to easily set opacity or get a contrasting color for any rgb, rgba or hex color string.
    // If type is 'contrast', generates a simplified brightness score (YIQ) for a given color.
    const reColor = (type: 'opacity'|'contrast', color: string, opacity = 0.8): string => {
      const isHex = color[0] === '#';
      // if 3 character hex string (i.e. #fff) make normal 6 character hex
      const _color = color.length === 4 ? color.split('').map((v,i) => i < 1 ? v : v + v).join('') : color;
      // separate 3 color channels into a string array
      const rgbRaw = isHex ? _color.slice(1).match(/.{2}/g)!.slice(0,3) : _color.replace(/[a-z\s\(\)]/ig,'').split(',', 3);
      if (type === 'opacity') {
        const _opacity = !isHex ? opacity : Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255).toString(16).padStart(2, '0');
        return isHex ? `#${rgbRaw.join('')}${_opacity}`.toUpperCase() : `rgba(${rgbRaw.join(',')},${_opacity})`;
      } else {
        const yiqVal = rgbRaw.reduce((s,v,i,a) => s + (parseInt(v, isHex ? 16 : 10) * [299, 587, 114][i]), 0) / 1000;
        // If the YIQ is above 128 then it's considered a bright color.
        return yiqVal >= 155 ? `rgba(100,100,100,${opacity})` : `rgba(245,245,245,${opacity})`;
      }
    };
    const sizeLvl = (size: 'xs'|'sm'|'rg'|'lg'|'xl' = 'rg') => ['xs','sm','rg','lg','xl'].indexOf(size);
    const stroke = (stroke = 'rgba(150,150,150,0.5)', width: number, type?: 'solid'|'dashed'): Stroke => new Stroke(
      {color: stroke,width: width, lineDash: type === 'dashed' ? [5,4] : undefined}
    );
    const strDiv = (txt: string, len = 25, sep = '\n'): string => {
      const str = txt.replace(/(\(.+\)|Redev\w+|Census|Tract)/gi,'');
      if (str.length > len) {
          let p = len;
          const vals = (val?: string) => new Set(['-','/'].concat(val || []));
          while (p > 0 && !vals(' ').has(str[p])) p--;
          const leftStr = str.slice(0, vals().has(str[p]) ? p + 1 : p);
          const left = leftStr.replace(
            /\w+?('\w+)/g,
            t => new Set(['to','and','of','a','the']).has(t) ? t : t[0].toUpperCase() + t.slice(1).toLowerCase()
          );
          if (p > 0) return `${left}${sep}${strDiv(str.slice(p + 1), len, sep)}`;
      }

      return str;
    };

    let makeStyle: (opts: any) => Style | Array<Style>;
    if (geom === 'Point') {
      makeStyle = (opts: LyrConstants['Point-base']) => new Style({
        image: new Icon({
          scale: (sizeLvl(opts.size) * 0.25) + 0.5,
          crossOrigin: 'anonymous',
          src: opts.src,
          ...(!String(opts.src).match(/(.png|.jpg|.jpeg)$/i) && {color: opts.fill || '#03899c', displacement: [0,10], imgSize: [20,21]})
        })
      });
    } else if (geom === 'Line') {
      makeStyle = (opts: LyrConstants['Line']) => [
        stroke(reColor('contrast', opts.stroke), 4.5),
        stroke(opts.stroke, 1.5, opts.strokeType)
      ].map(
        (v,i,a) => new Style({stroke: v, zIndex: i})
      );
    } else {
      makeStyle = (opts: LyrConstants['Polygon']) => [
        stroke(reColor('contrast', opts.stroke||'rgba(150,150,150,0.5)', 0.5), 4.5),
        stroke(opts.stroke, 1.5, opts.strokeType),
      ].slice(this.type === 'boundary' ? 0 : 1).map(
        (v,i,a) => new Style({
          stroke: v,
          zIndex: i,
          ...(this.type !== 'boundary' && {fill: new Fill({color: reColor('opacity', opts.fill, 0.5)})})
        })
      );
    };

    const makeText = (opts: LyrConstants['labels']) => new Text({
        font: `${(opts.size||'rg') === 'rg' ? 5 : 6}00 ${(sizeLvl(opts.size) * 0.125) + 0.5}rem 'Segoe UI',Verdana,sans-serif`,
        textAlign: geom === 'Point' ? 'left' : 'center',
        overflow: true,
        placement: geom === 'Line' ? 'line' : 'point',
        padding: [1, 5, 1, 5],
        fill: new Fill({color: opts.fill || '#F0F0F0'}),
        stroke: new Stroke({color: opts.stroke || reColor('contrast', opts.fill || '#d3d3d3'), width: sizeLvl(opts.size) + 2}),
        ...(opts.offset && {offsetX: opts.offset[0], offsetY: opts.offset[1]}),
        ...(!opts.offset && geom === 'Point' && {offsetX: 15, offsetY: -10 })
    });

    this.makeStyleFn = lt => {
      const _labelOpts = opts.labels;
      const _baseOpts = opts.base;
      const _keyProp = opts.keyProp || '';
      const _textStyle = _labelOpts ? makeText(_labelOpts) : undefined;
      const _classObj: {[key: string]: LyrConstants[FT]} = type.startsWith('ramp') ? (opts as any).classes : {};
      const _strDivider = strDiv;
      const checkPoint = () => !String((_baseOpts as any)['src']).match(/^(http|assets)/i);
      if (geom === 'Point' && type === 'basic' && checkPoint()) {
        (_baseOpts as any).src = generatePointSVG(
          (opts.base as any).src || 'geo-alt-filled' as any,
          true,
          {style: ['-webkit-',''].map(i => `${i}filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.3))`).join(';') + `;stroke:black;`}
        );
      }
      const _makeStyle = makeStyle.bind(this) as (opts: FT extends 'Point' ? LyrConstants['Point-base'] : LyrConstants[FT]) => Style | Array<Style>;
      return function styleFn(feat: Feature<any> | RenderFeature, res: number): Style|Array<Style> {
        const lyrType = lt;
        const labels = _labelOpts;
        const textStyle = _textStyle;
        const keyVal = !_keyProp && lyrType === 'VectorTileLayer' ? feat.getId() : feat.get(_keyProp);
        const newStyle = _makeStyle(Object.assign(_baseOpts, keyVal && _classObj.hasOwnProperty(keyVal) ? _classObj[keyVal] : {}));
        const validRes = (current: number, min = 0, max = Infinity) => [min, max] !== [0, Infinity] ? (current >= min && current <= max) : true;
        if (lyrType === 'VectorLayer') (feat as Feature<any>).setId(keyVal || 'N/A');
        if (textStyle && labels && validRes(res, labels.resolution?.min, labels.resolution?.max)) {
          textStyle.setText(
            _strDivider(String(lyrType === 'VectorTileLayer' ? feat.getId() : feat.get(labels.prop)))
            );
          Array.isArray(newStyle) ? newStyle[newStyle.length - 1].setText(textStyle) : newStyle.setText(textStyle);
        };
        return newStyle;
      };
    };
  }
}
