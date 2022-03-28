import { Feature, Geolocation } from 'ol';
import { Control } from 'ol/control';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import { generateIconStyle } from '../../utils/generate-layer';
import { createElementWith, generatePointSVG } from '../../utils/fns-utility';

export class Geolocate extends Control {
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
    this.geolocation = new Geolocation({
      trackingOptions: { enableHighAccuracy: true }
    });
    this.positionFeature = new Feature();
    this.accuracyFeature = new Feature();
    this.geolocationLayer = new VectorLayer({
      className: 'geolocation',
      source: new VectorSource({
        features: [this.accuracyFeature, this.positionFeature]
      })
    });
    const newBtn = createElementWith(false, 'button', {
      title: 'Find My Location',
      class: 'control-button geolocate',
      'aria-label': 'Circle with a Dot, Use to Find Current Location on Map',
      innerHTML: generatePointSVG('geo-alt-fill').outerHTML
    });
    newBtn.addEventListener(
      'click',
      this.handleClick.bind(this),
      false
    );
    this.element.appendChild(newBtn);
  }
  handleClick(event: MouseEvent): void {
    event.preventDefault();
    const map = this.getMap()!;
    if (!this.trackingActive) {
      map!.addLayer(this.geolocationLayer);

      this.geolocation.setTracking(true);
      this.geolocation.setProjection(map.getView().getProjection());
      this.trackingActive = true;

      this.geolocation.once('change:position', (e) => {
        this.positionFeature.setGeometry(new Point(this.geolocation.getPosition()!));
        this.positionFeature.setStyle(new Style({image: generateIconStyle('geo-alt-fill')}));
      });
      this.geolocation.once('change:accuracyGeometry', (e) => {
        const geom = this.geolocation.getAccuracyGeometry();
        if (geom) {
          this.accuracyFeature.setGeometry(geom);
          map!.getView().fit(geom.getExtent(), {
            padding: [50,50,50,50],
            duration: 350
          });
        };
      });
      this.geolocation.once('error', () => {
        console.warn('Geolocation Not Working!');
      });

      this.geolocation.once('change:position', () => {
        map!.getView().fit(this.geolocation.getAccuracyGeometry()!.getExtent(),
        { padding: [50,50,50,50],
          duration: 350
        })
      });
    } else {
      map!.removeLayer(this.geolocationLayer);
      this.geolocation.setTracking(false);
      this.trackingActive = false;
    };
  }
}
