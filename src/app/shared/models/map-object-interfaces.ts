interface IObject {
  [key: string]: string | number | undefined;
}
export interface ClassObjectBase {
  fill: string;
  label: string;
  iconSrc?: string;
  strokeColor?: string;
  strokeType?:'solid' | 'dashed';
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
export interface LayerDetailObj {
  lyrGroup: string;
  lyrName: string;
  lyrType: 'TileLayer' | 'VectorTileLayer' | 'VectorLayer';
  lyrZIndex: number;
  initVisible: boolean;
  srcUrl: string;
  srcAttribution: Array<string>;
  srcDescription: string;
  styleDetail: StyleDetailObj;
}
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
  "boolean": boolean;
  "options": Array<{label: string; val: any}>;
  "action": never;
}

export type SettingType<T extends keyof InitVals, E extends boolean> = {
  type: T;
  label: string;
} & (
  T extends 'action' ? {} : { initValue: InitVals[T]; }
) & (
  E extends true ? { fn?: () => any; } : {}
);

export interface SettingsOptions<E extends boolean> {
  [setting: string]: SettingType<'action', E> | SettingType<'boolean', E> | SettingType<'options', E>;
}
export interface SettingsOptionsMaster extends SettingsOptions<true> {
  'Allow Hover': SettingType<'boolean', true>;
  'Show Coordinates': SettingType<'boolean', true>;
}
