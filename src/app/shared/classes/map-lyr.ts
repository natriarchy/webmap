import Feature from 'ol/Feature';
import { GeoJSON, MVT as MVTFormat } from 'ol/format';
import { Layer, Tile as TileLayer, Vector as VectorLayer, VectorTile as VectorTileLayer } from 'ol/layer';
import RenderFeature from 'ol/render/Feature';
import { Vector as VectorSource, VectorTile as VectorTileSource, XYZ } from 'ol/source';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
import { LyrConstants, LyrInitSrc, LyrInitState, LyrStyleOpts } from '../models';

const makeSVG = (
  shape: 'geo-alt-filled'|'geo-alt-fill'|'house'|'info-circle-fill',
  attrs?:  {[prop: string]: any }
  ): string => {
    const svgPath: {[key: string]: string} = {
      'geo-alt-filled': `
        <path style="fill:white;stroke:black;stroke-width:0.33px;" d="M6,15.772s5.835-5.546,5.835-9.755C11.835,2.785,9.223,.165,6,.165S.165,2.785,.165,6.018C.165,10.226,6,15.772,6,15.772Z"/>
        <circle fill="rgba(0,0,0,0.33)" stroke="rgba(0,0,0,0.33)" cx="6" cy="6" r="2.25"/>
        `,
      'geo-alt-fill': `
        <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"/>
        `,
      'house': `
        <path fill-rule="evenodd" d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/>
        <path fill-rule="evenodd" d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"/>
        `,
      'info-circle-fill': `
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
        `
    };
    const baseAttrs = {
      xmlns: 'http://www.w3.org/2000/svg',
      viewBox: '0 0 16 16',
      height: '21',
      width: '20',
      fill: 'currentColor',
      stroke: 'none'
    };
    const svgEl = document.createElementNS(baseAttrs['xmlns'], 'svg');
    Object.entries(baseAttrs).forEach(e => svgEl.setAttribute(e[0], e[1]));
    if (attrs) Object.entries(attrs).forEach(attr => { svgEl.setAttribute(attr[0], attr[1]); });
    svgEl.innerHTML = shape !== 'geo-alt-filled' ? svgPath[shape].replace(/<path\s/g,'<path style="fill:white;stroke:inherit;stroke-width:0.5;') : svgPath[shape];
    return `data:image/svg+xml;utf8,${svgEl.outerHTML}`;
};

export class Lyr<LT extends LyrConstants['layer-type']>{
  instance: Layer<any, any>;
  type: LyrConstants['layer-type'];
  src: LyrInitSrc<LT>;
  styleOpts?: {style: LyrConstants['style-type'], geom: LyrConstants['feat-type'], opts: LyrStyleOpts<any, any>};
  lyrStyleFn?: (feat: Feature<any> | RenderFeature, res: number) => Style|Array<Style>;

  sizeLvl = {xs: 0, sm: 1, rg: 2, lg: 3, xl: 4};
  // ArcGIS Beaded Pastel from https://developers.arcgis.com/javascript/latest/visualization/symbols-color-ramps/esri-color-ramps/
  colorRamp = ['#e65154','#26b6ff','#67e6d1','#cd76d6','#ffca8c','#fff2b3','#ff8cd9','#d99d5b','#c8f2a9','#d4b8ff'];

  constructor(type: LT, state: LyrInitState, src: LyrInitSrc<LT>) {
      this.type = type;
      this.src = src;
      const baseLyrObj = Object.assign(state, {
        className: state.className.replace(/(_|\s)/gi, '-').toLowerCase(),
        lyrType: type,
        visible: state.visible ? state.visible : false
      });
      this.instance = this.generateLayer(baseLyrObj, src);
  }

  generateLayer(opts: LyrInitState, src: LyrInitSrc<LT>): Layer<any, any> {
    switch (this.type) {
      case 'TileLayer': return new TileLayer({
          ...opts,
          preload: Infinity,
          source: new XYZ({ crossOrigin: 'anonymous', url: src.url, attributions: src.attr })
        });
      case 'VectorTileLayer': return new VectorTileLayer({
          ...opts,
          source: new VectorTileSource({
            format: new MVTFormat({ idProperty: (src as LyrInitSrc<'VectorTileLayer'>).idProp }),
            url: src.url,
            overlaps: false,
            attributions: src.attr
          })
        });
      default: return new VectorLayer({
          ...opts,
          source: new VectorSource({
            url: src.url,
            format: new GeoJSON({featureProjection: 'EPSG:4326'}),
            attributions: src.attr
          })
        });
    };
  }

