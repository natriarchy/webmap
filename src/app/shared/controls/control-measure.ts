import Control from 'ol/control/Control';
import { FeatureLike } from 'ol/Feature';
import { Circle, LineString, Point, Polygon } from 'ol/geom';
import GeometryType from 'ol/geom/GeometryType';
import Draw from 'ol/interaction/Draw';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { getArea, getLength } from 'ol/sphere';
import { Circle as CircleStyle, Fill, RegularShape, Stroke, Style, Text } from 'ol/style';
import tippy from 'tippy.js';
import { MapToast } from '../classes/map-toast.class';

export class Measure extends Control {
  readonly name = 'measure-tool';
  readonly icons = {
    ctrl: 'rulers'
  };
  _ctrlBtn: HTMLElement;
  _toast: MapToast;
  _tippy: any;
  dropdownEl: HTMLElement;
  drawInteraction: Draw | undefined;
  drawType: 'Distance' | 'Area' | 'Radius' = 'Distance';
  geomType = { Area: GeometryType.POLYGON, Distance: GeometryType.LINE_STRING, Radius: GeometryType.CIRCLE };
  measureLyr = new VectorLayer({ className: 'measure-layer', source: new VectorSource(), style: this.styleFn.bind(this) });
  baseStyle: Style;
  centroidStyle: Style;
  labelStyle: Style;
  segmentStyle: Style;
  tipStyle: Style;
  tipPoint: any;
  segmentStyles: Array<Style>;
  constructor(opts?: { targetId?: string }) {
    super({ element: document.createElement('div') });
    this.set('name', this.name);

    this.baseStyle = this.measureStyle('base');
    this.centroidStyle = this.measureStyle('centroid');
    this.labelStyle = this.measureStyle('label');
    this.segmentStyle = this.measureStyle('segment');
    this.tipStyle = this.measureStyle('tip');
    this.segmentStyles = [this.segmentStyle];

    this._ctrlBtn = document.createElement('button');
    this._ctrlBtn.title = 'Measure Distance, Radius, or Area';
    this._ctrlBtn.setAttribute('type', 'button');
    this._ctrlBtn.innerHTML = `<span class="bi bi-${this.icons.ctrl}"></span>`;
    this._ctrlBtn.onclick = (e) => e.preventDefault();

    this.element.className = 'ol-unselectable ol-custom-control';
    this.element.appendChild(this._ctrlBtn);

    this._toast = new MapToast();
    this.dropdownEl = this.makeDropdown();
    this._tippy = tippy(this._ctrlBtn, {
      content: this.dropdownEl,
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
    const dropdownEl = document.createElement('div');
    dropdownEl.className = 'tippy-dropdown-div';
    dropdownEl.append(...['Distance','Area','Radius'].map((m,i,a) => {
      const _btn = document.createElement('button');
      _btn.innerHTML = m;
      _btn.setAttribute('type', 'button');
      _btn.setAttribute('title', `Measure ${m}`);
      _btn.setAttribute('data-active', 'false');
      _btn.value = m;
      _btn.onclick = this.launchMeasure.bind(this);
      return _btn;
    }));
    return dropdownEl;
  }

/**
 * @function formatMeasurement - Format length, area, or radius of geometry.
 * @param {(LineString|Polygon|Circle)} geom - The LineString, Polygon or Circle Geometry to Measure.
 * @return {string} - Formatted length, area, or radius in feet or square feet.
 **/
  formatMeasurement(geom: LineString | Polygon | Circle): string {
    const fixNum = (number: number): string => String(Math.round(number)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    switch (geom.getType()) {
      case 'LineString': return fixNum(getLength(geom, {projection: ''}) * 3.28084) + ' ft';
      case 'Polygon': return fixNum(getArea(geom) * 10.7639) + ' ft\xB2';
      default: {
        const radius = (geom as Circle).getRadius();
        const area = Math.PI * Math.pow(radius,2);
        return `Radius: ${fixNum(radius * 3.28084)} ft\nArea: ${fixNum(area * 10.7639)} ft\xB2`;
      }
    }
  }

  launchMeasure(e: MouseEvent): void {
    const drawType = (e.target as HTMLButtonElement).value as 'Distance' | 'Area' | 'Radius';
    this.dropdownEl.querySelectorAll('button').forEach(c => c.setAttribute('data-active',String(c.value === drawType)));
    console.info(`Launching Measure Tool - ${drawType}...`);
    this._tippy.hide();

    const activeTip = `Click to ${drawType === 'Radius' ? 'finish' : 'continue'} drawing${drawType !== 'Radius' ? '; double-click to finish' : ''}`;
    const idleTip = 'Click to start measuring';
    let tip = idleTip;

    // Generate Toast Element and give a click listener to exit measure
    this._toast
      .make({tone: 'action', header: `Click on Map to Measure ${drawType}`, body: 'Click Here or Press ESC Key to Exit'})
      .on('click', this.endMeasure.bind(this));

    const map = this.getMap()!;
    map.getAllLayers().find(l => l.getClassName() === 'measure-layer')
      ? map.removeLayer(map.getAllLayers().find(l => l.getClassName() === 'measure-layer')!)
      : this.measureLyr.setMap(map);

    if (this.drawInteraction) {
      this.drawInteraction.abortDrawing();
      map.removeInteraction(this.drawInteraction!);
      this.drawInteraction = undefined;
    }
    this.drawInteraction = new Draw({
      source: this.measureLyr.getSource(),
      type: this.geomType[drawType],
      stopClick: true,
      style: (f) => this.styleFn(f, tip)
    });
    ['AllowSelectHover','AllowSelectClick'].forEach(s => map.set(s, false));
    this.drawInteraction.set('type','Draw');
    this.drawInteraction.on('drawstart', () => { this.measureLyr.getSource().clear(); tip = activeTip; });
    this.drawInteraction.on('drawend', () => { tip = idleTip; });
    document.addEventListener('keyup', this.handleEscKey.bind(this), { once: true });
    map.addInteraction(this.drawInteraction);
  }
  endMeasure(): void {
    if (this._tippy) this._tippy.hide();
    this.dropdownEl.querySelectorAll('button').forEach(c => c.setAttribute('data-active','false'));
    document.removeEventListener('keyup', this.handleEscKey);
    this._toast.destroy();

    const map = this.getMap()!;
    map.removeInteraction(this.drawInteraction!);
    map.removeLayer(map.getAllLayers().find(l => l.getClassName() === 'measure-layer')!);
    this.drawInteraction = undefined;
    this.measureLyr.getSource().clear();
    ['AllowSelectHover','AllowSelectClick'].forEach(s => map.set(s, true));
    console.info('Exiting Measure Tool...');
  }
  handleEscKey(e: any): void {
    e.preventDefault();
    if (e.key === 'Escape') this.endMeasure();
  }
  styleFn(feat: FeatureLike, tip?: any): Array<Style> {
    const styles: Array<Style> = [new Style({stroke: new Stroke({color: 'rgba(50,50,50,0.75)', width: 5})}), this.baseStyle];
    const geometry = feat.getGeometry();
    const type = geometry!.getType();
    let point, label, line;
    if (geometry instanceof Polygon) {
      point = (geometry as Polygon).getInteriorPoint();
      label = this.formatMeasurement(geometry);
      line = new LineString((geometry as Polygon).getCoordinates()[0]);
    } else if (geometry instanceof Circle) {
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

  measureStyle = (forType: 'base'|'centroid'|'label'|'segment'|'tip'): Style => {
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

}
