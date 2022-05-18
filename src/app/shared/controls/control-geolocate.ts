import { Feature, Geolocation } from 'ol';
import { Control } from 'ol/control';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import { makeIconStyle } from '../utils/generate-style';
import { generatePointSVG } from '../utils/fns-utility';
import { MapToast } from '../classes/map-toast.class';
import { formatDMS } from '../utils/fns-google';
import { toLonLat } from 'ol/proj';

export class Geolocate extends Control {
  readonly name = 'geolocation';
  button_: HTMLElement;
  toast_: MapToast;
  geolocation: Geolocation;
  positionFeature: Feature<any>;
  accuracyFeature: Feature<any>;
  geolocationLayer: VectorLayer<any>;
  trackingActive = false;
  constructor(opts: { targetId?: string }) {
    super({ element: document.createElement('div') });
    this.set('name', this.name);
    this.geolocation = new Geolocation({
      trackingOptions: { enableHighAccuracy: true }
    });
    this.toast_ = new MapToast();
    this.positionFeature = new Feature();
    this.accuracyFeature = new Feature();
    this.positionFeature.setId('Your Location');
    this.accuracyFeature.setId('Location Accuracy');
    this.geolocationLayer = new VectorLayer({
      className: 'geolocation',
      source: new VectorSource({
        features: [this.accuracyFeature, this.positionFeature]
      })
    });
    this.button_ = document.createElement('button');
    this.button_.title = 'Find My Location';
    this.button_.setAttribute('type', 'button');
    this.button_.appendChild(generatePointSVG('geo-alt-fill', false));
    this.button_.onclick = this.handleClick.bind(this);

    this.element.className = 'ol-unselectable ol-custom-control';
    this.element.appendChild(this.button_);
  }
  handleClick(event: MouseEvent): void {
    event.preventDefault();
    if (!this.trackingActive) {
      this.getMap()!.addLayer(this.geolocationLayer);

      this.geolocation.setTracking(true);
      this.geolocation.setProjection(this.getMap()!.getView().getProjection());
      this.trackingActive = true;
      this.toast_.make({tone: 'info',header: 'Finding Your Location',timer: 'indeterminate'});

      this.geolocation.once('change:position', (e) => {
        const locationPt = this.geolocation.getPosition();
        if (locationPt) {
          this.positionFeature.setProperties({
            geometry: new Point(locationPt),
            'location': locationPt
          });
          this.positionFeature.setStyle(makeIconStyle({src: 'geo-alt-fill', label: 'Position Feature'}));
          this.getMap()!.getView().animate({
            center: locationPt,
            zoom: 5,
            duration: 400
          });
          this.toast_.make({tone: 'info', header: 'Location: ', value: formatDMS(toLonLat(locationPt)), timer: 'short'}).addClick('value');
        };
      });
      this.geolocation.once('change:accuracyGeometry', (e) => {
        const geom = this.geolocation.getAccuracyGeometry();
        console.info(e);
        if (geom) this.accuracyFeature.setGeometry(geom)
      });
      this.geolocation.once('error', () => {
        console.warn('Geolocation Not Working!');
      });
    } else {
      this.getMap()!.removeLayer(this.geolocationLayer);
      this.geolocation.setTracking(false);
      this.trackingActive = false;
    };
  }
}
