import { FeatureLike } from 'ol/Feature';
import { GeoJSON, MVT as MVTFormat } from 'ol/format';
import { Layer, Tile as TileLayer, Vector as VectorLayer, VectorTile as VectorTileLayer } from 'ol/layer';
import { Vector as VectorSource, VectorTile as VectorTileSource, XYZ } from 'ol/source';
import { generalColorRamps } from './constants';
import { basicStyleFunction } from './generate-style';
import { StyleDetailObj } from '../models';

export function makeLayer(
    lyrGroup: string,
    lyrName: string,
    lyrType: 'TileLayer' | 'VectorTileLayer' | 'VectorLayer',
    lyrZIndex: number,
    initVisible = false,
    srcUrl: string,
    srcAttribution: Array<string>,
    srcDescription: string,
    styleDetail: StyleDetailObj
  ): Layer<any, any> {
    const baseLyrObj = (obj: object) => Object.assign({
      className: lyrName.replace(/(_|\s)/gi, '-').toLowerCase(),
      olLyrType: lyrType,
      group: lyrGroup,
      zIndex: lyrZIndex,
      visible: initVisible,
      minResolution: styleDetail.limits?.minResolution,
      maxResolution: styleDetail.limits?.maxResolution,
      minZoom: styleDetail.limits?.minZoom,
      maxZoom: styleDetail.limits?.maxZoom,
      srcDescription: srcDescription
    }, obj);
    let newLyr: Layer<any, any>;
    if (lyrType === 'TileLayer') {
      newLyr = new TileLayer(baseLyrObj({
        preload: Infinity,
        source: new XYZ({ crossOrigin: 'anonymous', url: srcUrl, attributions: srcAttribution })
      }));
    } else if (lyrType === 'VectorTileLayer') {
      newLyr = new VectorTileLayer(baseLyrObj({
        source: new VectorTileSource({
          format: new MVTFormat({ idProperty: styleDetail.idProp }),
          url: srcUrl,
          overlaps: false,
          attributions: srcAttribution
        }),
        style: (feat: FeatureLike, resolution: number) => basicStyleFunction(feat, resolution, styleDetail, {name: lyrName, type: lyrType})
      }));
    } else if (lyrType === 'VectorLayer' && styleDetail.type !== 'ramp-basic') {
      if (styleDetail.classObject === undefined) styleDetail.classObject = {'all': {fill: generalColorRamps.bright[lyrZIndex], label: styleDetail.keyProp ? styleDetail.keyProp : lyrName.replace(/s$/,''), iconSrc: styleDetail.icon?.src}};
      newLyr = new VectorLayer(baseLyrObj({
        source: new VectorSource({ url: srcUrl, format: new GeoJSON({featureProjection: 'EPSG:4326'}), attributions: srcAttribution }),
        style: (feat: FeatureLike, resolution: number) => basicStyleFunction(feat, resolution, styleDetail, {name: lyrName, type: lyrType})
      }));
    } else {
      const newSrc = new VectorSource({ url: srcUrl, format: new GeoJSON({featureProjection: 'EPSG:4326'}), attributions: srcAttribution });
      newLyr = new VectorLayer(baseLyrObj({ source: newSrc }));
      newSrc.once('featuresloadend', (e) => {
        const uniqueCats: Array<string> = Array.from(new Set(e.features!.map((feat: any) => feat.get(styleDetail.keyProp))));
        styleDetail.classObject = uniqueCats.reduce((a, v, i) => ({ ...a, [v]: {fill: generalColorRamps.basic[i], label: v}}), {});
        (newLyr as VectorLayer<any>).setStyle((feat: FeatureLike, resolution: number) => basicStyleFunction(
            feat,
            resolution,
            styleDetail,
            {name: lyrName, type: lyrType}
          ));
        newLyr.set('styleDetails', styleDetail);
      });
    };
    newLyr.set('styleDetails', styleDetail);

  return newLyr;
};


