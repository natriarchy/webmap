import Control from 'ol/control/Control';
import BaseLayer from 'ol/layer/Base';
import { compareValues, createElementWith, createFormField, generatePointSVG, makeTitleCase } from '../../utils/fns-utility';

export class LayersManager extends Control {
  name = 'layersmanager';
  paneSectionContainer: HTMLDivElement;
  layersManagerList: HTMLDivElement;
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
  handleClick(event: MouseEvent): void {
    console.log(event);
  }
  generateLayers(): void {
    this.getMap()!.getAllLayers().forEach((l,i,a) => {
      const layerListItem = this.makeLayerListItem(l);
      this.layerGroups.add(l.get('group'));
      this.layersManagerList.appendChild(layerListItem);
    });
    if (this.layerGroups.size > 0) {
      const layergrpOptions = Array.from(this.layerGroups).map(lg => `<option value="${lg}">${lg}</option>`).sort().join('');
      const filterControl = `
      <div class="input-field-group full-width">
        <label class="webmap-btn no-interaction" for="layersmanager-group-filter">${generatePointSVG('funnel-fill').outerHTML}</label>
        <select id="layersmanager-group-filter">
          <option value="">--Show All Layers--</option>
          ${layergrpOptions}
        </select>
      </div>
      `;
      const sortControl = `<span class="webmap-btn no-interaction">${generatePointSVG('sort-alpha-down').outerHTML}</span>
        ` + ['name', 'group', 'visible'].map(f => createFormField('radio','',f,f,'sort-controller').outerHTML).join('');
      const controlForm = createElementWith(false, 'form', {
        class: 'layersmanager-control',
        onchange: (e: InputEvent) => {
          const targetEl = e.target as HTMLElement;
          if (targetEl.id === 'layersmanager-group-filter') {
            const groupFilterVal = (targetEl as HTMLSelectElement).value;
            document.querySelectorAll('[data-layer-group]')
              .forEach(e => (e as HTMLElement).className = (groupFilterVal === '' || e.getAttribute('data-layer-group') === groupFilterVal) ? 'layersmanager-item' : 'layersmanager-item hidden');
          } else if ((targetEl as HTMLInputElement).name === 'sort-controller') {
            const currentVal = ((e.currentTarget as HTMLFormElement).elements.namedItem('sort-controller') as RadioNodeList).value;
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
      value: lyr.getVisible(),
      checked: lyr.getVisible(),
      onclick: (e: MouseEvent) => {
        lyr.setVisible(!lyr.getVisible());
        document.querySelector(`.layersmanager-item[data-layer-classname=${lyrClass}`)?.setAttribute('data-layer-visible',lyr.getVisible().toString());
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
    return createElementWith(false, "div", {
      'data-layer-classname': lyrClass,
      'data-layer-group': lyrGroup,
      'data-layer-visible': String(lyr.getVisible()),
      class: 'layersmanager-item',
      children: [visibilityInput,nameSpan,infoBtn]
    });
    // const legendDetails = createElementWith(false, 'details', {
    //   class: 'layersmanager-item-legend',
    //   innerHTML: '<summary>See Legend</summary><p>' + JSON.stringify(lyr.get('styleDetails')) + '</p>',
    //   // ontoggle: (e: MouseEvent) => {
    //   //   legendDetails.replaceChild()
    //   // }
    // });
  }
}
