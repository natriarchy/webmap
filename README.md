# Webmap

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.2.2.

## Project is Still a Work in Progress
- [https://natriarchy.github.io/webmap/](https://natriarchy.github.io/webmap/)

## Using OpenLayers Itself As Much As Possible

Rather than using angular features, I'm trying to use the OpenLayers package and basic javascript solutions exclusively, to make the end product more adaptable and reusable across use cases. This project is aimed at making several custom control classes to expand functionality and generate a customizable front-end.

## Main Map Component 
#### [map-view.component](src/app/shared/map-view.component.ts)

## Custom Controls:
- BasemapToggle
  - [controls/control-basemap](src/app/shared/controls/control-basemap.ts)
- CtrlPaneEl
  - [controls/control-pane-el](src/app/shared/controls/control-pane-el.ts)
- CtrlToolbarEl
  - [controls/control-toolbar-el](src/app/shared/controls/control-toolbar-el.ts)
- ExportMap
  - [controls/control-export-map](src/app/shared/controls/control-export-map.ts)
- Fullscreen
  - [controls/control-fullscreen](src/app/shared/controls/control-fullscreen.ts)
- Geolocate
  - [controls/control-geolocate](src/app/shared/controls/control-geolocate.ts)
- LayersMgmt
  - [controls/control-layers-mgmt](src/app/shared/controls/control-layers-mgmt.ts)
  - Updated to have an in-pane and standalone version
- Measure
  - [controls/control-measure](src/app/shared/controls/control-measure.ts)
  - Includes radius, distance and area measurement.
- ModalCtrl
  - [controls/control-modal](src/app/shared/controls/control-modal.ts)
- Search (Early in development)
  - [controls/control-search](src/app/shared/controls/control-search.ts)
- Settings (Early in development)
  - [controls/control-settings](src/app/shared/controls/control-settings.ts)
- ToastCtrl
  - [controls/control-toast](src/app/shared/controls/control-toast.ts)
- ZoomExtentGroup
  - [controls/control-zoom-extent](src/app/shared/controls/control-zoom-extent.ts)

## Important Utilities
- See the [shared/utils](src/app/shared/utils/) folder for the functions a lot of the important work
  - This is less the case now, as I'm trying to make each control as self-sufficient as possible
- Layer Interfaces:
  - This is in flux, working to have simplified class objects to make the layers. That way there's more context for parameters.
  - I'm working to base it on a single [Lyr](src/app/shared/classes/map-lyr.ts) class, with the addStyle method
```typescript
new Lyr('VectorLayer',
  {group: 'Transit', className: 'Rail Stations', zIndex: 6, visible: true}, 
  {url: 'assets/data/transit_njt.geojson'}
).setStyle('ramp-special','Point', {
  keyProp: 'STATION',
  labels: {prop: 'STATION', fill: 'rgb(26,115,232)', offset: [25, 0] },
  base: {label: 'NJT - Train Stn', size: 'xs'},
  classes: {
    'EWR': {label: 'NJT - Newark Airport', fill: 'rgb(26,115,232)', src: 'assets/img/icons/Logo_Airport.png'},
    'Broad St.': {label: 'NJT - Broad St', fill: 'rgb(26,115,232)', src: 'assets/img/icons/Logo_Broad.png'},
    'Penn Stn.': {label: 'NJT - Penn Stn', fill: 'rgb(26,115,232)', src: 'assets/img/icons/Logo_Penn.png'}
  }
});

interface LyrInitState {
  className: string,
  group: string,
  zIndex: number;
  visible?: boolean;
  minResolution?: number;
  maxResolution?: number;
  minZoom?: number;
  maxZoom?: number;
};

interface LyrConstants {
  'feat-type': 'Point' | 'Line' | 'Polygon';
  'layer-type': 'TileLayer' | 'VectorTileLayer' | 'VectorLayer';
  'style-type': 'basic' | 'boundary' | 'ramp-basic' | 'ramp-special';
  'Polygon': { label: string; fill: string; stroke?: string; strokeType?: 'solid' | 'dashed'; };
  'Line': { label: string; stroke: string; strokeType: 'solid' | 'dashed'; };
  'Point': { label: string; fill?: string; src?: string; };
  'Point-base': { label: string; fill?: string; offset?: [number, number]; size?: 'xs'|'sm'|'rg'|'lg'|'xl'; src?: string; };
  'labels': { prop: string; fill?: string; offset?: [number, number]; resolution?: {min: number; max?: number;} | {min?: number; max: number;}; size?: 'xs'|'sm'|'rg'|'lg'|'xl'; stroke?: string; }
};

type LyrInitSrc<LT extends LyrConstants['layer-type']> =
LT extends 'VectorTileLayer' ? {
  idProp: string;
  url: string;
  attr?: Array<string>;
  desc?: string;
} : {
  url: string;
  attr?: Array<string>;
  desc?: string;
};

type LyrStyleOpts<ST extends LyrConstants['style-type'], FT extends LyrConstants['feat-type']> = {
  keyProp: string;
  base: FT extends 'Point' ? LyrConstants['Point-base'] : LyrConstants[FT];
  labels?: LyrConstants['labels'];
} & (
  ST extends 'ramp-basic'|'ramp-special' ? {classes: { [key: string]: LyrConstants[FT]; };} : {}
);
```
## Important Inspirations
- See the great work done by [Qulle, OpenLayers Toolbar - OLTB](https://github.com/qulle/oltb/tree/main)
