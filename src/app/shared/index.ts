import { MapViewComponent } from './components/map-view.component';

import { JsonDataService } from './services/json-data.service';
import { MapInfoService } from './services/map-info.service';

export const components = [
  MapViewComponent
];

export const services = [
  JsonDataService,
  MapInfoService,
];

export * from './components/map-view.component';

export * from './services/json-data.service';
export * from './services/map-info.service';
