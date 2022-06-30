import { Feature, Geolocation } from 'ol';
import Control from 'ol/control/Control';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import { toLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import { Circle, Fill, Stroke, Style } from 'ol/style';
import { MapToast } from '../classes/map-toast.class';
import { formatDMS } from '../utils/fns-google';

export class Geolocate extends Control {
  readonly name = 'geolocation';
  readonly icons = {
    ctrl: 'geo-alt-fill'
  };
  _ctrlBtn: HTMLElement;
  _toast: MapToast;
  _gl: Geolocation;
  positionFt: Feature<any>;
  accuracyFt: Feature<any>;
  glLayer: VectorLayer<any>;
  active = false;
  constructor(opts?: { targetId?: string }) {
    super({ element: document.createElement('div') });
    this.set('name', this.name);

    this._gl = new Geolocation({ trackingOptions: { enableHighAccuracy: true } });

    this._toast = new MapToast();

    this.positionFt = new Feature();
    this.positionFt.setId('Your Location');
    this.positionFt.setStyle(
      new Style({
        image: new Circle({
          fill: new Fill({color: 'rgb(51, 153, 204)'}),
          stroke: new Stroke({color: 'white', width: 2}),
          radius: 6
        })
      })
    );

    this.accuracyFt = new Feature();
    this.accuracyFt.setId('Location Accuracy');
    this.accuracyFt.setStyle(
      new Style({fill: new Fill({ color: 'rgba(51, 153, 204, 0.1)' }) })
    );

    this.glLayer = new VectorLayer({
      className: 'geolocation',
      zIndex: 10,
      source: new VectorSource({ features: [this.accuracyFt, this.positionFt] })
    });

    this._ctrlBtn = document.createElement('button');
    this._ctrlBtn.title = 'Find My Location';
    this._ctrlBtn.setAttribute('type', 'button');
    this._ctrlBtn.innerHTML = `<span class="bi bi-${this.icons['ctrl']}"></span>`;
    this._ctrlBtn.onclick = this.handleClick.bind(this);

    this.element.className = 'ol-unselectable ol-custom-control';
    this.element.appendChild(this._ctrlBtn);
  }
  handleClick(e: MouseEvent): void {
    e.preventDefault();
    if (!this.active) {
      if (!this.getMap()!.getAllLayers().includes(this.glLayer)) this.getMap()!.addLayer(this.glLayer);

      this._gl.setTracking(true);
      this._gl.setProjection(this.getMap()!.getView().getProjection());
      this.active = true;
      this._toast.make({tone: 'info', header: 'Finding Your Location', timer: 'indeterminate'});

      this._gl.once('change:position', e => {
        const posPt = this._gl.getPosition();
        if (posPt) {
          this.positionFt.setProperties({ geometry: new Point(posPt), location: posPt });
          this.getMap()!.getView().animate({ center: posPt, zoom: 5, duration: 500 });
          this._toast.make({tone: 'info', header: 'Location: ', value: formatDMS(toLonLat(posPt)), timer: 'short'}).addClick('value');
          setTimeout(() => {
            this._gl.setTracking(false);
            this.active = false;
          }, 700);
        };
      });
      this._gl.once('change:accuracyGeometry', e => {
        const geom = this._gl.getAccuracyGeometry();
        if (geom) this.accuracyFt.setGeometry(geom);
      });
      this._gl.once('error', () => console.warn('Geolocation Not Working!'));
    } else {
      // this.getMap()!.removeLayer(this.glLayer);
      this._gl.setTracking(false);
      this.active = false;
    };
  }
}
