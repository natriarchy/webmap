import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
} from '@angular/core';
import { Overlay, View, Map, MapBrowserEvent } from 'ol';
import { Attribution, ScaleLine } from 'ol/control';
import { defaults, DragPan, Draw, Select } from 'ol/interaction';
import {Condition, pointerMove} from 'ol/events/condition';
import { fromLonLat } from 'ol/proj';
import * as MyControls from './map-controls';
import { LayerDetailObj } from '../models';
import { MapInfoService } from '../services';
import { makeLayer } from '../utils/generate-layer';
import { generateAttrTable } from '../utils/fns-utility';

@Component({
  selector: 'app-map-view',
  styleUrls: ['./map-view.component.scss'],
  templateUrl: './map-view.component.html'
})

export class MapViewComponent implements OnInit, AfterViewInit {
  instance: Map = new Map({});
  controlsTopLeftElement: HTMLElement | undefined;
  controlsToolbarElement: HTMLElement | undefined;
  controlsPaneLeftElement: HTMLElement | undefined;
  pointerPopupElement: HTMLElement | undefined;
  defaultExtent = fromLonLat([-74.2853199, 40.7910592]).concat(fromLonLat([-74.0617852, 40.6733126])) as [number, number, number, number];
  leftPaneToggle: MyControls.LeftPane | undefined;
  drawInteraction: Draw | undefined;
  pointerTooltip: Overlay = new Overlay({});
  selectHover: Select = new Select();
  isCanvasCondition: Condition = (e: MapBrowserEvent<any>) => e.originalEvent.target.tagName === 'CANVAS' || this.pointerPopupElement?.contains(e.originalEvent.target) === true;
  constructor(
    private readonly host: ElementRef,
    readonly http: HttpClient,
    readonly mapInfoService: MapInfoService
    ) {}
  ngOnInit(): void {
    this.controlsTopLeftElement = document.getElementById('controls-top-left')!;
    this.controlsToolbarElement = document.getElementById('controls-top-toolbar')!;
    this.controlsPaneLeftElement = document.getElementById('controls-pane-left')!;
    this.pointerPopupElement = document.getElementById('pointer-popup')!;
    this.instance = new Map({
      layers: [],
      interactions: defaults({ pinchRotate: false })
        .extend(
          // allow mousewheel click to pan map
          // tslint:disable-next-line: no-string-literal
          [
            new DragPan({ condition: e => (e.originalEvent['which'] === 2) }),
            this.selectHover = new Select({
              condition: (e) => pointerMove(e) && this.isCanvasCondition(e),
              hitTolerance: 10,
              style: null
            })
          ]
        ),
      controls: [
        new Attribution({target: document.querySelector('footer .scale-bar')! as HTMLElement,}),
        new MyControls.ZoomExtentGroup({parentContainer: this.controlsTopLeftElement!, defaultExtent: this.defaultExtent}),
        new MyControls.Geolocate({parentContainer: this.controlsTopLeftElement!}),
        new MyControls.Measure({parentContainer: this.controlsTopLeftElement!}),
        new MyControls.BasemapToggle({parentContainer: this.controlsTopLeftElement!}),
        new MyControls.LayersManager({parentContainer: this.controlsPaneLeftElement!}),
        new MyControls.Fullscreen({parentContainer: this.controlsTopLeftElement!}),
        new MyControls.LeftPane({paneName: 'Menu', toggleBtnContainer: document.getElementById('controls-top-toolbar')!, paneElement: this.controlsPaneLeftElement!}),
        new MyControls.Search({parentContainer: document.getElementById('controls-top-toolbar')!}),
        new MyControls.Settings({parentContainer: this.controlsPaneLeftElement!}),
        new ScaleLine({ target: document.querySelector('footer .scale-bar')! as HTMLElement,  units: 'us'})
      ],
      overlays: [
        this.pointerTooltip = new Overlay({
          element: document.getElementById('pointer-popup')!,
          positioning: 'bottom-center',
          stopEvent: false,
        })
      ],
      target: this.host.nativeElement.firstElementChild,
      view: new View({
        center: fromLonLat([-74.1723667, 40.735657]),
        constrainRotation: undefined,
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
    this.instance.on('pointermove', (e) => {
      if (this.isCanvasCondition(e) === false || e.dragging || this.drawInteraction?.getActive()) {
        this.pointerTooltip.setPosition(undefined);
        this.pointerPopupElement!.innerHTML = '';
        return;
      }
      const hit = this.instance.hasFeatureAtPixel(e.pixel);
      this.pointerTooltip.setPosition(hit ? e.coordinate : undefined);
      if (!hit) this.pointerPopupElement!.innerHTML = '';
      if (this.selectHover.getActive() && this.selectHover.getFeatures().getLength() > 0) {
        const feat = this.selectHover.getFeatures().item(0);
        if (this.selectHover.getLayer(feat)) this.pointerPopupElement!.replaceChildren(
          generateAttrTable(this.selectHover.getLayer(feat).getClassName(), feat.getId() as string)
        );
      }
    });
    this.http.get<Array<LayerDetailObj>>('assets/data/layer-details.json')
      .subscribe({
        next: r => this.instance.setLayers(
          r.map(l => makeLayer(l.lyrGroup, l.lyrName, l.lyrType, l.lyrZIndex, l.initVisible, l.srcUrl, l.srcAttribution, l.styleDetail))
        ),
        complete: () => console.info('Layers Loaded')
    });
    // this.instance.on(['pointermove','singleclick'], (e: any) => this.handleMapAction(e));
    this.instance.getInteractions().on(['add','remove'], (e: any) => {
      if (e.element instanceof Draw) {
        this.drawInteraction = e.type === 'add' ?  e.element : undefined;
      }
    });
    this.instance.updateSize();
  }
  ngAfterViewInit(): void { setTimeout(() => { this.instance.updateSize(); }, 500); }
}
