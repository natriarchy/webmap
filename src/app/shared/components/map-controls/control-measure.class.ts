import Control from 'ol/control/Control';
import { FeatureLike } from 'ol/Feature';
import { Circle as CircleGeom, LineString, Point, Polygon } from 'ol/geom';
import GeometryType from 'ol/geom/GeometryType';
import { Modify, Draw } from 'ol/interaction';
import { Vector as VectorLayer, Group as LayerGroup } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { getArea, getLength } from 'ol/sphere';
import { Circle as CircleStyle, Fill, RegularShape, Stroke, Style, Text } from 'ol/style';
import tippy from 'tippy.js';
import { createElementWith, generatePointSVG } from '../../utils/fns-utility';

export class Measure extends Control {
  dropdownContent: HTMLElement;
  tippyDropdown: any;
  source = new VectorSource();
  drawInteraction: Draw;
  drawLayer = new VectorLayer({
    className: 'DrawLayer',
    source: this.source,
    style: (feature) => { return this.styleFunction(feature); }
  });
  drawType: 'distance' | 'area' | 'radius' = 'distance';
  drawing = false;
  geomType: {[key: string]: any} = {
    area: GeometryType.POLYGON,
    distance: GeometryType.LINE_STRING,
    radius: GeometryType.CIRCLE
  };
  style = new Style({
    fill: new Fill({color: 'rgba(255, 255, 255, 0.2)'}),
    stroke: new Stroke({color: 'rgba(0, 0, 0, 0.5)', lineDash: [10, 10], width: 2}),
    image: new CircleStyle({
      radius: 5,
      stroke: new Stroke({ color: 'rgba(0, 0, 0, 0.7)' }),
      fill: new Fill({ color: 'rgba(255, 255, 255, 0.2)' })
    })
  });
  labelStyle = new Style({
    text: new Text({
      font: '14px Segoe UI,Calibri,sans-serif',
      fill: new Fill({ color: 'rgba(255, 255, 255, 1)' }),
      backgroundFill: new Fill({ color: 'rgba(0, 0, 0, 0.7)' }),
      padding: [3, 3, 3, 3],
      textBaseline: 'bottom',
      offsetY: -15
    }),
    image: new RegularShape({
      radius: 8,
      points: 3,
      angle: Math.PI,
      displacement: [0, 10],
      fill: new Fill({ color: 'rgba(0, 0, 0, 0.7)' })
    })
  });
  tipStyle = new Style({
    text: new Text({
      font: '12px Segoe UI,Calibri, sans-serif',
      fill: new Fill({ color: 'rgba(255, 255, 255, 1)' }),
      backgroundFill: new Fill({ color: 'rgba(0, 0, 0, 0.4)' }),
      padding: [2, 2, 2, 2],
      textAlign: 'left',
      offsetX: 15
    })
  });
  modifyStyle = new Style({
    image: new CircleStyle({
      radius: 5,
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.7)',
      }),
      fill: new Fill({ color: 'rgba(0, 0, 0, 0.4)' })
    }),
    text: new Text({
      font: '12px Segoe UI,Calibri, sans-serif',
      fill: new Fill({ color: 'rgba(255, 255, 255, 1)' }),
      backgroundFill: new Fill({ color: 'rgba(0, 0, 0, 0.7)' }),
      padding: [2, 2, 2, 2],
      textAlign: 'left',
      offsetX: 15
    })
  });
  centroidStyle = new Style({
    image: new CircleStyle({
      radius: 5,
      stroke: new Stroke({
        color: 'rgba(0, 0, 0, 0.7)',
      }),
      fill: new Fill({ color: 'rgba(0, 0, 0, 0.4)' })
    })
  });
  segmentStyle = new Style({
    text: new Text({
      font: '12px Segoe UI,Calibri, sans-serif',
      fill: new Fill({ color: 'rgba(255, 255, 255, 1)' }),
      backgroundFill: new Fill({color: 'rgba(0, 0, 0, 0.4)'}),
      padding: [2, 2, 2, 2],
      textBaseline: 'bottom',
      offsetY: -12
    }),
    image: new RegularShape({
      radius: 6,
      points: 3,
      angle: Math.PI,
      displacement: [0, 8],
      fill: new Fill({ color: 'rgba(0, 0, 0, 0.4)' })
    })
  });
  modify = new Modify({ source: this.source, style: this.modifyStyle });
  tipPoint: any;
  segmentStyles = [this.segmentStyle];
  constructor(
    options: {
      parentContainer: HTMLElement
    }) {
    super({
      element: options.parentContainer
    });
    this.drawInteraction = new Draw({type: this.geomType[this.drawType]});
    const ctrlBtn = createElementWith(false, 'button', {
      title: 'Measure Distance, Radius, or Area',
      class: 'control-button measure-toggle',
      'aria-label': 'Ruler Icon, Open Measure Tool Menu',
      innerHTML: generatePointSVG('rulers').outerHTML
    });
    ctrlBtn.addEventListener(
      'click',
      this.handleClick.bind(this),
      false
    );
    this.element.appendChild(ctrlBtn);
    this.dropdownContent = this.makeDropdown();
    this.tippyDropdown = tippy(ctrlBtn,
      {
        content: this.dropdownContent,
        appendTo: this.getMap()?.getTargetElement(),
        interactive: true,
        allowHTML: true,
        arrow: false,
        offset: [0, 0],
        placement: "right-start",
        animation: "shift-toward-extreme",
        theme: "map-light",
        trigger: "click focus",
        onShow(instance) {
          ctrlBtn.classList.add('dropdown-open','no-interaction');
        },
        onHide(instance) {
          ctrlBtn.classList.remove('dropdown-open','no-interaction');
        }
      }
    );
  }
  handleClick(event: MouseEvent): void {
    event.preventDefault();
  }
  makeDropdown(): HTMLElement {
    const newDiv = document.createElement('div');
    newDiv.className = 'tippy_dropdown_div';
    ['Distance','Area','Radius'].forEach((m,i,a) => {
      const btn = document.createElement('button');
      btn.setAttribute('title', `Measure ${m}`);
      btn.innerText = m;
      btn.addEventListener(
        'click',
        () => {
          this.tippyDropdown.hide();
          this.drawType = m.toLowerCase() as ('distance'|'area'|'radius');
          this.addInteraction();
        },
        false
      );
      newDiv.appendChild(btn);
      if (i < (a.length - 1)) {
        const newHr = document.createElement('hr');
        newDiv.appendChild(newHr);
      }
    });

    return newDiv;
  }
  /**
   * Format length output.
   * @param {LineString} line The line.
   * @return {string} The formatted length.
   */
  formatLength(line: LineString): string {
    const length = getLength(line, {projection: ''});
    const output = Math.round(length * 3.28084).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + 'ft';

    return output;
  }

  /**
   * Format area output.
   * @param {Polygon} polygon The polygon.
   * @return {string} Formatted area.
   */
  formatArea(polygon: Polygon): string {
    const area = getArea(polygon);
    const output = Math.round(area * 10.7639).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + ' ' + 'ft\xB2';

    return output;
  }
  /**
 * Format radius output.
 * @param {CircleGeom} circle The polygon.
 * @return {string} Formatted radius.
 */
  formatRadius(circle: CircleGeom): string {
    const radius = circle.getRadius();
    const area = Math.PI * Math.pow(radius,2);
    const output = `Radius: ${Math.round(radius * 3.28084).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ft\nArea: ${Math.round(area * 10.7639).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ft\xB2`;

    return output;
  }
  addInteraction(): void {
    const activeTip = this.drawType === 'radius'
    ? 'Click to finish drawing'
    : 'Click to continue drawing; double-click to finish';
    const idleTip = 'Click to start measuring';
    const map = this.getMap()!;
    if (this.modify.getMap()) {
      map.removeInteraction(this.drawInteraction);
    }
    map.addInteraction(this.modify);
    map.getLayers().forEach(l => {
        if (l.get('className') === 'Hidden') {
          (l as LayerGroup).getLayers().getArray().find(l => l.getClassName() === 'DrawLayer')
          ? (l as LayerGroup).getLayers().extend([this.drawLayer])
          : undefined;
        }
    });
    let tip = idleTip;
    this.drawing = true;
    this.drawInteraction = new Draw({
      source: this.source,
      type: this.geomType[this.drawType],
      stopClick: true,
      style: (feature) => {
        return this.styleFunction(feature, tip);
      }
    });
    this.drawInteraction.on('drawstart', () => {
      this.source.clear();
      this.modify.setActive(false);
      tip = activeTip;
    });
    this.drawInteraction.on('drawend', () => {
      this.modifyStyle.setGeometry(this.tipPoint);
      this.modifyStyle.getText().setText(idleTip);
      this.modify.setActive(true);
      map.once('pointermove', () => {
        this.modifyStyle.setGeometry('');
      });
      tip = idleTip;
    });
    document.addEventListener(
      'keyup',
      (e) => {
        if (e.key === 'Escape') {
        this.endInteraction()
        }
      },
      {once: true}
    );
    this.modify.setActive(true);
    map.addInteraction(this.drawInteraction);
    this.drawLayer.setSource(this.source);
  }
  endInteraction(): void {
    const map = this.getMap()!;
    this.modify.setActive(false);
    this.drawing = false;
    map.removeInteraction(this.drawInteraction);
    console.info('End Measure Interaction');
  }
  styleFunction(feature: FeatureLike, tip?: any): Style | Array<Style> {
    const styles = [this.style];
    const geometry = feature.getGeometry();
    const type = geometry!.getType();
    let point, label, line;
    if (geometry instanceof Polygon) {
      point = (geometry as Polygon).getInteriorPoint();
      label = this.formatArea(geometry);
      line = new LineString((geometry as Polygon).getCoordinates()[0]);
    } else if (geometry instanceof CircleGeom) {
      point = new Point(geometry.getCenter());
      this.centroidStyle.setGeometry(point);
      styles.push(this.centroidStyle);
      label = this.formatRadius(geometry);
      line = new LineString(geometry.getExtent());
    } else if (geometry instanceof LineString) {
      point = new Point((geometry as LineString).getLastCoordinate());
      label = this.formatLength(geometry);
      line = geometry;
    }
    if (line) {
      let count = 0;
      (line as LineString).forEachSegment((a, b) => {
        const segment = new LineString([a, b]);
        const label = this.formatLength(segment);
        if (this.segmentStyles.length - 1 < count) {
          this.segmentStyles.push(this.segmentStyle.clone());
        }
        const segmentPoint = new Point(segment.getCoordinateAt(0.5));
        this.segmentStyles[count].setGeometry(segmentPoint);
        this.segmentStyles[count].getText().setText(label);
        styles.push(this.segmentStyles[count]);
        count++;
      });
    }
    if (label) {
      this.labelStyle.setGeometry(point as Point);
      this.labelStyle.getText().setText(label);
      styles.push(this.labelStyle);
    }
    if (
      tip &&
      type === 'Point' &&
      !this.modify.getOverlay().getSource().getFeatures().length
    ) {
      this.tipPoint = geometry;
      this.tipStyle.getText().setText(tip);
      styles.push(this.tipStyle);
    }
    return styles;
  }
}
