import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { Map, View } from 'ol';
import { Attribution, ScaleLine } from 'ol/control';
import { defaults, DragPan } from 'ol/interaction';
import { fromLonLat } from 'ol/proj';

// Custom Controls
import { BasemapToggle } from '../controls/control-basemap';
import { FullScreenCustom } from '../controls/control-fullscreen';
import { Geolocate } from '../controls/control-geolocate';
import { LayersManager } from '../controls/control-layersmanager';
import { Measure } from '../controls/control-measure';
import { ControlPaneEl } from '../controls/control-pane-el';
import { Search } from '../controls/control-search';
import { Settings } from '../controls/control-settings';
import { ControlToolbarEl } from '../controls/control-toolbar-el';
import { ZoomExtentGroup } from '../controls/control-zoom-extent';

// Other Custom Classes
import { FeatureTooltip } from '../interactions/overlay-feature-tooltip';
import { FeatClickModal } from '../interactions/interaction-feat-click';

import { LayerDetailObj } from '../models';
import { makeLayer } from '../utils/generate-layer';


@Component({
  selector: 'app-map-view',
  styleUrls: ['./map-view.component.scss'],
  templateUrl: './map-view.component.html'
})

export class MapViewComponent implements OnInit {
  instance: Map;
  defaultExtent = fromLonLat([-74.2853199, 40.7910592]).concat(fromLonLat([-74.0617852, 40.6733126])) as [number, number, number, number];

  constructor(readonly http: HttpClient) {
    this.instance = new Map({
      layers: [],
      interactions: defaults({
          altShiftDragRotate: false,
          pinchRotate: false,
          shiftDragZoom: false
        }).extend([
            // allow mousewheel to pan map
            new DragPan({ condition: e => (e.originalEvent.button === 1 || e.originalEvent.which === 2 || e.originalEvent.buttons === 4) }),
            new FeatClickModal({})
        ]),
      controls: [new Attribution(), new ScaleLine({units: 'us'})],
      overlays: [new FeatureTooltip({})],
      view: new View({
        center: fromLonLat([-74.1723667, 40.735657]),
        enableRotation: false,
        constrainResolution: true,
        resolution: 19.10925707126831,
        resolutions: [
          76.43702828507324, 38.21851414253662, 19.10925707126831,
          9.554628535634155, 4.77731426794937, 2.388657133974685,
          1.1943285668550503, 0.5971642835598172, 0.29858214164761665,
          0.14929107082380833, 0.074645535411904163, 0.037322767705952081
        ]
      })
    });
    // Initialize interaction settings for map object
    ['AllowSelectHover','AllowFeatureClickModal'].forEach(s => this.instance.set(s, true));
  }
  ngOnInit(): void {
    this.instance.setTarget('map-instance');
    this.instance.getControls().extend(new ControlToolbarEl({position: 'top-left'}).with([
        new ZoomExtentGroup({defaultExtent: this.defaultExtent}),
        new Geolocate({}),
        new Measure({}),
        new BasemapToggle({sources: [
          {
            name: 'Streets',
            url: 'https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
            attribution: '<span><a href="http://www.openstreetmap.org/copyright">© OpenStreetMap</a> contributors, <a href="https://carto.com/attribution">© CARTO</a></span>'
          },
          {
            name: 'Satellite',
            // lyrs param {y queries for sattelite hybrid, s queries for just sattelite, r queries for standard Maps}
            url: 'https://mt{1-3}.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
            attribution: '<span>Imagery ©2020 Bluesky, Maxar Technologies, Sanborn, USDA Farm Service Agency, <a href="https://www.google.com/permissions/geoguidelines/attr-guide/">Google Streets & Satellite 2020</a></span>'
          }
        ]}),
        new FullScreenCustom({})
    ]));
    this.instance.getControls().extend(new ControlToolbarEl({position: 'top'}).with([
        new Search({})
    ]));
    this.instance.getControls().extend(
      new ControlPaneEl({position:'left', toggleTargetId: 'controltb-top'}).with([
        new LayersManager({}),
        new Settings({})
      ])
    );
    this.http.get<Array<LayerDetailObj>>('assets/data/layer-details.json')
      .subscribe({
        next: r => this.instance.setLayers(
          r.map(l => makeLayer(l.lyrGroup, l.lyrName, l.lyrType, l.lyrZIndex, l.initVisible, l.srcUrl, l.srcAttribution, l.srcDescription || '',l.styleDetail))
        ),
        complete: () => console.info('Layers Loaded')
    });

    setTimeout(() => {this.instance.updateSize();},1000);
  }
}