  addStyle<ST extends LyrConstants['style-type'], FT extends LyrConstants['feat-type']>(
    style: ST,
    geom: FT,
    opts: LyrStyleOpts<ST, FT>
  ): Lyr<LT> {
    if (this.type === 'TileLayer') return this;
    const _baseOpts = opts.base;
    const _classObj: {[key: string]: LyrConstants[FT]} = style.startsWith('ramp') ? (opts as any).classes : {};
    const _makeStyle = this.baseStyle(geom, style);
    const _strDiv = (txt: string, len = 25, sep = '\n'): string => {
      const str = txt.replace(/(\(.+\)|Redev\w+|Census|Tract)/gi,'');
      if (str.length > len) {
          let p = len;
          const vals = (val?: string) => new Set(['-','/'].concat(val || []));
          while (p > 0 && !vals(' ').has(str[p])) p--;
          const leftStr = str.slice(0, vals().has(str[p]) ? p + 1 : p);
          const left = leftStr.replace(/\w+?('\w+)/g, w => new Set(['to','and','of','a','the']).has(w) ? w : w[0].toUpperCase() + w.slice(1).toLowerCase());
          if (p > 0) return `${left}${sep}${_strDiv(str.slice(p + 1), len, sep)}`;
      }

      return str;
    };

    const notUri = !String((_baseOpts as any).src).match(/^(http|assets)/i);
    if (geom === 'Point' && style === 'basic' && notUri) (_baseOpts as any).src = makeSVG(
      (opts.base as any).src || 'geo-alt-filled',
      {style: ['-webkit-',''].map(i => `${i}filter: drop-shadow(0px 2px 3px rgba(0,0,0,0.3))`).join(';') + `;stroke:black;`}
    );

    this.lyrStyleFn = (feat: Feature<any> | RenderFeature, res: number): Style|Array<Style> => {
      const labels = opts.labels;
      const textStyle = opts.labels ? this.makeText(geom, opts.labels) : undefined;
      const keyProp = opts.keyProp || '';
      const keyVal = !keyProp && this.type === 'VectorTileLayer' ? feat.getId() : feat.get(keyProp);
      const newStyle = _makeStyle(Object.assign(_baseOpts, keyVal && _classObj.hasOwnProperty(keyVal) ? _classObj[keyVal] : {}));
      const validRes = (current: number, min = 0, max = Infinity) => [min, max] !== [0, Infinity] ? (current >= min && current <= max) : true;
      if (this.type === 'VectorLayer') (feat as Feature<any>).setId(keyVal || 'N/A');
      if (textStyle && labels && validRes(res, labels.resolution?.min, labels.resolution?.max)) {
        textStyle.setText(
          _strDiv(String(this.type === 'VectorTileLayer' ? feat.getId() : feat.get(labels.prop)))
          );
        Array.isArray(newStyle) ? newStyle[newStyle.length - 1].setText(textStyle) : newStyle.setText(textStyle);
      };
      return newStyle;
    };

    if (this.type === 'VectorLayer' && style === 'ramp-basic') {
      this.instance.getSource().once('featuresloadend', (e: any) => {
        const cats: Array<string> = Array.from(new Set(e.features!.map((f: any) => String(f.get(opts.keyProp)))));
        (opts as LyrStyleOpts<'ramp-basic', any>).classes = cats.reduce((p,v,i) => ({ ...p, [v]: {fill: this.colorRamp[i], label: v}}), {});
        (this.instance as VectorLayer<any>).setStyle(this.lyrStyleFn);
        this.styleOpts = {style: style, geom: geom, opts: opts};
        this.instance.set('styleDetails', {style: style, geom: geom, opts: opts});
      });
    } else {
      (this.instance as VectorLayer<any> | VectorTileLayer).setStyle(this.lyrStyleFn);
    };
    this.styleOpts = {style: style, geom: geom, opts: opts};
    this.instance.set('styleDetails', this.styleOpts);
    return this;
  }

  // Styling Functions
  private baseStyle(geom: LyrConstants['feat-type'], style: LyrConstants['style-type']): (opts: any) => Style | Array<Style> {
    const stroke = (stroke = 'rgba(150,150,150,0.5)', width: number, type?: 'solid'|'dashed'): Stroke => new Stroke(
      {color: stroke,width: width, lineDash: type === 'dashed' ? [5,4] : undefined}
    );
    if (geom === 'Point') {
      return (opts: LyrConstants['Point-base']) => new Style({
        image: new Icon({
          scale: (this.sizeLvl[opts.size||'rg'] * 0.25) + 0.5,
          crossOrigin: 'anonymous',
          src: opts.src,
          ...(!String(opts.src).match(/(.png|.jpg|.jpeg)$/i) && {color: opts.fill || '#03899c', displacement: [0,10], imgSize: [20,21]})
        })
      });
    } else if (geom === 'Line') {
      return (opts: LyrConstants['Line']) => [
        stroke(this.reColor('contrast', opts.stroke), 4.5),
        stroke(opts.stroke, 1.5, opts.strokeType)
      ].map(
        (v,i,a) => new Style({stroke: v, zIndex: i})
      );
    } else {
      return (opts: LyrConstants['Polygon']) => [
        stroke(this.reColor('contrast', opts.stroke||'rgba(150,150,150,0.5)', 0.5), 4.5),
        stroke(opts.stroke, 1.5, opts.strokeType),
      ].slice(style === 'boundary' ? 0 : 1).map(
        (v,i,a) => new Style({
          stroke: v,
          zIndex: i,
          ...(style !== 'boundary' && {fill: new Fill({color: this.reColor('opacity', opts.fill, 0.5)})})
        })
      );
    };
  }

  private makeText(geom: LyrConstants['feat-type'], opts: LyrConstants['labels']) {
    return new Text({
      font: `${(opts.size||'rg') === 'rg' ? 5 : 6}00 ${(this.sizeLvl[opts.size||'rg'] * 0.125) + 0.5}rem 'Segoe UI',Verdana,sans-serif`,
      textAlign: geom === 'Point' ? 'left' : 'center',
      overflow: true,
      placement: geom === 'Line' ? 'line' : 'point',
      padding: [1, 5, 1, 5],
      fill: new Fill({color: opts.fill || '#F0F0F0'}),
      stroke: new Stroke({color: opts.stroke || this.reColor('contrast', opts.fill||'#d3d3d3'), width: this.sizeLvl[opts.size||'rg'] + 2}),
      ...(opts.offset && {offsetX: opts.offset[0], offsetY: opts.offset[1]}),
      ...(!opts.offset && geom === 'Point' && {offsetX: 15, offsetY: -10 })
    });
  }

  // Utility to easily set opacity or get a contrasting color for any rgb, rgba or hex color string.
  // If type is 'contrast', generates a simplified brightness score (YIQ) for a given color.
  private reColor(type: 'opacity'|'contrast', color: string, opacity = 0.8): string {
    const isHex = color[0] === '#';
    // if 3 character hex string (i.e. #fff) make normal 6 character hex
    const _color = color.length === 4 ? color.split('').map((v,i) => i < 1 ? v : v + v).join('') : color;
    // separate 3 color channels into a string array
    const rgbRaw = isHex ? _color.slice(1).match(/.{2}/g)!.slice(0,3) : _color.replace(/[a-z\s\(\)]/ig,'').split(',', 3);
    if (type === 'opacity') {
      const _opacity = !isHex ? opacity : Math.round(Math.min(Math.max(opacity || 1, 0), 1) * 255).toString(16).padStart(2, '0');
      return isHex ? `#${rgbRaw.join('')}${_opacity}`.toUpperCase() : `rgba(${rgbRaw.join(',')},${_opacity})`;
    } else {
      const yiqVal = rgbRaw.reduce((s,v,i) => s + (parseInt(v, isHex ? 16 : 10) * [299, 587, 114][i]), 0) / 1000;
      // If the YIQ is above 155 then it's considered a bright color.
      return yiqVal >= 155 ? `rgba(100,100,100,${opacity})` : `rgba(245,245,245,${opacity})`;
    }
  }
}
