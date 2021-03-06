import Control from 'ol/control/Control';
import { FeatureLike } from 'ol/Feature';
import { Circle, LineString, Point, Polygon } from 'ol/geom';
import GeometryType from 'ol/geom/GeometryType';
import Draw from 'ol/interaction/Draw';
import OLObj from 'ol/Object';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { getArea, getLength } from 'ol/sphere';
import { Circle as CircleStyle, Fill, RegularShape, Stroke, Style, Text } from 'ol/style';
import tippy from 'tippy.js';

type MeasureEls = 'base'|'centroid'|'label'|'segment'|'tip';

export class Measure extends Control {
  readonly name = 'measure-tool';
  readonly icons = {
    ctrl: 'rulers'
  };
  _tippy: any;
  dropdownEl: HTMLElement;
  drawInteraction: Draw | undefined;
  drawType: 'Distance' | 'Area' | 'Radius' = 'Distance';
  measureLyr = new VectorLayer({ className: 'measure-layer', source: new VectorSource(), style: this.styleFn.bind(this) });
  styles: Record<MeasureEls, Style>;
  _toastEl: HTMLElement | undefined;
  tipPoint: any;
  segmentStyles: Array<Style>;
  constructor(opts?: { targetId?: string }) {
    super({ element: document.createElement('div') });
    this.set('name', this.name);

    const makeStyle = (el: MeasureEls): Style => {
      let textStyle: Text | undefined;
      let imageStyle: CircleStyle | RegularShape | undefined;
      const fill = (clr: string) => new Fill({ color: clr });
      const stroke = (clr: string, width?: number, dash?: [number, number]) => new Stroke({color: clr, width: width, lineDash: dash});

      if (['label','segment','tip'].includes(el)) textStyle = new Text({
        font: `${el === 'label' ? 14 : 12}px 'Segoe UI',Calibri,'Open Sans',sans-serif`,
        fill: fill('white'),
        padding: [3, 3, 3, 3],
        ...(el === 'label' && { offsetY: -15, textBaseline: 'bottom' } ),
        ...(el === 'tip' && { offsetX: 20, offsetY: 20, textAlign: 'left' } ),
        ...(el === 'segment' && { placement: 'line', stroke: stroke('rgba(50,50,50)', 5) }),
        ...(el !== 'segment' && { backgroundFill: fill('rgba(50,50,50,0.75)')})
      });

      if (['base','centroid','label'].includes(el)) imageStyle = el === 'base'
        ? new CircleStyle({ radius: 5, stroke: stroke('rgba(0, 0, 0, 0.7)'), fill: fill('rgba(0, 0, 0, 0.4)') })
        : new RegularShape({ radius: 8, points: 3, angle: Math.PI, displacement: [0, 8], fill: fill('rgba(50,50,50,0.75)') })

      return new Style({
        stroke: el === 'base' ? stroke('rgba(255, 255, 255, 0.85)', 2, [10, 10]) : undefined,
        fill: fill('rgba(0, 0, 0, 0.2)'),
        text: textStyle,
        image: imageStyle
      });
    };
    this.styles = {
      'base': makeStyle('base'),
      'centroid': makeStyle('centroid'),
      'label': makeStyle('label'),
      'segment': makeStyle('segment'),
      'tip': makeStyle('tip')
    };
    this.segmentStyles = [this.styles.segment];

    const _ctrlBtn = document.createElement('button');
    Object.assign(_ctrlBtn, {
      title: 'Measure Distance, Radius, or Area',
      type: 'button',
      innerHTML: `<span class="bi bi-${this.icons.ctrl}"></span>`,
      onclick: (e: MouseEvent) => e.preventDefault()
    });

    this.element.className = 'ol-unselectable ol-custom-control';
    this.element.appendChild(_ctrlBtn);

    this.dropdownEl = this.makeDropdown();
    this._tippy = tippy(_ctrlBtn, {
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
      onShow(e) { e.reference.classList.add('--dropdown','--no-int'); },
      onHide(e) { e.reference.classList.remove('--dropdown','--no-int'); }
    });
  }

  makeDropdown(): HTMLElement {
    const dropdownEl = document.createElement('div');
    dropdownEl.className = 'tippy-dropdown';
    dropdownEl.append(...['Distance','Area','Radius'].map((m,i,a) => {
      const _btn = document.createElement('button');
      _btn.value = m;
      Object.assign(_btn, {
        innerHTML: m,
        type: 'button',
        title: `Measure ${m}`,
        onclick: this.launch.bind(this)
      });
      _btn.setAttribute('data-active', 'false');
      return _btn;
    }));
    return dropdownEl;
  }

