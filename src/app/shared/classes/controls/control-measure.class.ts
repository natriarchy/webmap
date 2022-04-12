import Control from 'ol/control/Control';
import { FeatureLike } from 'ol/Feature';
import { Circle as CircleGeom, LineString, Point, Polygon } from 'ol/geom';
import GeometryType from 'ol/geom/GeometryType';
import { Draw } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { getArea, getLength } from 'ol/sphere';
import { Stroke, Style } from 'ol/style';
import tippy from 'tippy.js';
import { MapToast } from '../elements/map-toast.class';
import { createElementWith, generatePointSVG } from '../../utils/fns-utility';
import { generateMeasureStyle } from '../../utils/generate-style';

export class Measure extends Control {
  name = 'measure';
  tippyDropdown: any;
  drawInteraction: Draw | undefined;
  drawType: 'Distance' | 'Area' | 'Radius' = 'Distance';
  geomType = { Area: GeometryType.POLYGON, Distance: GeometryType.LINE_STRING, Radius: GeometryType.CIRCLE };
  measureSource = new VectorSource();
  measureLayer = new VectorLayer({ className: 'measure-layer', source: this.measureSource, style: this.styleFunction.bind(this) });
  baseStyle: Style;
  centroidStyle: Style;
  labelStyle: Style;
  segmentStyle: Style;
  tipStyle: Style;
  tipPoint: any;
  segmentStyles: Array<Style>;
  constructor(
    options: {
      parentContainer: HTMLElement
    }) {
    super({ element: options.parentContainer });
    this.set('name', this.name);

    this.baseStyle = generateMeasureStyle('base');
    this.centroidStyle = generateMeasureStyle('centroid');
    this.labelStyle = generateMeasureStyle('label');
    this.segmentStyle = generateMeasureStyle('segment');
    this.tipStyle = generateMeasureStyle('tip');
    this.segmentStyles = [this.segmentStyle];

    const ctrlBtn = createElementWith(false, 'button', {
      title: 'Measure Distance, Radius, or Area',
      class: 'webmap-btn ctrl measure-toggle',
      'aria-label': 'Ruler Icon, Open Measure Tool Menu',
      innerHTML: generatePointSVG('rulers').outerHTML,
      onclick: (e: any) => e.preventDefault()
    });
    this.element.appendChild(ctrlBtn);

    this.tippyDropdown = tippy(ctrlBtn, {
      content: this.makeDropdown(),
      appendTo: this.element,
      interactive: true,
      allowHTML: true,
      arrow: false,
      offset: [0,7],
      placement: "right-start",
      animation: "shift-toward-extreme",
      theme: "map-light",
      trigger: "click focus",
      onShow(e) { ctrlBtn.classList.add('dropdown-open','no-interaction'); },
      onHide(e) { ctrlBtn.classList.remove('dropdown-open','no-interaction'); }
    });
  }
  makeDropdown(): HTMLElement {
    return createElementWith(false, 'div', {
      class: 'tippy-dropdown-div',
      children: ['Distance','Area','Radius'].map((m,i,a) => createElementWith(false, 'button', {
          type: 'button',
          title: `Measure ${m}`,
          innerHTML: m,
          onclick: (e: any) => this.launchMeasure(m as 'Distance' | 'Area' | 'Radius')
        }))
    });
  }

/**
 * @function formatMeasurement - Format length, area, or radius of geometry.
 * @param {(LineString|Polygon|CircleGeom)} geom - The LineString, Polygon or Circle Geometry to Measure.
 * @return {string} - Formatted length, area, or radius in feet or square feet.
 **/
  formatMeasurement(geom: LineString | Polygon | CircleGeom): string {
    const fixNum = (number: number): string => String(number).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (geom.getType() === 'LineString') {
      const length = getLength(geom, {projection: ''});
      return fixNum(Math.round(length * 3.28084)) + ' ft';
    } else if (geom.getType() === 'Polygon') {
      const area = getArea(geom);
      return fixNum(Math.round(area * 10.7639)) + ' ft\xB2';
    } else {
      const radius = (geom as CircleGeom).getRadius();
      const area = Math.PI * Math.pow(radius,2);
      return `Radius: ${fixNum(Math.round(radius * 3.28084))} ft\nArea: ${fixNum(Math.round(area * 10.7639))} ft\xB2`;
    }
  }

