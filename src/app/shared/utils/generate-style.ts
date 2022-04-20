import { Feature } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { Layer, Vector as VectorLayer, VectorTile as VectorTileLayer } from 'ol/layer';
import { Fill, Icon, RegularShape, Stroke, Style, Text } from 'ol/style';
import CircleStyle from 'ol/style/Circle';
import { BSIconOptions } from './constants';
import { convertToHexOpacity, generatePointSVG, getContrastYIQ } from './fns-utility';
import { ClassObjectBase, StyleDetailObj } from '../models';


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
    ? styleDetail.classObject![featValue ? featValue : 'Other'] as ClassObjectBase
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
  const shadowStyle = 'drop-shadow(0px 2px 8px -3px black)';
  const newIcon = srcType === 'iconOptions' ? generatePointSVG(iconSrc as BSIconOptions, true, {
    style: `-webkit-filter: ${shadowStyle};filter: ${shadowStyle};stroke:${getContrastYIQ(iconColor)}`
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

export const handleSelectionLyr = (selectedFeat: Feature<any>, selectedLayer: Layer<any, any>): Layer<any, any> => {
  const selectionStyle = (f: any) => f.getId() === selectedFeat.getId() ? new Style({stroke: new Stroke({color: 'rgba(0,255,255,0.7)', width: 4})}) : undefined;
  if (selectedLayer.get('olLyrType') === 'VectorTileLayer') {
    return new VectorTileLayer({className: 'click-selection', renderMode: 'vector', source: selectedLayer.getSource(), style: selectionStyle, zIndex: 10});
  } else {
    return new VectorLayer({className: 'click-selection', source: selectedLayer.getSource(), style: selectionStyle, zIndex: 10});
  }
}

export const generateMeasureStyle = (forType: 'base'|'centroid'|'label'|'segment'|'tip'): Style => {
  const makeText = () => new Text({
      font: `${forType === 'label' ? 14 : 12}px Segoe UI,Calibri,sans-serif`,
      fill: new Fill({ color: 'white' }),
      padding: [3,3,3,3],
      textBaseline: forType === 'label' ? 'bottom' : undefined,
      placement: forType === 'segment' ? 'line' : undefined,
      stroke: forType === 'segment' ? new Stroke({ color: 'rgba(50,50,50)', width: 5 }) : undefined,
      textAlign: forType === 'tip' ? 'left' : undefined,
      backgroundFill: forType !== 'segment' ? new Fill({ color: 'rgba(50,50,50,0.75)' }) : undefined,
      offsetX: forType === 'tip' ? 20 : 0,
      ...( forType === 'label' && { offsetY: -15 } ),
      ...( forType === 'tip' && { offsetY: 20 } )
  });
  const imageStyle = (): CircleStyle | RegularShape => forType === 'base'
    ? new CircleStyle({ radius: 5, stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.7)' }), fill: new Fill({ color: 'rgba(0, 0, 0, 0.4)' }) })
    : new RegularShape({ radius: 8, points: 3, angle: Math.PI, displacement: [0, 8], fill: new Fill({ color: 'rgba(50,50,50,0.75)' }) })

  return new Style({
    fill: new Fill({color: 'rgba(0, 0, 0, 0.2)'}),
    stroke: forType === 'base' ? new Stroke({color: 'rgba(255, 255, 255, 0.85)', lineDash: [10, 10], width: 2}) : undefined,
    text: ['label','segment','tip'].includes(forType) ? makeText() : undefined,
    image: ['base','centroid','label'].includes(forType) ? imageStyle() : undefined
  });
}
