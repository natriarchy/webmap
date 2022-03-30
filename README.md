# Webmap

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.2.2.

## Project is Still a Work in Progress
- [https://natriarchy.github.io/webmap/](https://natriarchy.github.io/webmap/)

## Using OpenLayers Itself As Much As Possible

Rather than using angular features, I'm trying to use the OpenLayers package and basic javascript solutions exclusively, to make the end product more adaptable and reusable across use cases. This project is aimed at making a several custom control classes to expand functionality and generate a customizable front-end.

## Main Map Component 
#### [map-view.component](src/app/shared/components/map-view.component.ts)

## Custom Controls:
- BasemapToggle
  - [map-controls/control-basemap.class](src/app/shared/components/map-controls/control-basemap.class.ts)
- Fullscreen
  - [map-controls/control-fullscreen.class](src/app/shared/components/map-controls/control-fullscreen.class.ts)
- Geolocate
  - [map-controls/control-geolocate.class](src/app/shared/components/map-controls/control-geolocate.class.ts)
- LayersManager
  - [map-controls/control-layersmanager.class](src/app/shared/components/map-controls/control-layersmanager.class.ts)
- LeftPane
  - [map-controls/control-pane-left.class](src/app/shared/components/map-controls/control-pane-left.class.ts)
- Measure
  - [map-controls/control-measure.class](src/app/shared/components/map-controls/control-measure.class.ts)
- Search
  - [map-controls/control-search.class](src/app/shared/components/map-controls/control-search.class.ts)
- Settings
  - [map-controls/control-settings.class](src/app/shared/components/map-controls/control-settings.class.ts)
- ZoomExtentGroup
  - [map-controls/control-zoom-extent.class](src/app/shared/components/map-controls/control-zoom-extent.class.ts)

## Important Utilities
- See the [shared/utils](src/app/shared/utils/) folder for the functions a lot of the important work
- Layer Interfaces:
  - JSON File at [layer-details.json](src/assets/data/layer-details.json)
```typescript
export interface LayerDetailObj {
  lyrGroup: string;
  lyrName: string;
  lyrType: 'TileLayer' | 'VectorTileLayer' | 'VectorLayer';
  lyrZIndex: number;
  initVisible: boolean;
  srcUrl: string;
  srcAttribution: Array<string>;
  styleDetail: StyleDetailObj;
}
export interface StyleDetailObj {
  type: 'basic' | 'boundary' | 'ramp-basic' | 'ramp-special' | 'no style';
  keyProp?: string;
  idProp?: string;
  classObject?: {[key: string]: ClassObjectBase};
  labels?: {size: 'x-small' |'small' | 'normal' | 'large' | 'x-large'; property: string; fill?: string; strokeColor?: string; offset?: [number, number]; minResolution?: number; maxResolution?: number};
  icon?: {size: 'x-small' | 'small' | 'normal' | 'large' | 'x-large'; src?: string; description?: string; color?: string; offset?: [number, number]; };
  limits?: {minResolution?: number; maxResolution?: number; minZoom?: number; maxZoom?: number;};
};
export interface ClassObjectBase {
  fill: string;
  label: string;
  iconSrc?: string;
  strokeColor?: string;
  strokeType?:'solid' | 'dashed';
}
```
## Important Inspirations
- See the great work done by [Qulle, OpenLayers Toolbar - OLTB](https://github.com/qulle/oltb/tree/main)