  launchMeasure(drawType: 'Distance' | 'Area' | 'Radius'): void {
    console.info(`Launching Measure Tool - ${drawType}...`);
    this.tippyDropdown.hide();

    const activeTip = drawType === 'Radius'
      ? 'Click to finish drawing'
      : 'Click to continue drawing; double-click to finish';
    const idleTip = 'Click to start measuring';
    let tip = idleTip;

    // Generate Toast Element and give a click listener to exit measure
    const measureToast = new MapToast({tone: 'action', header: `Click on Map to Measure ${drawType}`, body: 'Click Here or Press ESC Key to Exit'});
    (measureToast.toastElement.firstElementChild as HTMLElement).onclick = (e: any) => this.endMeasure();

    const map = this.getMap()!;
    map.getAllLayers().find(l => l.getClassName() === 'measure-layer')
      ? map.removeLayer(map.getAllLayers().find(l => l.getClassName() === 'measure-layer')!)
      : this.measureLayer.setMap(map);

    if (this.drawInteraction) {
      this.drawInteraction.abortDrawing();
      map.removeInteraction(this.drawInteraction!);
      this.drawInteraction = undefined;
    }
    this.drawInteraction = new Draw({
      source: this.measureSource,
      type: this.geomType[drawType],
      stopClick: true,
      style: (f) => this.styleFunction(f, tip)
    });
    this.drawInteraction.set('type','Draw');
    this.drawInteraction.on('drawstart', () => { this.measureSource.clear(); tip = activeTip; });
    this.drawInteraction.on('drawend', () => { tip = idleTip; });
    document.addEventListener('keyup', this.handleEscapeKey.bind(this), { once: true });
    map.addInteraction(this.drawInteraction);
  }
  endMeasure(): void {
    if (document.getElementById('toast-element')) document.getElementById('toast-element')!.remove();
    if (this.tippyDropdown) this.tippyDropdown.hide();
    document.removeEventListener('keyup', this.handleEscapeKey);

    const map = this.getMap()!;
    map.removeInteraction(this.drawInteraction!);
    map.removeLayer(map.getAllLayers().find(l => l.getClassName() === 'measure-layer')!);

    this.drawInteraction = undefined;
    this.measureSource.clear();
    console.info('Exiting Measure Tool...');
  }
  handleEscapeKey(e: any): void {
    e.preventDefault();
    if (e.key === 'Escape') this.endMeasure();
  }
  styleFunction(feature: FeatureLike, tip?: any): Array<Style> {
    const styles: Array<Style> = [new Style({stroke: new Stroke({color: 'rgba(50,50,50,0.75)', width: 5})}), this.baseStyle];
    const geometry = feature.getGeometry();
    const type = geometry!.getType();
    let point, label, line;
    if (geometry instanceof Polygon) {
      point = (geometry as Polygon).getInteriorPoint();
      label = this.formatMeasurement(geometry);
      line = new LineString((geometry as Polygon).getCoordinates()[0]);
    } else if (geometry instanceof CircleGeom) {
      this.centroidStyle.setGeometry(new Point(geometry.getCenter()));
      styles.push(this.centroidStyle);
      label = this.formatMeasurement(geometry);
      line = new LineString(geometry.getExtent());
    } else if (geometry instanceof LineString) {
      point = new Point((geometry as LineString).getLastCoordinate());
      label = this.formatMeasurement(geometry);
      line = geometry;
    }
    if (line) {
      let count = 0;
      (line as LineString).forEachSegment((coordsA, coordsB) => {
        const segment = new LineString([coordsA, coordsB]);
        if (this.segmentStyles.length - 1 < count) this.segmentStyles.push(this.segmentStyle.clone());
        this.segmentStyles[count].setGeometry(segment);
        this.segmentStyles[count].getText().setText(this.formatMeasurement(segment));
        styles.push(this.segmentStyles[count]);
        count++;
      });
    }
    if (label) {
      this.labelStyle.setGeometry(point as Point);
      this.labelStyle.getText().setText(label);
      styles.push(this.labelStyle);
    }
    if (tip && type === 'Point') {
      this.tipPoint = geometry;
      this.tipStyle.getText().setText(tip);
      styles.push(this.tipStyle);
    }
    return styles;
  }
}
