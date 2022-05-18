import Control from 'ol/control/Control';
import { FeatureLike } from 'ol/Feature';
import { Circle as CircleGeom, LineString, Point, Polygon } from 'ol/geom';
import GeometryType from 'ol/geom/GeometryType';
import { Draw } from 'ol/interaction';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { getArea, getLength } from 'ol/sphere';
import { Stroke, Style } from 'ol/style';
import tippy from 'tippy.js';
import { createElementWith, generatePointSVG } from '../utils/fns-utility';
import { generateMeasureStyle } from '../utils/generate-style';
import { MapToast } from '../classes/map-toast.class';

export class Measure extends Control {
  readonly name = 'measure-tool';
  button_: HTMLElement;
  toast_: MapToast;
  tippyDropdown: any;
  dropdownDiv: HTMLElement;
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
  constructor(opts: { targetId?: string }) {
    super({ element: document.createElement('div') });
    this.set('name', this.name);

    this.baseStyle = generateMeasureStyle('base');
    this.centroidStyle = generateMeasureStyle('centroid');
    this.labelStyle = generateMeasureStyle('label');
    this.segmentStyle = generateMeasureStyle('segment');
    this.tipStyle = generateMeasureStyle('tip');
    this.segmentStyles = [this.segmentStyle];

    this.button_ = document.createElement('button');
    this.button_.title = 'Measure Distance, Radius, or Area';
    this.button_.setAttribute('type', 'button');
    this.button_.appendChild(generatePointSVG('rulers', false));
    this.button_.onclick = (e) => e.preventDefault();

    this.element.className = 'ol-unselectable ol-custom-control';
    this.element.appendChild(this.button_);

    this.toast_ = new MapToast();
    this.dropdownDiv = this.makeDropdown();
    this.tippyDropdown = tippy(this.button_, {
      content: this.dropdownDiv,
      appendTo: this.element,
      interactive: true,
      allowHTML: true,
      arrow: false,
      offset: [0,7],
      placement: "right-start",
      animation: "shift-toward-extreme",
      theme: "map-light",
      trigger: "click focus",
      onShow(e) { e.reference.classList.add('dropdown-open','no-interaction'); },
      onHide(e) { e.reference.classList.remove('dropdown-open','no-interaction'); }
    });
  }
  makeDropdown(): HTMLElement {
    return createElementWith(false, 'div', {
      class: 'tippy-dropdown-div',
      children: ['Distance','Area','Radius'].map((m,i,a) => createElementWith(false, 'button', {
          type: 'button',
          title: `Measure ${m}`,
          innerHTML: m,
          value: m,
          'data-active': 'false',
          onclick: this.launchMeasure.bind(this)
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

  launchMeasure(e: MouseEvent): void {
    const drawType = (e.target as HTMLButtonElement).value as 'Distance' | 'Area' | 'Radius';
    this.dropdownDiv.querySelectorAll('button').forEach(c => c.setAttribute('data-active',String(c.value === drawType)));
    console.info(`Launching Measure Tool - ${drawType}...`);
    this.tippyDropdown.hide();

    const activeTip = drawType === 'Radius'
      ? 'Click to finish drawing'
      : 'Click to continue drawing; double-click to finish';
    const idleTip = 'Click to start measuring';
    let tip = idleTip;

    // Generate Toast Element and give a click listener to exit measure
    this.toast_
      .make({tone: 'action', header: `Click on Map to Measure ${drawType}`, body: 'Click Here or Press ESC Key to Exit'})
      .on('click', this.endMeasure.bind(this));

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
    ['AllowSelectHover','AllowSelectClick'].forEach(s => map.set(s, false));
    this.drawInteraction.set('type','Draw');
    this.drawInteraction.on('drawstart', () => { this.measureSource.clear(); tip = activeTip; });
    this.drawInteraction.on('drawend', () => { tip = idleTip; });
    document.addEventListener('keyup', this.handleEscapeKey.bind(this), { once: true });
    map.addInteraction(this.drawInteraction);
  }
  endMeasure(): void {
    if (this.tippyDropdown) this.tippyDropdown.hide();
    this.dropdownDiv.querySelectorAll('button').forEach(c => c.setAttribute('data-active','false'));
    document.removeEventListener('keyup', this.handleEscapeKey);
    this.toast_.destroy();

    const map = this.getMap()!;
    map.removeInteraction(this.drawInteraction!);
    map.removeLayer(map.getAllLayers().find(l => l.getClassName() === 'measure-layer')!);
    this.drawInteraction = undefined;
    this.measureSource.clear();
    ['AllowSelectHover','AllowSelectClick'].forEach(s => map.set(s, true));
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
