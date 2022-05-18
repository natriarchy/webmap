import { singleClick } from 'ol/events/condition';
import Feature from 'ol/Feature';
import Select from 'ol/interaction/Select';
import Layer from 'ol/layer/Layer';
import VectorLayer from 'ol/layer/Vector';
import VectorTileLayer from 'ol/layer/VectorTile';
import Stroke from 'ol/style/Stroke';
import Style from 'ol/style/Style';
import { SelectEvent } from 'ol/interaction/Select';

export class FeatClickModal extends Select {
  activeModalEl: HTMLElement | undefined;
  constructor(opts: {selectLyrClass?: string, lyrTypeProp?: string}) {
    super({
      condition: (e) => {
        const checkCanvas = (e.originalEvent.target.tagName === 'CANVAS' || e.originalEvent.target.className === 'ol-overlay-container ol-selectable');
        const checkSetting = (e.map.get('AllowFeatureClickModal') !== false);

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
    let selectionLayer = map.getAllLayers().find(l => l.getClassName() === (this.get('selectLyrClass') || 'click-selection'));
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
    const actionBtn = this.createElementWith('button', {
      type: 'button',
      class: 'webmap-btn',
      title: 'Zoom to Feature',
      innerHTML: this.createSVGIcon('zoom-in').outerHTML,
      onclick: (e: MouseEvent) => this.featAction('zoom')
    });
    const closeBtn = this.createElementWith('button', {
      type: 'button',
      class: 'modal-close webmap-btn',
      innerHTML: this.createSVGIcon('x').outerHTML,
      onclick: (e: any) => this.detroyModal()
    });
    const newModalEl = this.createElementWith('section', {
      id: 'modal-element',
      class: 'feature-detail',
      innerHTML: `
        <div class="modal-container">
          <div class="modal-header">
            <h3><span>${featId}</span><span>${featLayer}</span></h3>
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
    if (type === 'zoom' && this.getFeatures().item(0)) this.getMap().getView().fit(this.getFeatures().item(0).getGeometry(),{maxZoom: 10});
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
    return this.createElementWith('table', {
      class: 'map-table attribute',
      innerHTML: '<tr><th>Property</th><th>Value</th></tr>' + tableRows.join('')
    }).outerHTML;
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

  private createSVGIcon(shape: 'x'|'zoom-in'): SVGElement {
    const newElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const paths = {
      'x': '<path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>',
      'zoom-in': `
      <path fill-rule="evenodd" d="M6.5 12a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM13 6.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
      <path d="M10.344 11.742c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1 6.538 6.538 0 0 1-1.398 1.4z"/>
      <path fill-rule="evenodd" d="M6.5 3a.5.5 0 0 1 .5.5V6h2.5a.5.5 0 0 1 0 1H7v2.5a.5.5 0 0 1-1 0V7H3.5a.5.5 0 0 1 0-1H6V3.5a.5.5 0 0 1 .5-.5z"/>
      `
    };
    newElement.innerHTML = paths[shape];
    Object.entries({
      'xmlns': 'http://www.w3.org/2000/svg',
      'viewBox': '0 0 16 16',
      'height': '1em',
      'width': '1em',
      'fill': 'currentColor',
      'stroke': 'none'
    }).forEach(i => newElement.setAttribute(i[0], i[1]));

    return newElement;
  };
}
