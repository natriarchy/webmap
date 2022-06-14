import { Feature } from 'ol';
import { Layer, Vector as VectorLayer, VectorTile as VectorTileLayer } from 'ol/layer';
import { Circle as CircleStyle, Fill, Icon, RegularShape, Stroke, Style, Text } from 'ol/style';
import { LyrConstants } from '../models';
import { BSIconOptions } from './constants';
import { generatePointSVG } from './fns-utility';

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
export const makeIconStyle = (base: LyrConstants['Point-base'], opts?: LyrConstants['Point']): Style => {
  const optsFix = {
    src: opts?.src || base.src || 'geo-alt-fill',
    size: base.size || 'rg',
    fill: opts?.fill || base.fill || '#03899c'
  };
  const scale = {'xs': 0.5, 'sm': 0.7, 'rg': 1, 'lg': 1.2, 'xl': 1.5};
  const isUri = (optsFix.src.startsWith('http') || optsFix.src.startsWith('assets'));
  const isNotSvg = optsFix.src.match(/(.png|.jpg|.jpeg)$/i) !== null;
  const shadowStyle = 'drop-shadow(0px 2px 8px -3px black)';
  const newIcon = isUri ? undefined : generatePointSVG(optsFix.src as BSIconOptions, true, {
    style: `-webkit-filter: ${shadowStyle};filter: ${shadowStyle};stroke:${getContrastYIQ(optsFix.fill)}`
  });
  return new Style({
    image: new Icon({
      src: isUri ? optsFix.src : 'data:image/svg+xml;utf8,' + newIcon,
      imgSize: isNotSvg ? undefined : [20,21],
      scale: scale[optsFix.size],
      displacement: isNotSvg ? undefined : [0,10],
      crossOrigin: 'anonymous',
      color: isNotSvg ? undefined : optsFix.fill
    })
  });
};


 /**
  * Utility to get a contrasting color from the input color. Generates a simplified
  * brightness score (YIQ) for a given color in hex or rgb notation. If the score is
  * above 159 then it's considered a bright color.
  * @param {string} color A hex or rgb string representation of a color
  * @returns {string} Returns a dark or light color that will contrast well with the input.
  **/
  const getContrastYIQ = (color: string): string => {
    const rgbRaw = color[0] === '#'
      ? color.slice(1).match(/.{2}/g)!.slice(0,3)
      : color.replace(/[a-z\s\(\)]/ig,'').split(',', 3);
    const rgb = rgbRaw.map((i) => parseInt(i, color[0] === '#' ? 16 : undefined));
    const yiq = ((rgb[0] * 299) + (rgb[1] * 587) + (rgb[2] * 114)) / 1000;

    return yiq >= 160 ? 'rgba(100,100,100,0.9)' : 'rgba(245,245,245,0.9)';
  };
