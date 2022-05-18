import { GeoJSON, MVT as MVTFormat } from 'ol/format';
import { Layer, Tile as TileLayer, Vector as VectorLayer, VectorTile as VectorTileLayer } from 'ol/layer';
import { Vector as VectorSource, VectorTile as VectorTileSource, XYZ } from 'ol/source';
import { LyrConstants, LyrInitSrc, LyrInitState, LyrStyleOpts } from '../models';
import { generalColorRamps } from '../utils/constants';
import { LyrStylr } from './lyr-style';

export class Lyr<LT extends LyrConstants['layer-type']>{
  instance: Layer<any, any>;
  lyrType: LyrConstants['layer-type'];
  src: LyrInitSrc<LT>;
  styleOpts?: {styleType: LyrConstants['style-type'], featType: LyrConstants['feat-type'], opts: LyrStyleOpts<any, any>};
  constructor(lyrType: LT, state: LyrInitState, src: LyrInitSrc<LT>) {
      this.lyrType = lyrType;
      this.src = src;
      const baseLyrObj = Object.assign(state, {
        className: state.className.replace(/(_|\s)/gi, '-').toLowerCase(),
        lyrType: lyrType,
        visible: state.visible ? state.visible : false
      });
      this.instance = this.generateLayer(baseLyrObj, src);
  }
  generateLayer(opts: LyrInitState, src: LyrInitSrc<LT>): Layer<any, any> {
    switch (this.lyrType) {
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
  setStyle(
    styleType: LyrConstants['style-type'],
    featType: LyrConstants['feat-type'],
    opts: LyrStyleOpts<any, any>
    ): Lyr<LT> {
    const lyrType = this.lyrType;
    if (lyrType !== 'TileLayer' && styleType !== 'ramp-basic') {
      const newStyle = new LyrStylr(styleType, featType, opts);
      (this.instance as VectorLayer<any> | VectorTileLayer).setStyle(newStyle.makeStyleFn(lyrType));
    } else if (lyrType === 'VectorLayer' && styleType === 'ramp-basic') {
      this.instance.getSource().once('featuresloadend', (e: any) => {
        const uniqueCats: Array<string> = Array.from(new Set(e.features!.map((feat: any) => feat.get(opts.keyProp))));
        (opts as LyrStyleOpts<'ramp-basic', any>).classes = uniqueCats.reduce((a, v, i) => ({ ...a, [v]: {fill: generalColorRamps.basic[i], label: v}}), {});
        (this.instance as VectorLayer<any>).setStyle(new LyrStylr(styleType, featType, opts).makeStyleFn(lyrType));
        this.instance.set('styleDetails', {styleType: styleType, featType: featType, opts: opts});
      });
    };
    this.styleOpts = {styleType: styleType, featType: featType, opts: opts};
    this.instance.set('styleDetails', this.styleOpts);
    return this;
  }
}