  format(geom: LineString | Polygon | Circle): string {
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

  launch(e: MouseEvent): void {
    const drawType = (e.target as HTMLButtonElement).value as 'Distance' | 'Area' | 'Radius';
    this.dropdownEl.querySelectorAll('button').forEach(c => c.setAttribute('data-active',String(c.value === drawType)));
    console.info(`Launching Measure Tool - ${drawType}...`);
    this._tippy.hide();

    const activeTip = `Click to ${drawType === 'Radius' ? 'finish' : 'continue'} drawing${drawType !== 'Radius' ? '; double-click to finish' : ''}`;
    const idleTip = 'Click to start measuring';
    let tip = idleTip;

    // Generate Toast Element and give a click listener to exit measure
    this._toastEl = this.getMap()!
      .get('toast-ctrl')
      .launch({tone: 'action', header: `Click on Map to Measure ${drawType}`, body: 'Click Here or Press ESC Key to Exit'});
    this._toastEl!.addEventListener('click', this.endMeasure.bind(this), {once: true});

    const map = this.getMap()!;
    map.getAllLayers().find(l => l.getClassName() === 'measure-layer')
      ? map.removeLayer(map.getAllLayers().find(l => l.getClassName() === 'measure-layer')!)
      : this.measureLyr.setMap(map);

    if (this.drawInteraction) {
      this.drawInteraction.abortDrawing();
      map.removeInteraction(this.drawInteraction!);
      this.drawInteraction = undefined;
    };
    this.drawInteraction = new Draw({
      source: this.measureLyr.getSource(),
      type: { Area: GeometryType.POLYGON, Distance: GeometryType.LINE_STRING, Radius: GeometryType.CIRCLE }[drawType],
      stopClick: true,
      style: (f) => this.styleFn(f, tip)
    });
    ['AllowSelectHover','AllowSelectClick'].forEach(s => (map.get('settings') as OLObj).set(s, false));
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
    if (this._toastEl) this.getMap()!
      .get('toast-ctrl')
      .destroy();

    const map = this.getMap()!;
    map.removeInteraction(this.drawInteraction!);
    map.removeLayer(map.getAllLayers().find(l => l.getClassName() === 'measure-layer')!);
    this.drawInteraction = undefined;
    this.measureLyr.getSource().clear();
    ['AllowSelectHover','AllowSelectClick'].forEach(s => (map.get('settings') as OLObj).set(s, true));
    console.info('Exiting Measure Tool...');
  }

  handleEscKey(e: any): void {
    e.preventDefault();
    if (e.key === 'Escape') this.endMeasure();
  }

  styleFn(feat: FeatureLike, tip?: any): Array<Style> {
    const styles: Array<Style> = [new Style({stroke: new Stroke({color: 'rgba(50,50,50,0.75)', width: 5})}), this.styles.base];
    const geometry = feat.getGeometry();
    const type = geometry!.getType();
    let point, label, line;
    if (geometry instanceof Polygon) {
      point = (geometry as Polygon).getInteriorPoint();
      label = this.format(geometry);
      line = new LineString((geometry as Polygon).getCoordinates()[0]);
    } else if (geometry instanceof Circle) {
      this.styles.centroid.setGeometry(new Point(geometry.getCenter()));
      styles.push(this.styles.centroid);
      label = this.format(geometry);
      line = new LineString(geometry.getExtent());
    } else if (geometry instanceof LineString) {
      point = new Point((geometry as LineString).getLastCoordinate());
      label = this.format(geometry);
      line = geometry;
    }
    if (line) {
      let count = 0;
      (line as LineString).forEachSegment((c1, c2) => {
        const segment = new LineString([c1, c2]);
        if (this.segmentStyles.length - 1 < count) this.segmentStyles.push(this.styles.segment.clone());
        this.segmentStyles[count].setGeometry(segment);
        this.segmentStyles[count].getText().setText(this.format(segment));
        styles.push(this.segmentStyles[count]);
        count++;
      });
    }
    if (label) {
      this.styles.label.setGeometry(point as Point);
      this.styles.label.getText().setText(label);
      styles.push(this.styles.label);
    }
    if (tip && type === 'Point') {
      this.tipPoint = geometry;
      this.styles.tip.getText().setText(tip);
      styles.push(this.styles.tip);
    }
    return styles;
  }

}
