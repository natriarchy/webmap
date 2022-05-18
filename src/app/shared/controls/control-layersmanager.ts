import Control from 'ol/control/Control';
import BaseLayer from 'ol/layer/Base';
import { compare, createElementWith, createFormField, generatePointSVG, generateTable, makeTitleCase } from '../utils/fns-utility';

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
    const observer = new MutationObserver((mutations, obs) => {
      const lyrsDiv_ = document.querySelector('.ol-layers');
      if (lyrsDiv_ && lyrsDiv_.children.length > 1) {
        this.generateLayers();
        obs.disconnect();
        obs.takeRecords();
        return;
      }
    });
    observer.observe(document, { childList: true, subtree: true });
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
      const layerGrpsArray = [
        {label: '--Show All Layers--', value: ''},
        {label: '--Visible Layers--', value: 'true'}
      ].concat(
        Array.from(this.layerGroups).sort().map(lg => ({label: lg, value: lg}))
      );
      const filterControl = createFormField('select', false, layerGrpsArray, {
        label: `<span class="webmap-btn no-interaction">${generatePointSVG('funnel-fill', false).outerHTML}</span>`,
        group: 'lyrs-group-filter',
        addClass: 'lyrs-group-filter full-width'
      });
      const sortControl = createFormField('radio', true, [{label: 'name'},{label: 'group'},{label: 'visible'}], {
        label: `<span class="webmap-btn no-interaction">${generatePointSVG('sort-alpha-down', false).outerHTML}</span>`,
        group: 'lyrs-sort-controller',
        addClass: 'lyrs-sort-controller hide-input'
      });
      const controlForm = createElementWith(false, 'form', {
        class: 'lyrs-control',
        onchange: (e: InputEvent) => {
          const targetEl = e.target as HTMLElement;
          const actionType = targetEl.getAttribute('name') ?? targetEl.id;
          const currentVal = actionType === 'lyrs-sort-controller'
            ? ((e.currentTarget as HTMLFormElement).elements.namedItem('lyrs-sort-controller') as RadioNodeList).value
            : (targetEl as HTMLSelectElement).value;
          console.info(`actionType: ${actionType}, currentVal: ${currentVal}`);
          if (actionType === 'lyrs-group-filter') {
            const filterAttr = ['','true'].includes(currentVal) ? 'data-visible' : 'data-group';
            document.querySelectorAll(`[${filterAttr}]`)
              .forEach(e => e.className = (currentVal === '' || e.getAttribute(filterAttr) === currentVal) ? 'lyrs-item' : 'lyrs-item hidden');
          } else if (actionType === 'lyrs-sort-controller') {
            const valFixed = `data-${currentVal === 'name' ? 'class' : currentVal}`;
            const sortChildren = Array.from(this.layersManagerList.children).sort(
              (a,b) => compare(a.getAttribute(valFixed)!, b.getAttribute(valFixed)!, currentVal !== 'visible')
            );
            this.layersManagerList.replaceChildren(...sortChildren);
          }
        },
        children: [filterControl, sortControl]
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
        const layersItem = document.querySelector(`.lyrs-item[data-class="${lyrClass}"]`)!;
        lyr.setVisible(!state);
        layersItem.setAttribute('data-visible',String(!state));
        if (['VectorTileLayer','VectorLayer'].includes(lyr.get('lyrType'))) {
          const legend = layersItem.querySelector('.lyrs-legend')!;
          (legend as HTMLElement).style.display = state ? 'none' : 'flex';
          if (!state && !legend.hasChildNodes()) {
            const styling = lyr.get('styleDetails');
            legend.appendChild(
              generateTable('legend', {
                styleType: styling['styleType'],
                featType: styling['featType'],
                classes: Object.assign({base: styling['opts']['base']},styling['opts']['classes'] || {})
              })
            );
          }
        }
      }
    });
    const infoBtn = createElementWith(false, "button", {
      class: 'lyrs-item-info webmap-btn',
      type: 'button',
      title: lyrClass + ' More Info',
      innerHTML: generatePointSVG('info-circle-fill', false).outerHTML,
      onclick: (e: MouseEvent) => {
        alert(Object.entries(lyr.getProperties()));
      }
    });
    const legendDiv = createElementWith(false, "div", {
      class: 'lyrs-legend',
      children: lyr.getVisible() && ['VectorTileLayer','VectorLayer'].includes(lyr.get('lyrType'))
        ? [generateTable('legend', {
          styleType: lyr.get('styleDetails')['styleType'],
          featType: lyr.get('styleDetails')['featType'],
          classes: Object.assign({base: lyr.get('styleDetails')['opts']['base']},lyr.get('styleDetails')['opts']['classes'] || {})
          })]
        : []
    });
    return createElementWith(false, "div", {
      'data-class': lyrClass,
      'data-group': lyrGroup,
      'data-visible': String(lyr.getVisible()),
      class: 'lyrs-item',
      children: [visibilityInput,nameSpan,infoBtn,legendDiv]
    });
  }
}
