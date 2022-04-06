import { Feature } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { GeoJSON, MVT as MVTFormat } from 'ol/format';
import { Layer, Tile as TileLayer, Vector as VectorLayer, VectorTile as VectorTileLayer } from 'ol/layer';
import { Vector as VectorSource, VectorTile as VectorTileSource, XYZ } from 'ol/source';
import { Fill, Icon, Stroke, Style, Text } from 'ol/style';
import { BSIconOptions, generalColorRamps } from './constants';
import { convertToHexOpacity, generatePointSVG, getContrastYIQ } from './fns-utility';
import { ClassObjectBase, StyleDetailObj } from '../models';

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
      if (styleDetail.classObject === undefined) styleDetail.classObject = {'all': {fill: generalColorRamps.bright[lyrZIndex], label: styleDetail.keyProp ? styleDetail.keyProp : lyrName.replace(/s$/,'')}};
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

export function basicStyleFunction(
    feature: FeatureLike,
    resolution: number,
    styleDetail: StyleDetailObj,
    lyr: {name: string; type: 'TileLayer' | 'VectorTileLayer' | 'VectorLayer'}
  ): Style | Array<Style> {
    const featType = feature.getGeometry()?.getType();
    const featValue: string | undefined = ['ramp-basic','ramp-special'].includes(styleDetail.type)
      ? feature.get(styleDetail.keyProp!)
      : undefined;
    const baseClassObj: ClassObjectBase = Object.keys(styleDetail.classObject!).length > 1
      ? styleDetail.classObject![featValue ? featValue : 'Other']
      : Object.values(styleDetail.classObject!)[0];
    let newStyleObj: Style;
    if (lyr.type === 'VectorLayer') feature.get(styleDetail.keyProp!) ? (feature as Feature<any>).setId(feature.get(styleDetail.keyProp!)) : (feature as Feature<any>).setId('N/A');
    if (featType === 'Point' && styleDetail.type !== 'ramp-special') {
      newStyleObj = new Style({
        image: styleDetail.icon ? generateIconStyle(styleDetail.icon.src ?? 'geo-alt-fill', styleDetail.icon.size, styleDetail.icon.color ?? baseClassObj.fill) : undefined
      });
    } else if (featType === 'Point') {
      newStyleObj = new Style({
        image: generateIconStyle(styleDetail.classObject![featValue ?? 'Other'].iconSrc!, styleDetail.icon!.size, styleDetail.icon!.color ?? baseClassObj.fill)
      });
    } else if (['LineString', 'MultiLineString'].includes(featType)) {
      return generateLineStyle(baseClassObj.strokeColor ?? baseClassObj.fill, 1.5, baseClassObj.strokeType);
    } else {
      newStyleObj = new Style({
        fill: ['basic','ramp-basic','ramp-special'].includes(styleDetail.type)
          ? new Fill({color: baseClassObj.fill[0] === '#' ? baseClassObj.fill + convertToHexOpacity(0.5) : baseClassObj.fill.replace(')',`,0.5)`)})
          : undefined,
        stroke: new Stroke({color: baseClassObj.strokeColor ?? baseClassObj.fill, width: 1, lineCap: 'round', lineJoin: 'round', lineDash: baseClassObj.strokeType === 'dashed' ? [5,2.5] : undefined})
      });
    }
    if (styleDetail.labels && newStyleObj) {
      const featLabel = lyr.type === 'VectorTileLayer' ? feature.getId() : (feature.get(styleDetail.labels.property) || '');
      const checkRes = (current: number, min = 0, max = Infinity): boolean => current <= min || current >= max;
      newStyleObj.setText(
        makeTextStyle(
          checkRes(resolution, styleDetail.labels.minResolution, styleDetail.labels.maxResolution) ? '' : featLabel,
          featType,
          styleDetail.labels.size,
          (styleDetail.labels.fill || baseClassObj.fill),
          styleDetail.labels.offset,
          styleDetail.labels.strokeColor
          )
      );
    };
    return newStyleObj;
};

