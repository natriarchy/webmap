import { Component, OnInit } from '@angular/core';

import { Map, View } from 'ol';
import OLObj from 'ol/Object';
import { Attribution, ScaleLine } from 'ol/control';
import { defaults, DragPan } from 'ol/interaction';
import { fromLonLat } from 'ol/proj';

// Custom Controls
import { BasemapToggle } from '../controls/control-basemap';
import { FullScreenCustom } from '../controls/control-fullscreen';
import { Geolocate } from '../controls/control-geolocate';
import { LayersMgmt } from '../controls/control-layers-mgmt';
import { Measure } from '../controls/control-measure';
import { ControlPaneEl } from '../controls/control-pane-el';
import { Search } from '../controls/control-search';
import { Settings } from '../controls/control-settings';
import { ControlToolbarEl } from '../controls/control-toolbar-el';
import { ZoomExtent } from '../controls/control-zoom-extent';

// Other Custom Classes
import { FeatureTooltip } from '../interactions/overlay-feature-tooltip';
import { FeatClickModal } from '../interactions/interaction-feat-click';
import { Lyr } from '../classes/map-lyr';
import { ExportMap } from '../controls/control-export-map';

@Component({
  selector: 'app-map-view',
  styleUrls: ['./map-view.component.scss'],
  templateUrl: './map-view.component.html'
})

export class MapViewComponent implements OnInit {
  instance: Map;
  defaultView = {
    center: fromLonLat([-74.1723667, 40.735657]),
    extent: [
        [-74.2853199, 40.7910592],
        [-74.0617852, 40.6733126]
      ].reduce((p,c) => p.concat(fromLonLat(c)),[]),
    resolutions: [
      76.43702828507324,
      38.21851414253662,
      19.10925707126831,
      9.554628535634155,
      4.77731426794937,
      2.388657133974685,
      1.1943285668550503,
      0.5971642835598172,
      0.29858214164761665,
      0.14929107082380833,
      0.074645535411904163,
      0.037322767705952081
    ]
  };

  constructor() {
    this.instance = new Map({
      layers: [],
      interactions: defaults({
          altShiftDragRotate: false,
          pinchRotate: false,
          shiftDragZoom: false
        }).extend([
            // allow mousewheel to pan map
            new DragPan({condition: e => (e.originalEvent.button === 1 || e.originalEvent.which === 2 || e.originalEvent.buttons === 4) }),
            new FeatClickModal({})
        ]),
      controls: [new Attribution(), new ScaleLine({units: 'us'})],
      overlays: [new FeatureTooltip({})],
      view: new View({
        center: this.defaultView.center,
        enableRotation: false,
        constrainResolution: true,
        resolution: this.defaultView.resolutions[2],
        resolutions: this.defaultView.resolutions
      })
    });
    // Initialize interaction settings for map object
    this.instance.set('settings', new OLObj({'AllowSelectHover': true, 'AllowFeatureClickModal': true}));
  }
  ngOnInit(): void {
    this.instance.setTarget('map-instance');
    this.addLayers().forEach(
      l => this.instance.addLayer(l.instance)
    );
    this.instance.getControls().extend(new ControlToolbarEl({position: 'top-left'}).with([
        new ZoomExtent({defaultExtent: this.defaultView.extent as [number,number,number,number]}),
        new Geolocate(),
        new Measure(),
        new BasemapToggle({sources: [
          {
            name: 'Streets',
            url: 'https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
            attribution: '<span><a href="http://www.openstreetmap.org/copyright">© OpenStreetMap</a> contributors, <a href="https://carto.com/attribution">© CARTO</a></span>'
          },
          {
            name: 'Satellite',
            // Re lyrs param { y queries for sattelite hybrid, s queries for just sattelite, r queries for standard Maps }
            url: 'https://mt{1-3}.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
            attribution: '<span>Imagery ©2020 Bluesky, Maxar Technologies, Sanborn, USDA Farm Service Agency, <a href="https://www.google.com/permissions/geoguidelines/attr-guide/">Google Streets & Satellite 2020</a></span>'
          }
        ]}),
        new FullScreenCustom(),
        new ExportMap()
    ]));
    this.instance.getControls().extend(new ControlToolbarEl({position: 'top'}).with([
        new Search({})
    ]));
    this.instance.getControls().extend(
      new ControlPaneEl({position:'left', toggleId: 'controltb-top'}).with([
        new LayersMgmt({type: 'pane', targetId: 'controlpn-left'}),
        new Settings()
      ])
    );

    setTimeout(() => {this.instance.updateSize();},1000);
  }

