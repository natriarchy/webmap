import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit } from '@angular/core';
import { Map, Overlay, View } from 'ol';
import { Attribution, ScaleLine } from 'ol/control';
import { pointerMove, singleClick, touchOnly } from 'ol/events/condition';
import { defaults, DragPan, Pointer, Select } from 'ol/interaction';
import { SelectEvent } from 'ol/interaction/Select';
import { fromLonLat } from 'ol/proj';
import * as MyControls from '../classes/controls';
import { MapModal } from '../classes/elements/map-modal.class';
import { LayerDetailObj } from '../models';
import { MapInfoService } from '../services';
import { checkSetting, isCanvas, isMWheel } from '../utils/conditions';
import { generateTable } from '../utils/fns-utility';
import { makeLayer } from '../utils/generate-layer';
import { handleSelectionLyr } from '../utils/generate-style';

@Component({
  selector: 'app-map-view',
  styleUrls: ['./map-view.component.scss'],
  templateUrl: './map-view.component.html'
})

export class MapViewComponent implements OnInit {
  instance: Map = new Map({});
  controlsTopLeftElement: HTMLElement | undefined;
  controlsToolbarElement: HTMLElement | undefined;
  controlsPaneLeftElement: HTMLElement | undefined;
  pointerPopupElement: HTMLElement | undefined;
  defaultExtent = fromLonLat([-74.2853199, 40.7910592]).concat(fromLonLat([-74.0617852, 40.6733126])) as [number, number, number, number];
  selectHover: Select = new Select();
  selectClick: Select = new Select();
  dragPan: DragPan = new DragPan();
  activeModalElement: MapModal | undefined;

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
      interactions: defaults({altShiftDragRotate: false, pinchRotate: false, shiftDragZoom: false})
        .extend([
            new Pointer({handleMoveEvent: this.handlePointerMove.bind(this)}),
          // allow mousewheel to pan map
            new DragPan({ condition: isMWheel }),
            this.selectHover = new Select({
              condition: (e) => pointerMove(e) && isCanvas(e) && !isMWheel(e) && checkSetting(e,'AllowSelectHover') && !touchOnly(e),
              hitTolerance: 10,
              style: null
            }),
            this.selectClick = new Select({
              condition: (e) => singleClick(e) && isCanvas(e) && checkSetting(e,'AllowSelectClick'),
              hitTolerance: 10,
              style: null
            })
          ]
        ),
      controls: [
        new Attribution({target: document.querySelector('footer .scale-bar')! as HTMLElement}),
        new MyControls.ZoomExtentGroup({parentContainer: this.controlsTopLeftElement!, defaultExtent: this.defaultExtent}),
        new MyControls.Geolocate({parentContainer: this.controlsTopLeftElement!}),
        new MyControls.Measure({parentContainer: this.controlsTopLeftElement!}),
        new MyControls.BasemapToggle({parentContainer: this.controlsTopLeftElement!}),
        new MyControls.LayersManager({parentContainer: this.controlsPaneLeftElement!}),
        new MyControls.Fullscreen({parentContainer: this.controlsTopLeftElement!}),
        new MyControls.LeftPaneMulti({paneName: 'Menu', toggleBtnContainer: document.getElementById('controls-top-toolbar')!, paneElement: this.controlsPaneLeftElement!}),
        new MyControls.Search({parentContainer: document.getElementById('controls-top-toolbar')!}),
        new MyControls.Settings({parentContainer: this.controlsPaneLeftElement!}),
        new ScaleLine({ target: document.querySelector('footer .scale-bar')! as HTMLElement,  units: 'us'})
      ],
      overlays: [
        new Overlay({
          element: document.getElementById('pointer-tooltip')!,
          positioning: 'bottom-center',
          stopEvent: false,
          id: 'pointer-tooltip'
        })
      ],
      target: this.host.nativeElement.firstElementChild,
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
    ['AllowSelectHover','AllowSelectClick'].forEach(s => this.instance.set(s, true));

    this.http.get<Array<LayerDetailObj>>('assets/data/layer-details.json')
      .subscribe({
        next: r => this.instance.setLayers(
          r.map(l => makeLayer(l.lyrGroup, l.lyrName, l.lyrType, l.lyrZIndex, l.initVisible, l.srcUrl, l.srcAttribution, l.srcDescription || '',l.styleDetail))
        ),
        complete: () => console.info('Layers Loaded')
    });
    this.selectHover.on('select', this.handleSelectHover.bind(this));
    this.selectClick.on('select', this.handleSelectClick.bind(this));

    setTimeout(() => {this.instance.updateSize();},1000);
  }

  handlePointerMove(e: any): void {
    if (touchOnly(e)) return;
    const isOK = checkSetting(e,'AllowSelectHover') && isCanvas(e) && !e.dragging;
    this.instance.getOverlayById('pointer-tooltip').setPosition((isOK && this.instance.hasFeatureAtPixel(e.pixel)) ? e.coordinate : undefined);
  }

  handleSelectHover(e: SelectEvent): void {
    const pointerTooltipEl = this.instance.getOverlayById('pointer-tooltip').getElement()!;
    if (e.selected.length === 0) {
      pointerTooltipEl.innerHTML === '';
    } else if (e.selected[0] !== e.deselected[0]) {
      pointerTooltipEl.replaceChildren(
        generateTable('basic', {
          header: this.selectHover.getLayer(e.selected[0]).getClassName(),
          subheader: e.selected[0].getId() as string
        })
      );
    }
  }

  handleSelectClick(e: SelectEvent): void {
    this.activeModalElement?.detroyModal();
    this.activeModalElement = undefined;
    let selectionLayer = this.instance.getAllLayers().find(l => l.getClassName() === 'click-selection');
    if (selectionLayer) this.instance.removeLayer(selectionLayer);
    if (e.selected.length > 0) {
      const currentLayer = this.selectClick.getLayer(e.selected[0]);
      this.activeModalElement = new MapModal({
        type: 'feature',
        header: String(e.selected[0].getId()),
        subheader: currentLayer.getClassName(),
        attrTable: e.selected[0].getProperties()
      });
      this.activeModalElement.addEventListener('zoomBtnClick', this.zoomToFeat.bind(this));
      selectionLayer = handleSelectionLyr(e.selected[0], currentLayer);
      this.instance.addLayer(selectionLayer);
    }
  }

  zoomToFeat(): void {
    if (this.selectClick.getFeatures().item(0)) this.instance.getView().fit(this.selectClick.getFeatures().item(0).getGeometry());
  }

  selectedFeatAction(type: 'zoom' | 'outline'): void {
    if (type === 'zoom' && this.selectClick.getFeatures().item(0)) this.instance.getView().fit(this.selectClick.getFeatures().item(0).getGeometry());

  }
}

