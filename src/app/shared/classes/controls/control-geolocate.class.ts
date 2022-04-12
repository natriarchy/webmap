import { Feature, Geolocation } from 'ol';
import { Control } from 'ol/control';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import { generateIconStyle } from '../../utils/generate-style';
import { createElementWith, generatePointSVG } from '../../utils/fns-utility';
import { MapToast } from '../elements/map-toast.class';
import { formatDMS } from '../../utils/fns-google';
import { toLonLat } from 'ol/proj';

export class Geolocate extends Control {
  name = 'geolocation';
  geolocation: Geolocation;
  positionFeature: Feature<any>;
  accuracyFeature: Feature<any>;
  geolocationLayer: VectorLayer<any>;
  trackingActive = false;
  constructor(
    options: {
      parentContainer: HTMLElement
    }) {
    super({
      element: options.parentContainer
    });
    this.set('name', this.name);
    this.geolocation = new Geolocation({
      trackingOptions: { enableHighAccuracy: true }
    });
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
    const newBtn = createElementWith(false, 'button', {
      title: 'Find My Location',
      class: 'webmap-btn ctrl geolocate',
      'aria-label': 'Circle with a Dot, Use to Find Current Location on Map',
      innerHTML: generatePointSVG('geo-alt-fill').outerHTML,
      onclick: this.handleClick.bind(this)
    });
    this.element.appendChild(newBtn);
  }
  handleClick(event: MouseEvent): void {
    event.preventDefault();
    if (!this.trackingActive) {
      this.getMap()!.addLayer(this.geolocationLayer);

      this.geolocation.setTracking(true);
      this.geolocation.setProjection(this.getMap()!.getView().getProjection());
      this.trackingActive = true;
      new MapToast({tone: 'info',header: 'Finding Your Location',timer: 'indeterminate'});

      this.geolocation.once('change:position', (e) => {
        const locationPt = this.geolocation.getPosition();
        if (locationPt) {
          this.positionFeature.setProperties({
            geometry: new Point(locationPt),
            'location': locationPt
          });
          this.positionFeature.setStyle(new Style({image: generateIconStyle('geo-alt-fill')}));
          this.getMap()!.getView().animate({
            center: locationPt,
            zoom: 5,
            duration: 400
          });
          new MapToast({tone: 'info', header: 'Location: ', value: formatDMS(toLonLat(locationPt)), timer: 'short'}).addClick('value');
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
