interface IObject {
  [key: string]: string | number | undefined;
}
export interface LyrConstants {
  'feat-type': 'Point' | 'Line' | 'Polygon';
  'layer-type': 'TileLayer' | 'VectorTileLayer' | 'VectorLayer';
  'style-type': 'basic' | 'boundary' | 'ramp-basic' | 'ramp-special';
  'Polygon': { label: string; fill: string; stroke?: string; strokeType?: 'solid' | 'dashed' | 'none'; };
  'Line': { label: string; stroke: string; strokeType: 'solid' | 'dashed' | 'none'; };
  'Point': { label: string; fill?: string; src?: string; };
  'Point-base': {
    label: string;
    fill?: string;
    offset?: [number, number];
    size?: 'xs'|'sm'|'rg'|'lg'|'xl';
    src?: string;
  };
  'labels': {
    prop: string;
    fill?: string;
    offset?: [number, number];
    resolution?: {min: number; max?: number;} | {min?: number; max: number;};
    size?: 'xs'|'sm'|'rg'|'lg'|'xl';
    stroke?: string;
  }
}
export interface LyrInitState {
  className: string,
  group: string,
  zIndex: number;
  visible?: boolean;
  minResolution?: number;
  maxResolution?: number;
  minZoom?: number;
  maxZoom?: number;
};
export type LyrInitSrc<LT extends LyrConstants['layer-type']> =
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
export type LyrStyleOpts<ST extends LyrConstants['style-type'], FT extends LyrConstants['feat-type']> = {
  keyProp: string;
  base: FT extends 'Point' ? LyrConstants['Point-base'] : LyrConstants[FT];
  labels?: LyrConstants['labels'];
} & (
  ST extends 'ramp-basic'|'ramp-special' ? {classes: { [key: string]: LyrConstants[FT]; };} : {}
);
export interface ArcPJSONResponse<T extends 'AddressPts'|'PropInfo'> {
  objectIdFieldName: 'FID' | string;
  uniqueIdField: { name: 'FID' | string; isSystemMaintained: boolean; };
  globalIdFieldName: any;
  geometryType: string;
  spatialReference: { wkid: 102100 | number; latestWkid: 3857 | number; };
  fields: Array<{
    name: string;
    type: string,
    alias: string;
    sqlType: string;
    domain: any;
    defaultValue: any;
  }>;
  features: Array<T extends 'AddressPts' ? ArcAddressPt : ArcPropInfo>;
}
export interface ArcGeoJSONResponse<T extends 'AddressPts'|'PropInfo'> {
  features: Array<{
    geometry: any;
    properties: T extends 'AddressPts' ? ArcAddressPt['attributes'] : ArcPropInfo;
    type: string;
  }>;
  type: string;
}
export interface SearchFeature {
  _id: {
    $oid: string;
  };
  Address: string;
  X: number;
  Y: number;
  BlockLot: string;
  PropLoc: string;
}
export interface ArcAddressPt {
  attributes: {
    ADDR_STREET: string;
    ADDR_LEGAL: string;
    BLOCK_LOT: string;
    POINT_X: number;
    POINT_Y: number;
  };
}
export interface SearchResult {
  type: 'FeatureCollection';
  properties: {
    exceededTransferLimit: boolean;
  };
  features: Array<SearchFeature>;
}
export interface ArcPropInfo extends IObject {
  MAPID?: string;
  BLOCK?: string;
  LOT?: string;
  QCODE?: string;
  AREA?: number;
  PERIMETER?: number;
  EASTING?: number;
  NORTHING?: number;
  LOT_BLOCK_LOT: string;
  LOT_PAMS_PIN?: string;
  MOD4_BLOCKNO?: number;
  MOD4_LOTNO?: number;
  MOD4_QUALNO?: string;
  MOD4_LASTUPDATE?: string;
  PROPLOC: string;
  PROPCLASS?: string;
  LANDDESC?: string;
  ACREAGE?: number;
  ADDLOTS?: string;
  ZONING?: string;
  TAXMAP?: number;
  BUILDDESC?: string;
  OWNERSNAME?: string;
  OWNERADD1?: string;
  OWNERADD2?: string;
  ZIPCODE?: number;
  NUMOWNERS?: number;
  NUMVETDEDS?: number;
  NUMWIDDEDS?: number;
  NUMSENDEDS?: number;
  NUMSURDEDS?: number;
  NUMDISDEDS?: number;
  NUMTOTDEDS?: number;
  DEDTOTAMT?: number;
  DEDUCTIONS?: string;
  TAXACCT?: string;
  BANKCODE?: number;
  MORTACCT?: string;
  DEEDBOOK?: string;
  DEEDPAGE?: number;
  SALESDATE?: string;
  SALESPRICE?: number;
  PRICECODE?: string;
  NUCODE1?: number;
  ASMNTCODE?: string;
  LANDVALUE?: number;
  IMPRVALUE?: number;
  NETVALUE?: number;
  EXMTCODE?: string;
  EXMTAMT?: number;
  EXMTAMT2?: number;
  EXMTTOT?: number;
  SPTAXCODE?: string;
  LSTYRTAX?: number;
  TENREBYR?: number;
  TENREBTAX?: number;
  EPLPART1?: number;
  EPLPART2?: number;
  EPLPART3?: number;
  INITFILING?: string;
  FURTHFILING?: string;
  STATUTE?: string;
  FACILITY?: string;
  SPECTAXDIST?: string;
  CITYWARD?: string;
  CLASS4TYPE?: string;
  OLDBLOCKNO?: string;
  OLDLOTNO?: string;
  OLDQUALCODE?: string;
  MOD4_BLOCK_LOT?: string;
  MOD4_PAMS_PIN?: string;
  OPPO_ZONE?: string;
  IN_UEZ?: number;
  HIST_DIST?: string;
  HIST_PROP?: string;
  RDV_PLAN?: string;
  RDV_CODE?: string;
  Shape__Area?: number;
  Shape__Length?: number;
}

type InitVals = {
  "button": undefined;
  "checkbox": boolean;
  "radio": boolean | string | number;
  "select": string;
}

export type SettingType<T extends keyof InitVals> = {
  type: T;
  options: Array<T extends 'button' ? {label: string} : {label: string; value: InitVals[T]; }>;
  fn?: (e: any) => any;
} & (
  T extends 'checkbox' ? {} : {outerLabel: string;}
);

export interface InitSettings {
  "AllowSelectHover": SettingType<"checkbox">;
  "AllowFeatureClickModal": SettingType<"checkbox">;
  "ShowCursorCoords": SettingType<"checkbox">;
}
export interface SettingsOptions extends InitSettings {
  [setting: string]: SettingType<'button'> | SettingType<'checkbox'> | SettingType<'radio'> | SettingType<'select'>;
}

export interface MapTableOpts {
  'basic': {header: string; subheader: string;};
  'attribute': {attributes: { [key: string]: any }};
  'legend': {
    styleType: LyrConstants['style-type'];
    featType: LyrConstants['feat-type'];
    classes: { [key: string]: LyrConstants['Point'|'Line'|'Polygon'|'Point-base']; };
  };
}
export interface ToastOpts {
  tone: 'warning' | 'info' | 'action';
  header: string;
  fn?: (el: any) => any;
  body?: any;
  timer?: 'short' | 'long' | 'indeterminate';
  value?: string;
}
