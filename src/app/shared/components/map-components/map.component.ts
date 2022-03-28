import {
  Component,
  OnInit,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  AfterViewInit,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import Map from 'ol/Map';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import MapEvent from 'ol/MapEvent';
import ObjectEvent from 'ol/Object';
import RenderEvent from 'ol/render/Event';
import { Control } from 'ol/control';
import { Interaction } from 'ol/interaction';

@Component({
  selector: 'map-base',
  template: `
    <div [style.width]="width" [style.height]="height"></div>
    <ng-content></ng-content>
  `,
})
export class MapBaseComponent implements OnInit, AfterViewInit, OnChanges {
  public instance: Map = new Map({});
  public componentType = 'map';
  public window: Window;

  @Input() width = '100%';
  @Input() height = '100%';
  @Input() pixelRatio: number;
  @Input() keyboardEventTarget: HTMLElement | Document | string | undefined;
  @Input() loadTilesWhileAnimating = true;
  @Input() loadTilesWhileInteracting = true;
  @Input() logo: string | boolean = false;
  @Input() renderer: 'canvas' | 'webgl' = 'canvas';

  @Output() mapClick: EventEmitter<MapBrowserEvent<any>>;
  @Output() mapDblClick: EventEmitter<MapBrowserEvent<any>>;
  @Output() moveStart: EventEmitter<MapEvent>;
  @Output() moveEnd: EventEmitter<MapEvent>;
  @Output() pointerDrag: EventEmitter<MapBrowserEvent<any>>;
  @Output() pointerMove: EventEmitter<MapBrowserEvent<any>>;
  @Output() onPostRender: EventEmitter<RenderEvent>;
  @Output() postRender: EventEmitter<MapEvent>;
  @Output() onPreCompose: EventEmitter<RenderEvent>;
  @Output() propertyChange: EventEmitter<ObjectEvent>;
  @Output() singleClick: EventEmitter<MapBrowserEvent<any>>;

  // we pass empty arrays to not get default controls/interactions because we have our own directives
  controls: Control[] = [];
  interactions: Interaction[] = [];

  constructor(private host: ElementRef) {
    this.window = window;
    this.pixelRatio = window.devicePixelRatio;
    this.mapClick = new EventEmitter<MapBrowserEvent<any>>();
    this.mapDblClick = new EventEmitter<MapBrowserEvent<any>>();
    this.moveStart = new EventEmitter<MapEvent>();
    this.moveEnd = new EventEmitter<MapEvent>();
    this.pointerDrag = new EventEmitter<MapBrowserEvent<any>>();
    this.pointerMove = new EventEmitter<MapBrowserEvent<any>>();
    this.onPostRender = new EventEmitter<RenderEvent>();
    this.postRender = new EventEmitter<MapEvent>();
    this.onPreCompose = new EventEmitter<RenderEvent>();
    this.propertyChange = new EventEmitter<ObjectEvent>();
    this.singleClick = new EventEmitter<MapBrowserEvent<any>>();
  }

  ngOnInit(): void {
    // console.log('creating ol.Map instance with:', this);
    this.instance = new Map(this);
    this.instance.setTarget(this.host.nativeElement.firstElementChild);
    this.instance.on('click', (event: MapBrowserEvent<any>) => this.mapClick.emit(event));
    this.instance.on('dblclick', (event: MapBrowserEvent<any>) => this.mapDblClick.emit(event));
    this.instance.on('movestart', (event: MapEvent) => this.moveStart.emit(event));
    this.instance.on('moveend', (event: MapEvent) => this.moveEnd.emit(event));
    this.instance.on('pointerdrag', (event: MapBrowserEvent<any>) => this.pointerDrag.emit(event));
    this.instance.on('pointermove', (event: MapBrowserEvent<any>) => this.pointerMove.emit(event));
    this.instance.on('postrender', (event: RenderEvent) => this.onPostRender.emit(event));
    this.instance.on('postrender', (event: MapEvent) => this.postRender.emit(event));
    this.instance.on('precompose', (event: RenderEvent) => this.onPreCompose.emit(event));
    this.instance.on('propertychange', (event: ObjectEvent | any) => this.propertyChange.emit(event));
    this.instance.on('singleclick', (event: MapBrowserEvent<any>) => this.singleClick.emit(event));
  }

  ngOnChanges(changes: SimpleChanges): void {
    const properties: { [index: string]: any } = {};
    if (!this.instance) {
      return;
    }
    for (const key in changes) {
      if (changes.hasOwnProperty(key)) {
        properties[key] = changes[key].currentValue;
      }
    }
    // console.log('changes detected in map-view, setting new properties: ', properties);
    this.instance.setProperties(properties, false);
  }

  ngAfterViewInit(): void {
    this.instance.updateSize();
  }
}
