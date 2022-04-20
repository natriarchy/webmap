import Control from 'ol/control/Control';
import BaseLayer from 'ol/layer/Base';
import { compareValues, createElementWith, createFormField, generatePointSVG, generateTable, makeTitleCase } from '../../utils/fns-utility';

export class LayersManager extends Control {
  name = 'layersmanager';
  paneSectionContainer: HTMLElement;
  layersManagerList: HTMLElement;
  layersPaneActive = false;
  layerGroups: Set<string> = new Set();
  constructor(
    options: {
      parentContainer: HTMLElement
    }) {
    super({element: options.parentContainer});
    this.set('name', this.name);
    this.paneSectionContainer = createElementWith(false, 'div', {class: 'pane-section-container '+this.name});
    this.element.appendChild(this.paneSectionContainer);
    this.layersManagerList = createElementWith(false, 'div', {class: 'layersmanager-list'});
    setTimeout(this.intializeLayers.bind(this),1000, this.getMap());
  }
  intializeLayers(map: any): void {
    if (map) {
      this.generateLayers();
      this.paneSectionContainer.appendChild(this.layersManagerList);
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
        group: 'lm-group-filter',
        addClass: 'lm-group-filter full-width'
      }).outerHTML;
      const sortControl = createFormField('radio', true, [{label: 'name'},{label: 'group'},{label: 'visible'}], {
          label: `<span class="webmap-btn no-interaction">${generatePointSVG('sort-alpha-down').outerHTML}</span>`,
          group: 'lm-sort-controller',
          addClass: 'lm-sort-controller hide-input'
      }).outerHTML;
      const controlForm = createElementWith(false, 'form', {
        class: 'layersmanager-control',
        onchange: (e: InputEvent) => {
          const targetEl = e.target as HTMLElement;
          if (targetEl.id === 'lm-group-filter') {
            const groupFilterVal = (targetEl as HTMLSelectElement).value;
            document.querySelectorAll('[data-layer-group]')
              .forEach(e => (e as HTMLElement).className = (groupFilterVal === '' || e.getAttribute('data-layer-group') === groupFilterVal) ? 'layersmanager-item' : 'layersmanager-item hidden');
          } else if ((targetEl as HTMLInputElement).name === 'lm-sort-controller') {
            const currentVal = ((e.currentTarget as HTMLFormElement).elements.namedItem('lm-sort-controller') as RadioNodeList).value;
            const valFixed = `data-layer-${currentVal === 'name' ? 'classname' : currentVal}`;
            const sortChildren = Array.from(this.layersManagerList.children).sort(
              (a,b) => compareValues(a.getAttribute(valFixed)!,b.getAttribute(valFixed)!,currentVal === 'visible' ? 'desc' : 'asc')
            );
            this.layersManagerList.replaceChildren(...sortChildren);
          }
        },
        innerHTML: filterControl + sortControl
      });
      this.paneSectionContainer.prepend(controlForm);
    }
  }
  makeLayerListItem(lyr: BaseLayer): HTMLElement {
    const lyrClass = lyr.getClassName();
    const lyrGroup = lyr.get('group') as string;
    const nameSpan = createElementWith(false, 'label', {
      class: 'layersmanager-item-label',
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
        const layersItem = document.querySelector(`.layersmanager-item[data-layer-classname=${lyrClass}]`)!;
        lyr.setVisible(!state);
        layersItem.setAttribute('data-layer-visible',state.toString());
        if (['VectorTileLayer','VectorLayer'].includes(lyr.get('olLyrType'))) {
          const legend = layersItem.querySelector('.layersmanager-legend')!;
          (legend as HTMLElement).style.display = state ? 'none' : 'flex';
          if (!state && !legend.hasChildNodes()) legend.appendChild(
              generateTable('legend', {featType: lyr.get('styleDetails')['featType'], classes: lyr.get('styleDetails')['classObject']})
          );
        }
      }
    });
    const infoBtn = createElementWith(false, "button", {
      class: 'layersmanager-item-info webmap-btn',
      type: 'button',
      title: lyrClass + ' More Info',
      innerHTML: generatePointSVG('info-circle-fill').outerHTML,
      onclick: (e: MouseEvent) => {
        alert(Object.entries(lyr.getProperties()));
      }
    });
    const legendDiv = createElementWith(false, "div", {
      class: 'layersmanager-legend',
      children: lyr.getVisible() && ['VectorTileLayer','VectorLayer'].includes(lyr.get('olLyrType')) ? [
        generateTable('legend', {featType: lyr.get('styleDetails')['featType'], classes: lyr.get('styleDetails')['classObject']})
      ] : []
    });
    return createElementWith(false, "div", {
      'data-layer-classname': lyrClass,
      'data-layer-group': lyrGroup,
      'data-layer-visible': String(lyr.getVisible()),
      class: 'layersmanager-item',
      children: [visibilityInput,nameSpan,infoBtn,legendDiv]
    });
  }
}
