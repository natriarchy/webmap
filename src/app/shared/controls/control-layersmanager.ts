import Control from 'ol/control/Control';
import BaseLayer from 'ol/layer/Base';
import { compareValues, createElementWith, createFormField, generatePointSVG, generateTable, makeTitleCase } from '../utils/fns-utility';

export class LayersManager extends Control {
  readonly name = 'layersmanager';
  layersManagerList: HTMLElement;
  layersPaneActive = false;
  layerGroups: Set<string> = new Set();
  constructor(opts: { targetId?: string }) {
    super({ element: document.createElement('div') });
    this.set('name', this.name);
    this.element.className = 'pane-section-container '+this.name;
    this.layersManagerList = document.createElement('div');
    this.layersManagerList.className = 'lyrs-list';
    this.element.appendChild(this.layersManagerList);
    setTimeout(this.intializeLayers.bind(this),1000, this.getMap());
  }
  intializeLayers(map: any): void {
    if (map) {
      this.generateLayers();
    } else {
      setTimeout(this.intializeLayers.bind(this), 1000, this.getMap());
    }
  }
  generateLayers(): void {
    this.getMap()!.getAllLayers()
      .filter((l,i,a) => !!l.get('group'))
      .forEach((l,i,a) => {
        const layerListItem = this.makeLayerListItem(l);
        this.layerGroups.add(l.get('group'));
        this.layersManagerList.appendChild(layerListItem);
      }
    );
    if (this.layerGroups.size > 0) {
      const layerGrpsArray = [{label: '--Show All Layers--', value: ''}].concat(
        Array.from(this.layerGroups).sort().map(lg => ({label: lg, value: lg}))
      );
      const filterControl = createFormField('select', false, layerGrpsArray, {
        label: `<span class="webmap-btn no-interaction">${generatePointSVG('funnel-fill').outerHTML}</span>`,
        group: 'lyrs-group-filter',
        addClass: 'lyrs-group-filter full-width'
      }).outerHTML;
      const sortControl = createFormField('radio', true, [{label: 'name'},{label: 'group'},{label: 'visible'}], {
          label: `<span class="webmap-btn no-interaction">${generatePointSVG('sort-alpha-down').outerHTML}</span>`,
          group: 'lyrs-sort-controller',
          addClass: 'lyrs-sort-controller hide-input'
      }).outerHTML;
      const controlForm = createElementWith(false, 'form', {
        class: 'lyrs-control',
        onchange: (e: InputEvent) => {
          const targetEl = e.target as HTMLElement;
          if (targetEl.id === 'lyrs-group-filter') {
            const groupFilterVal = (targetEl as HTMLSelectElement).value;
            document.querySelectorAll('[data-lyr-group]')
              .forEach(e => (e as HTMLElement).className = (groupFilterVal === '' || e.getAttribute('data-lyr-group') === groupFilterVal) ? 'lyrs-item' : 'lyrs-item hidden');
          } else if ((targetEl as HTMLInputElement).name === 'lyrs-sort-controller') {
            const currentVal = ((e.currentTarget as HTMLFormElement).elements.namedItem('lyrs-sort-controller') as RadioNodeList).value;
            const valFixed = `data-lyr-${currentVal === 'name' ? 'classname' : currentVal}`;
            const sortChildren = Array.from(this.layersManagerList.children).sort(
              (a,b) => compareValues(a.getAttribute(valFixed)!,b.getAttribute(valFixed)!,currentVal === 'visible' ? 'desc' : 'asc')
            );
            this.layersManagerList.replaceChildren(...sortChildren);
          }
        },
        innerHTML: filterControl + sortControl
      });
      this.element.prepend(controlForm);
    }
  }
  makeLayerListItem(lyr: BaseLayer): HTMLElement {
    const lyrClass = lyr.getClassName();
    const lyrGroup = lyr.get('group') as string;
    const nameSpan = createElementWith(false, 'label', {
      class: 'lyrs-item-label',
      for: lyrClass + '_visibility',
      innerHTML: `<span>${makeTitleCase(lyrClass, '-')}</span>${lyrGroup ? '<span class="group">'+lyrGroup+'</span>' : ''}`
    });
    const visibilityInput = createElementWith(false, "input", {
      class: lyrClass,
      type: 'checkbox',
      id: lyrClass + '_visibility',
      name: lyrClass,
      title: 'Toggle Layer',
      checked: lyr.getVisible(),
      onclick: (e: MouseEvent) => {
        const state = lyr.getVisible();
        const layersItem = document.querySelector(`.lyrs-item[data-lyr-class=${lyrClass}]`)!;
        lyr.setVisible(!state);
        layersItem.setAttribute('data-lyr-visible',state.toString());
        if (['VectorTileLayer','VectorLayer'].includes(lyr.get('olLyrType'))) {
          const legend = layersItem.querySelector('.lyrs-legend')!;
          (legend as HTMLElement).style.display = state ? 'none' : 'flex';
          if (!state && !legend.hasChildNodes()) legend.appendChild(
              generateTable('legend', {featType: lyr.get('styleDetails')['featType'], classes: lyr.get('styleDetails')['classObject']})
          );
        }
      }
    });
    const infoBtn = createElementWith(false, "button", {
      class: 'lyrs-item-info webmap-btn',
      type: 'button',
      title: lyrClass + ' More Info',
      innerHTML: generatePointSVG('info-circle-fill').outerHTML,
      onclick: (e: MouseEvent) => {
        alert(Object.entries(lyr.getProperties()));
      }
    });
    const legendDiv = createElementWith(false, "div", {
      class: 'lyrs-legend',
      children: lyr.getVisible() && ['VectorTileLayer','VectorLayer'].includes(lyr.get('olLyrType')) ? [
        generateTable('legend', {featType: lyr.get('styleDetails')['featType'], classes: lyr.get('styleDetails')['classObject']})
      ] : []
    });
    return createElementWith(false, "div", {
      'data-lyr-class': lyrClass,
      'data-lyr-group': lyrGroup,
      'data-lyr-visible': String(lyr.getVisible()),
      class: 'lyrs-item',
      children: [visibilityInput,nameSpan,infoBtn,legendDiv]
    });
  }
}