  arcRESTUrl(resName: string, outFields: Array<string>, opts?: {resNum?: number; query?: string; baseUrl?: string;}): string {
    const baseUrl = opts?.baseUrl ? opts.baseUrl.replace(/\/+$/, '') : 'https://services1.arcgis.com/WAUuvHqqP3le2PMh';
    const finalQ = `where=OBJECTID IS NOT NULL${opts?.query ? ' AND '+opts.query : ''}`;
    const params = `returnGeometry=true&f=geojson&${finalQ}&outFields="${outFields.join(',')}"`;

    return encodeURI(`${baseUrl}/arcgis/rest/services/${resName}/FeatureServer/${opts?.resNum || 0}/query?${params}`);
  }

  addLayers(): Array<Lyr<any>> {
    return [
      new Lyr('TileLayer', {className: 'basemap', group: 'Basemap', zIndex: 0, visible: true}, {
        url: 'https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
        attr: ['<span><a href="http://www.openstreetmap.org/copyright">© OpenStreetMap</a> contributors, <a href="https://carto.com/attribution">© CARTO</a></span>']
      }),
      new Lyr('VectorLayer', {group: 'Transit', className: 'Rail Stations', zIndex: 6, visible: true}, {
        url: 'assets/data/transit_njt.geojson'
      }).addStyle('ramp-special','Point', {
        keyProp: 'STATION',
        labels: {prop: 'STATION', fill: 'rgb(26,115,232)', offset: [25, 0] },
        base: {label: 'NJT - Train Stn', size: 'xs'},
        classes: {
          'EWR': {label: 'NJT - Newark Airport', fill: 'rgb(26,115,232)', src: 'assets/img/icons/Logo_Airport.png'},
          'Broad St.': {label: 'NJT - Broad St', fill: 'rgb(26,115,232)', src: 'assets/img/icons/Logo_Broad.png'},
          'Penn Stn.': {label: 'NJT - Penn Stn', fill: 'rgb(26,115,232)', src: 'assets/img/icons/Logo_Penn.png'}
        }
      }),
      new Lyr('VectorLayer', {group: 'Transit', className: 'Light Rail Stops', zIndex: 6, visible: true, maxResolution: 9.554628535634155}, {
        url: 'assets/data/transit_nlr.geojson'
      }).addStyle('basic', 'Point', {
        keyProp: 'STATION',
        labels: {prop: 'STATION', fill: 'rgb(26,115,232)', offset: [15, 0]},
        base: {label: 'Light Rail', size: 'xs', src: 'assets/img/icons/Logo_NLR.png'}
      }),
      new Lyr('VectorLayer', {group: 'Transit', className: 'Frequent Bus Stops', zIndex: 5, visible: false}, {
        url: this.arcRESTUrl('Newark_Bus_Stops_by_Service', ['StopID_NJT','StopID_GTFS','StopID_Location','Weekday_Lines','Weekend_Lines'], {query: 'Weekday_Headway_Minutes <= 10'})
      }).addStyle('basic', 'Point', {
        keyProp: 'StopID_Location',
        base: {label: 'Bus Stop: < 10min Avg. Wait', size: 'sm', src: 'assets/img/icons/bus_highfrequency.png'}
      }),
      new Lyr('VectorLayer', {group: 'Transit', className: 'Bus Stops', zIndex: 4, visible: false, maxResolution: 9 }, {
        url: this.arcRESTUrl('Newark_Bus_Stops_by_Service', ['StopID_NJT','StopID_GTFS','StopID_Location','Weekday_Lines','Weekend_Lines'], {query: 'Weekday_Headway_Minutes > 10'})
      }).addStyle('basic', 'Point', {
        keyProp: 'StopID_Location',
        base: {label: 'Bus Stop: > 10min Avg. Wait', size: 'xs', src: 'assets/img/icons/bus_lowfrequency.png'}
      }),
      new Lyr('VectorLayer', {group: 'Parcels & Zoning', className: 'Zoning_Districts', zIndex: 3, visible: true, minResolution: 1}, {
        url: this.arcRESTUrl('Newark_Zoning_Districts', ['ZONING','RDV_PLAN'])
      }).addStyle('ramp-special', 'Polygon', {
        keyProp: 'ZONING',
        base: {label:'Not Available', fill: 'rgb(0,0,0)'},
        classes: {
          'R-1': {label:'Residential: 1 Family', fill:'rgb(55,255,190)'},
          'R-2': {label:'Residential: 1-2 Family', fill:'rgb(255,255,0)'},
          'R-3': {label:'Residential: 1-3 Family', fill:'rgb(230,230,0)'},
          'R-4': {label:'Residential: Low-Rise Multi-Family', fill:'rgb(228,160,36)'},
          'R-5': {label:'Residential: Mid-Rise Multi-Family', fill:'rgb(255,140,0)'},
          'R-6': {label:'Residential: High-Rise Multi-Family', fill:'rgb(243,117,32)'},
          'C-1': {label:'Commercial: Neighborhood', fill:'rgb(255,190,190)'},
          'C-2': {label:'Commercial: Community', fill:'rgb(255,127,127)'},
          'C-3': {label:'Commercial: Regional', fill:'rgb(168,0,0)'},
          'I-1': {label:'Industrial: Light', fill:'rgb(232,190,255)'},
          'I-2': {label:'Industrial: Medium', fill:'rgb(223,115,255)'},
          'I-3': {label:'Industrial: Heavy', fill:'rgb(132,0,168)'},
          'MX-1': {label:'Mixed-Use: Low Intensity', fill:'rgb(190,255,232)'},
          'MX-2': {label:'Mixed-Use: Medium Intensity', fill:'rgb(0,230,169)'},
          'MX-3': {label:'Mixed-Use: High Intensity', fill:'rgb(0,168,132)'},
          INST: {label:'Institutional', fill:'rgb(115,178,255)'},
          PARK: {label:'Parks & Open Space', fill:'rgb(152,230,0)'},
          CEM: {label:'Cemeteries', fill:'rgb(112,168,0)'},
          RDV: {label:'Redevelopment Zone', fill:'rgb(225,225,225)'},
          EWR: {label:'Airport & Airport Support', fill:'rgb(178,178,178)'},
          PORT: {label:'Port Related Industrial', fill:'rgb(104,104,104)'}
        }
      }),
      new Lyr('VectorTileLayer', {group: 'Parcels & Zoning', className: 'Parcels by Zone', zIndex: 3, visible: true, maxResolution: 1}, {
        idProp: 'LOT_BLOCK_LOT',
        url: 'https://vectortileservices1.arcgis.com/WAUuvHqqP3le2PMh/arcgis/rest/services/Newark_Parcels_with_Ownership/VectorTileServer/tile/{z}/{y}/{x}.pbf',
        attr: ['<a href="https://njgin.nj.gov/">NJ GIN</a>', 'City of Newark Office of Planning & Zoning'],
        desc: 'City of Newark Parcel boundaries, current as of the July 2021 release from the Tax Assessors\' office. Incorporates information from State MODIV tax data'
      }).addStyle('ramp-special','Polygon', {
        keyProp: 'ZONING',
        base: {label:'Not Available', fill: 'rgb(0,0,0)'},
        classes:{
          'R-1': {label:'Residential: 1 Family', fill:'rgb(55,255,190)'},
          'R-2': {label:'Residential: 1-2 Family', fill:'rgb(255,255,0)'},
          'R-3': {label:'Residential: 1-3 Family', fill:'rgb(230,230,0)'},
          'R-4': {label:'Residential: Low-Rise Multi-Family', fill:'rgb(228,160,36)'},
          'R-5': {label:'Residential: Mid-Rise Multi-Family', fill:'rgb(255,140,0)'},
          'R-6': {label:'Residential: High-Rise Multi-Family', fill:'rgb(243,117,32)'},
          'C-1': {label:'Commercial: Neighborhood', fill:'rgb(255,190,190)'},
          'C-2': {label:'Commercial: Community', fill:'rgb(255,127,127)'},
          'C-3': {label:'Commercial: Regional', fill:'rgb(168,0,0)'},
          'I-1': {label:'Industrial: Light', fill:'rgb(232,190,255)'},
          'I-2': {label:'Industrial: Medium', fill:'rgb(223,115,255)'},
          'I-3': {label:'Industrial: Heavy', fill:'rgb(132,0,168)'},
          'MX-1': {label:'Mixed-Use: Low Intensity', fill:'rgb(190,255,232)'},
          'MX-2': {label:'Mixed-Use: Medium Intensity', fill:'rgb(0,230,169)'},
          'MX-3': {label:'Mixed-Use: High Intensity', fill:'rgb(0,168,132)'},
          INST: {label:'Institutional', fill:'rgb(115,178,255)'},
          PARK: {label:'Parks & Open Space', fill:'rgb(152,230,0)'},
          CEM: {label:'Cemeteries', fill:'rgb(112,168,0)'},
          RDV: {label:'Redevelopment Zone', fill:'rgb(225,225,225)'},
          EWR: {label:'Airport & Airport Support', fill:'rgb(178,178,178)'},
          PORT: {label:'Port Related Industrial', fill:'rgb(104,104,104)'}
        },
        labels: {prop: 'LOT_BLOCK_LOT', size: 'sm', fill: 'rgb(120,120,120)', stroke: '#F0F0F0'}
      }),
      new Lyr('VectorLayer', {group: 'Other Layers', className: 'Historic_Districts', zIndex: 4, visible: false}, {
        url: this.arcRESTUrl('Newark_Historic_Assets',['ABR_NAME'],{resNum: 1, query: "STATUS='LISTED'"}),
        attr: ['<a href="https://data-newgin.opendata.arcgis.com/datasets/NewGIN::newark-historic-districts">NewGIN: Newark Historic Districts</a>'],
      }).addStyle('basic','Polygon', {
        keyProp: 'ABR_NAME',
        base: {fill: 'rgb(128,147,241)', stroke: 'rgb(128,147,241)', strokeType: 'dashed', label: 'Historic District'},
        labels: {prop: 'ABR_NAME', size: 'lg', fill: 'rgb(255,255,255)', stroke: 'rgb(128,147,241)'}
      }),
      new Lyr('VectorLayer', {group: 'Other Layers', className: 'Historic_Landmarks', zIndex: 5}, {
        url: this.arcRESTUrl('Newark_Historic_Assets',['bldgdesc'])
      }).addStyle('basic', 'Point', {
        keyProp: 'bldgdesc',
        base: {fill: 'rgb(128,147,241)', label: 'Historic Landmark'},
        labels: {prop: 'bldgdesc', fill: 'rgb(128,147,241)', resolution: {min: undefined, max: 2.5}}
      }),
      new Lyr('VectorLayer', {group: 'Other Layers', className: 'Redevelopment_Plans', zIndex: 4}, {
        url: this.arcRESTUrl('Newark_Redevelopment_Plan_Areas',['ShortName','Name']),
        attr: ['<a href="https://data-newgin.opendata.arcgis.com/datasets/NewGIN::newark-redevelopment-plan-areas">NewGIN: Newark Redevelopment Plan Areas</a>']
      }).addStyle('basic', 'Polygon', {
        keyProp: 'ShortName',
        base: {fill: 'rgb(254,95,05)', label: 'Redevelopment Plan Area', stroke: 'rgb(254,95,0)', strokeType: 'dashed'},
        labels: {prop: 'ShortName', fill: 'rgb(255,255,255)', stroke: 'rgb(254,95,0)'}
      }),
      new Lyr('VectorLayer', {group: 'Other Layers', className: 'Designated Truck Routes', zIndex: 4}, {
        url: this.arcRESTUrl('Newark_Designated_Truck_Routes',['PRIME_NAME','TruckRteDesig'])
      }).addStyle('ramp-special','Line', {
        keyProp: 'TruckRteDesig',
        base: {stroke: 'rgb(150,150,150)', strokeType: 'solid', label: 'Other'},
        classes:{
          'Prohibited': {stroke: 'rgb(255,0,0)', strokeType: 'dashed', label: 'Prohibited'},
          'Local': {stroke: 'rgb(85,255,0)', strokeType: 'solid', label: 'Local'},
          'County': {stroke: 'rgb(255,170,0)', strokeType: 'solid', label: 'County'},
          'State': {stroke: 'rgb(115,178,255)', strokeType: 'solid', label: 'State'},
          'National': {stroke: 'rgb(0,77,168)', strokeType: 'solid', label: 'Naional'}
        }
      }),
      new Lyr('VectorLayer', {group: 'Economic Development', className: 'Opportunity Zones', zIndex: 4}, {
        url: this.arcRESTUrl('Newark_Economic_Development',['NAMELSAD'],{resNum: 1}),
        attr: ['<a href="https://data-newgin.opendata.arcgis.com/datasets/NewGIN::newark-opportunity-zones">NewGIN: Newark Opportunity Zones</a>']
       }).addStyle('basic','Polygon', {
        keyProp: 'NAMELSAD',
        base: {fill: 'rgb(106,88,55)', label: 'Opportunity Zone', stroke: 'rgb(106,88,55)', strokeType: 'solid'},
        labels: {prop: 'NAMELSAD'}
      }),
      new Lyr('VectorLayer', {group: 'Economic Development', className: 'Urban Enterprise Zone', zIndex: 4}, {
        url: this.arcRESTUrl('Newark_Economic_Development',['UEZ_NAME'],{resNum: 2}),
        attr: ['<a href="https://data-newgin.opendata.arcgis.com/datasets/NewGIN::newark-urban-enterprise-zone">NewGIN: Newark Urban Enterprise Zone</a>']
      }).addStyle('basic', 'Polygon', {
        keyProp: 'NAMELSAD',
        base: {label: 'Urban Enterprise Zone', fill: 'rgb(226,157,227)', stroke: 'rgb(226,157,227)', strokeType: 'solid'}
      }),
      new Lyr('VectorLayer', {group: 'Boundaries',className: 'Census Tracts', zIndex: 5}, {
        url: this.arcRESTUrl('Census_Geographies',['NAMELSAD'],{resNum: 2}),
        attr: ['<a href="https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/8">US Census TIGER: Census Tracts</a>'],
        desc: 'City of Newark Census Tracts, as delineated by the 2020 release of US Census TIGER Boundaries'
      }).addStyle('boundary','Polygon', {
        keyProp: 'NAMELSAD',
        base: {label: 'Census Tract', fill: 'transparent', stroke: 'rgb(0,0,0)', strokeType: 'solid'},
        labels: {prop: 'NAMELSAD', fill: 'rgb(255,255,255)', stroke: 'rgb(0,0,0)'}
      }),
      new Lyr('VectorLayer', {group: 'Boundaries', className: 'Zipcodes', zIndex: 5}, {
        url: this.arcRESTUrl('Census_Geographies',['ZCTA5CE10'],{resNum: 3}),
        attr: ['<a href="https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer/2">US Census TIGER: 2010 Zip Code Tabulation Areas</a>'],
        desc: 'City of Newark Zipcodes Tabulation Areas, as delineated by the 2010 release of US Census TIGER Boundaries.'
      }).addStyle('boundary', 'Polygon', {
        keyProp: 'ZCTA5CE10',
        base: {label: 'Zipcode Boundary', fill: 'transparent', stroke: 'rgb(0,0,0)', strokeType: 'solid'},
        labels: {prop: 'ZCTA5CE10', fill: 'rgb(255,255,255)', stroke: 'rgb(0,0,0)'}
      }),
      new Lyr('VectorLayer', {group: 'Boundaries', className: 'Newark Neighborhoods', zIndex: 5 }, {
        url: this.arcRESTUrl('Newark_Geographies',['name']),
        attr: ['<a href="https://data-newgin.opendata.arcgis.com/datasets/NewGIN::newark-neighborhoods">NewGIN: Newark Neighborhoods</a>'],
        desc: 'City of Newark Neighborhods, as used by Newark Planning & Zoning Office and codified in the 2015 Zoning and Land Use Regulations.'
      }).addStyle('boundary','Polygon', {
        keyProp: 'name',
        base: {label: 'Neighborhood', fill: 'transparent', stroke: 'rgb(0,0,0)', strokeType: 'solid'},
        labels: {prop: 'name', fill: 'rgb(255,255,255)', stroke: 'rgb(0,0,0)'}
      }),
      new Lyr('VectorLayer', {group: 'Boundaries', className: 'Newark Wards', zIndex: 5 }, {
        url: this.arcRESTUrl('Newark_Geographies',['WARD_NAME'],{resNum: 1}),
        attr: ['<a href="https://data-newgin.opendata.arcgis.com/datasets/NewGIN::newark-wards">NewGIN: Newark Wards</a>'],
        desc: 'City of Newark Ward Boundaries as delineated in 2012, the last census redistricting. Boundaries drawn to reflect similar similar population totals amongst the five wards.'
      }).addStyle('boundary','Polygon', {
        keyProp: 'WARD_NAME',
        base: {label: 'Ward', fill: 'transparent', stroke: 'rgb(0,0,0)', strokeType: 'dashed'},
        labels: {prop: 'WARD_NAME', fill: 'rgb(255,255,255)', stroke: 'rgb(0,0,0)'}
      })
    ];
  }
}

