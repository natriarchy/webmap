import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArcGeoJSONResponse } from '../models';
import { propFields } from '../utils/constants';

/**
 * Service to generate map and set up layers
 * @method initMap() Instantiate new map instance
 */
@Injectable({ providedIn: 'root' })
export class MapInfoService {
  constructor(
    private http: HttpClient
  ) {}

  getPropInfo(queryType: 'LOT_BLOCK_LOT' | 'PROPLOC' | 'XY', queryValue: string | [number, number], outFields: 'basic' | 'detailed' | 'geometry'): Observable<ArcGeoJSONResponse<'PropInfo'>> {
    const fields: {[type: string]: Array<string>;} = {
      basic: [ 'LOT_BLOCK_LOT', 'MOD4_BLOCK_LOT', 'PROPLOC', 'ADDLOTS', 'ZONING', 'RDV_PLAN', 'RDV_CODE', 'HIST_DIST', 'HIST_PROP', 'OPPO_ZONE', 'IN_UEZ' ],
      detailed: [],
      geometry: ['LOT_BLOCK_LOT']
    };
    if (outFields === 'detailed') {
      Object.keys(propFields).forEach(k => {
        propFields[k].forEach(f => fields['detailed'].push(f.field));
      });
    }
    const arcBaseUrl = 'https://services1.arcgis.com/WAUuvHqqP3le2PMh/ArcGIS/rest/services/Newark_Parcels_with_Ownership/FeatureServer/0/query?';
    const arcQuery = queryType === 'XY' ? `geometry={"x":${queryValue[0]},"y":${queryValue[1]},"spatialReference":{"wkid" : 4326}}` : `where="${queryType}"='${queryValue}'`;
    const arcParams = `&outFields=${fields[outFields].join(',')}&${arcQuery}&returnGeometry=${String(outFields === 'geometry')}&resultRecordCount=1&f=geojson`;

    return this.http.get<ArcGeoJSONResponse<'PropInfo'>>(
      `${arcBaseUrl}${arcParams}`
    );
  }
}