export function makeTextStyle(
  textContent: string,
  featType: string,
  size: 'x-small' | 'small' | 'normal' | 'large' | 'x-large',
  fillColor = '#d3d3d3',
  labelOffset = [0,0],
  strokeColor?: string
  ): Text {
    const sizing = {
      'x-small': { font: '0.5rem', weight: 600, fontFam: 'Segoe UI Semibold', strokeWidth: 2},
      'small': { font: '0.66rem', weight: 600, fontFam: 'Segoe UI Semibold', strokeWidth: 3},
      'normal': { font: '0.75rem', weight: 500, fontFam: 'Segoe UI', strokeWidth: 4},
      'large': { font: '0.85rem', weight: 600, fontFam: 'Segoe UI Semibold', strokeWidth: 5},
      'x-large': { font: '1rem', weight: 600, fontFam: 'Segoe UI Semibold', strokeWidth: 6}
    };
    //'#1a73e8'
    return new Text({
      text: textContent && textContent !== '' ? stringDivider(textContent, 25, '\n') : '',
      font: `${sizing[size].weight} ${sizing[size].font} '${sizing[size].fontFam}', Verdana, sans-serif`,
      textAlign: featType === 'Point' ? 'left' : 'center',
      offsetX: labelOffset[0],
      offsetY: labelOffset[1],
      overflow: true,
      placement: ['LineString', 'MultiLineString'].includes(featType) ? 'line' : 'point',
      padding: [5, 5, 5, 5],
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor ?? getContrastYIQ(fillColor), width: sizing[size].strokeWidth }),
  });
};

export const stringDivider = (str: string, width: number, spaceReplacer: any): string => {
  if (str.length > width) {
      let p = width;
      while (p > 0 && (str[p] !== ' ' && str[p] !== '-')) { p--; }
      if (p > 0) {
          const left = (str.slice(p, p + 1) === '-') ? str.slice(0, p + 1) : str.slice(0, p);
          const right = str.slice(p + 1);

          return `${left}${spaceReplacer}${stringDivider(right, width, spaceReplacer)}`;
      }
  }

  return str.replace(/(Redevelopment Plan|District Plan|Census Tract)/gi, '')
      .replace(
        /\w+/g,
        txt => txt.charAt(0).toUpperCase() + txt.slice(1)
      );
};

export function generateIconStyle(
  iconSrc: BSIconOptions | string,
  iconSize: 'x-small'|'small' | 'normal' | 'large' | 'x-large' = 'normal',
  iconColor = '#03899c'
  ): Icon {
  const scaleLevelOptions = {
    'x-small': 0.5,
    'small': 0.7,
    'normal': 1,
    'large': 1.2,
    'x-large': 1.5
  };
  const srcType = (iconSrc.startsWith('http') || iconSrc.startsWith('assets')) ? 'string' : 'iconOptions';
  const shadowStyle = 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.75))';
  const newIcon = srcType === 'iconOptions' ? generatePointSVG(iconSrc as BSIconOptions, true, {
    'style': `-webkit-filter: ${shadowStyle}; filter: ${shadowStyle}`,
    stroke: getContrastYIQ(iconColor)
  }).outerHTML : undefined;
  const isNotSvg = iconSrc.match(/(.png|.jpg|.jpeg)$/i) !== null;
  return new Icon({
      src: srcType === 'string' ? iconSrc as string : 'data:image/svg+xml;utf8,' + newIcon,
      imgSize: isNotSvg ? undefined : [20,21],
      scale: scaleLevelOptions[iconSize],
      displacement: isNotSvg ? undefined : [0,10],
      crossOrigin: 'anonymous',
      color: isNotSvg ? undefined : iconColor
  });
};

export function generateLineStyle(
  lineColor: string,
  lineWidth: number,
  lineType?: 'solid' | 'dashed'
  ): Array<Style> {
  const bgrndColor = getContrastYIQ(lineColor);
  return [
    new Style({
      stroke: new Stroke({
        color: bgrndColor,
        width: lineWidth * 3,
        lineCap: 'round',
        lineJoin: 'round'
      }),
      zIndex: 0
    }),
    new Style({
      stroke: new Stroke({
        color: lineColor,
        width: lineWidth,
        lineDash: lineType === 'dashed' ? [5,2] : undefined,
        lineCap: 'round',
        lineJoin: 'round'
      }),
      zIndex:1
    })
  ];
};
