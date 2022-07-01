import { MapBrowserEvent, Object as OLObj, Overlay } from 'ol';
import { pointerMove, touchOnly } from 'ol/events/condition';
import { Pointer, Select } from 'ol/interaction';
import { SelectEvent } from 'ol/interaction/Select';

export class FeatureTooltip extends Overlay {
  name = 'feature-tooltip';
  pointerInt: Pointer;
  selectInt: Select;

  constructor(opts: {tooltipId?: string;}) {
    super({
      positioning: 'top-left',
      offset: [15,25],
      stopEvent: true,
      id: 'pointer-tooltip'
    });
    super.element = Object.assign(document.createElement('div'), {id: opts.tooltipId || 'pointer-tooltip'});
    this.set('name', this.name);
    this.set('tooltipId', opts.tooltipId || 'pointer-tooltip');
    this.pointerInt = new Pointer({handleMoveEvent: this.handlePointerMove.bind(this)});
    this.selectInt = new Select({
      condition: (e) => {
        const checkCanvas = (e.originalEvent.target.tagName === 'CANVAS' || e.originalEvent.target.className === 'ol-overlay-container ol-selectable');
        const checkSetting = (e.map.get('settings') as OLObj).get('AllowSelectHover') !== false;
        const checkMWheel = !(e.originalEvent.button === 1 || e.originalEvent.which === 2 || e.originalEvent.buttons === 4);

        return pointerMove(e) && checkCanvas && checkSetting && checkMWheel && !touchOnly(e);
      },
      filter: (f,l) => l && !['click-selection','geolocation','measure-layer'].includes(l.getClassName()),
      hitTolerance: 5,
      style: null
    });
    this.selectInt.on('select', this.handleSelect.bind(this));
    const observer = new MutationObserver((m, o) => {
      if (document.querySelector('.ol-overlaycontainer-stopevent')) {
        this.getMap()!.addInteraction(this.pointerInt);
        this.getMap()!.addInteraction(this.selectInt);
        console.info('Added Feat Hover Overlay and Interactions to Map');
        o.disconnect();
        o.takeRecords();
        return;
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }

  private handlePointerMove(e: MapBrowserEvent<any>): void {
    if (touchOnly(e)) return;
    const checkCanvas = (e.originalEvent.target.tagName === 'CANVAS' || e.originalEvent.target.className === 'ol-overlay-container ol-selectable');
    const checkSetting = ((e.map.get('settings') as OLObj).get('AllowSelectHover') !== false);
    const isOK = checkSetting && checkCanvas && !e.dragging;
    const hasFeat = isOK && e.map.hasFeatureAtPixel(e.pixel,{layerFilter: l => !['click-selection','geolocation'].includes(l.getClassName())});
    e.map.getTargetElement().style.cursor = hasFeat ? 'pointer' : 'initial';
    e.map.getOverlayById('pointer-tooltip').setPosition(hasFeat ? e.coordinate : undefined);
  }

  private handleSelect(e: SelectEvent): void {
    const toTitle = (str: string): string => str.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    const pointerTooltipEl = this.element;
    if (e.selected.length === 0) {
      pointerTooltipEl.innerHTML === '';
      e.mapBrowserEvent.map.getOverlayById('pointer-tooltip').setPosition(undefined);
    } else if (e.selected[0] !== e.deselected[0]) {
      const lyr = this.selectInt.getLayer(e.selected[0]);
      const keyProp = lyr ? lyr.get('styleDetails').opts.keyProp : '';
      pointerTooltipEl.replaceChildren(
        Object.assign(document.createElement('table'), {
          className: 'map-table basic',
          innerHTML: `<tr><th>${toTitle(lyr.getClassName())}</th></tr><tr><td>${String(e.selected[0].getId() || e.selected[0].get(keyProp))}</td></tr>`
        })
      );
    }
  }
}
