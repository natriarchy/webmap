import OLObj from 'ol/Object';
import { singleClick } from 'ol/events/condition';
import Feature from 'ol/Feature';
import Select from 'ol/interaction/Select';
import { SelectEvent } from 'ol/interaction/Select';
import { Layer, Vector as VectorLayer, VectorTile as VectorTileLayer } from 'ol/layer';
import { Stroke, Style } from 'ol/style';

export class FeatClickModal extends Select {
  activeModalEl: HTMLElement | undefined;
  constructor(opts: {selectLyrClass?: string, lyrTypeProp?: string}) {
    super({
      condition: (e) => {
        const checkCanvas = (e.originalEvent.target.tagName === 'CANVAS' || e.originalEvent.target.className === 'ol-overlay-container ol-selectable');
        const checkSetting = ((e.map.get('settings') as OLObj).get('AllowFeatureClickModal') !== false);

        return singleClick(e) && checkCanvas && checkSetting;
      },
      filter: (f,l) => ![(this.get('selectLyrClass') || 'click-selection'),'geolocation'].includes(l.getClassName()),
      hitTolerance: 10,
      style: null
    });
    this.set('selectLyrClass', opts.selectLyrClass || 'click-selection');
    this.set('lyrTypeProp', opts.lyrTypeProp || 'olLyrType');
    this.on('select', this.handleSelection.bind(this));
  }

  handleSelection(e: SelectEvent): void {
    const map = this.getMap();
    this.detroyModal();
    let selectionLayer = map.getAllLayers().find(l => l.getClassName() === (this.get('selectLyrClass') || 'click-selection'))!;
    if (selectionLayer) map.removeLayer(selectionLayer);
    if (e.selected.length > 0) {
      const currentLayer = this.getLayer(e.selected[0]);
      const keyProp = currentLayer.get('styleDetails').opts.keyProp;
      this.activeModalEl = this.makeModal(String(e.selected[0].getId() || e.selected[0].get(keyProp)), currentLayer.getClassName(), e.selected[0].getProperties());
      selectionLayer = this.handleSelectionLyr(e.selected[0], currentLayer);
      map.addLayer(selectionLayer);
    }
  }

  makeModal(featId: string, featLayer: string, attributes: object): HTMLElement {
    this.detroyModal();
    const actionBtn = this.newEl('button', {
      type: 'button',
      class: 'webmap-btn',
      title: 'Zoom to Feature',
      innerHTML: '<span class="bi bi-zoom-in"></span>',
      onclick: (e: MouseEvent) => this.featAction('zoom')
    });
    const closeBtn = this.newEl('button', {
      type: 'button',
      class: 'modal-close webmap-btn',
      innerHTML: '<span class="bi bi-x"></span>',
      onclick: (e: any) => this.detroyModal()
    });
    const newModalEl = this.newEl('section', {
      id: 'modal-element',
      class: '--feature',
      innerHTML: `
        <div class="modal-container">
          <div class="modal-header">
            <div class="modal-title">
              <h3>${featId}</h3>
              <h4>${featLayer}</h4>
            </div>
          </div>
          <div class="modal-body">${this.makeTable(attributes)}</div>
          <div class="modal-actions"></div>
        </div>
      `
    });
    newModalEl.querySelector('.modal-header')?.append(closeBtn);
    newModalEl.querySelector('.modal-actions')?.append(actionBtn);

    document.querySelector('div.ol-overlaycontainer-stopevent')!.append(newModalEl);

    return newModalEl;
  }

  featAction(type: 'zoom' | 'outline'): void {
    if (type === 'zoom' && this.getFeatures().item(0)?.getGeometry()) this.getMap().getView().fit(this.getFeatures().item(0).getGeometry(),{maxZoom: 10});
  }

  detroyModal(): void {
    if (document.getElementById('modal-element')) document.getElementById('modal-element')!.remove();
    this.activeModalEl = undefined;
  }

  private handleSelectionLyr(selectedFeat: Feature<any>, selectedLayer: Layer<any, any>): Layer<any, any> {
    const selectionStyle = (f: any) => f.getId() === selectedFeat.getId() ? new Style({stroke: new Stroke({color: 'rgba(0,255,255,0.7)', width: 4})}) : undefined;
    if (selectedLayer.get('lyrType') === 'VectorTileLayer') {
      return new VectorTileLayer({className: 'click-selection', renderMode: 'vector', source: selectedLayer.getSource(), style: selectionStyle, zIndex: 10});
    } else {
      return new VectorLayer({className: 'click-selection', source: selectedLayer.getSource(), style: selectionStyle, zIndex: 10});
    }
  }

  private makeTable(attributes: { [key: string]: any }): string {
    const tableRows = Object.entries(attributes)
      .filter(a => !['geometry', '_symbol', 'layer'].includes(a[0]))
      .map(e => `<tr><td class='prop'>${e[0]}</td><td class='val'>${e[1]}</td></tr>`);
    return this.newEl('table', {
      class: 'map-table attribute',
      innerHTML: '<tr><th>Property</th><th>Value</th></tr>' + tableRows.join('')
    }).outerHTML;
  }

  private newEl<HTMLType extends keyof HTMLElementTagNameMap>(
    tag: HTMLType,
    props: { [key: string]: any }
  ): HTMLElementTagNameMap[HTMLType] {
    const _newEl = document.createElement(tag);
    Object.entries(props).forEach(a => {
      if (a[0] === 'children') {
        _newEl.append(...a[1]);
      } else if (['checked','className','htmlFor','id','innerHTML','name','onclick','onchange','title','type'].includes(a[0])) {
        Object.assign(_newEl, Object.fromEntries([a]));
      } else {
        _newEl.setAttribute(a[0], a[1]);
      }
    });

    return _newEl;
  }
}
