import { pointerMove, touchOnly } from 'ol/events/condition';
import Pointer from 'ol/interaction/Pointer';
import { SelectEvent } from 'ol/interaction/Select';
import MapBrowserEvent from 'ol/MapBrowserEvent';
import Overlay from 'ol/Overlay';
import Select from 'ol/interaction/Select';

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
    const overlayEl = document.createElement('div');
    overlayEl.id = opts.tooltipId || 'pointer-tooltip';
    super.element = overlayEl;
    this.set('name', this.name);
    this.set('tooltipId', opts.tooltipId || 'pointer-tooltip');
    this.pointerInt = new Pointer({handleMoveEvent: this.handlePointerMove.bind(this)});
    this.selectInt = new Select({
      condition: (e) => {
        const checkCanvas = (e.originalEvent.target.tagName === 'CANVAS' || e.originalEvent.target.className === 'ol-overlay-container ol-selectable');
        const checkSetting = (e.map.get('AllowSelectHover') !== false);
        const checkMWheel = !(e.originalEvent.button === 1 || e.originalEvent.which === 2 || e.originalEvent.buttons === 4);

        return pointerMove(e) && checkCanvas && checkSetting && checkMWheel && !touchOnly(e);
      },
      filter: (f,l) => !['click-selection','geolocation'].includes(l.getClassName()),
      hitTolerance: 5,
      style: null
    });
    this.selectInt.on('select', this.handleSelect.bind(this));
    const observer = new MutationObserver((mutations, obs) => {
      if (document.querySelector('.ol-overlaycontainer-stopevent')) {
        this.getMap()!.addInteraction(this.pointerInt);
        this.getMap()!.addInteraction(this.selectInt);
        console.info('Added Feat Hover Overlay and Interactions to Map');
        obs.disconnect();
        obs.takeRecords();
        return;
      }
    });
    observer.observe(document, {
      childList: true,
      subtree: true
    });
  }
  private handlePointerMove(e: MapBrowserEvent<any>): void {
    if (touchOnly(e)) return;
    const checkCanvas = (e.originalEvent.target.tagName === 'CANVAS' || e.originalEvent.target.className === 'ol-overlay-container ol-selectable');
    const checkSetting = (e.map.get('AllowSelectHover') !== false);
    const isOK = checkSetting && checkCanvas && !e.dragging;
    const hasFeat = isOK && e.map.hasFeatureAtPixel(e.pixel,{layerFilter: l => !['click-selection','geolocation'].includes(l.getClassName())});
    e.map.getTargetElement().style.cursor = hasFeat ? 'pointer' : 'initial';
    e.map.getOverlayById('pointer-tooltip').setPosition(hasFeat ? e.coordinate : undefined);
  }
  private handleSelect(e: SelectEvent): void {
    const pointerTooltipEl = this.element;
    if (e.selected.length === 0) {
      pointerTooltipEl.innerHTML === '';
      e.mapBrowserEvent.map.getOverlayById('pointer-tooltip').setPosition(undefined);
    } else if (e.selected[0] !== e.deselected[0]) {
      const lyr = this.selectInt.getLayer(e.selected[0]);
      const keyProp = lyr ? lyr.get('styleDetails').opts.keyProp : '';
      pointerTooltipEl.replaceChildren(
        this.createElementWith('table', {
          class: 'map-table basic',
          innerHTML: `<tr><th>${this.makeTitleCase(lyr.getClassName(),'-')}</th></tr><tr><td>${(e.selected[0].getId()||e.selected[0].get(keyProp)) as string}</td></tr>`
        })
      );
    }
  }
  private makeTitleCase(str: string, separator ? : string): string {
    return str.split(separator || ' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  }
  private createElementWith<HTMLType extends keyof HTMLElementTagNameMap>(
    elementType: HTMLType,
    setAttributes: { [key: string]: any }
    ): HTMLElementTagNameMap[HTMLType] {
    const newElement = document.createElement(elementType);
    Object.entries(setAttributes).forEach(i => {
        if (i[0] === 'children') {
            newElement.append(...i[1]);
        } else if (i[0] === 'innerHTML') {
            newElement.innerHTML = i[1];
        } else if (typeof i[1] === 'string' || i[0].startsWith('data')) {
            newElement.setAttribute(i[0], String(i[1]));
        } else {
            Object.assign(newElement, Object.fromEntries([i]));
        };
    });

    return newElement as HTMLElementTagNameMap[HTMLType];
  }
}
