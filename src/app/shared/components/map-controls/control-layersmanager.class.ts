import Control from 'ol/control/Control';
import BaseLayer from 'ol/layer/Base';
import { createElementWith, makeTitleCase } from '../../utils/fns-utility';

export class LayersManager extends Control {
  name = 'layersmanager';
  layerListDiv: HTMLDivElement;
  layersPaneActive = false;
  constructor(
    options: {
      parentContainer: HTMLElement
    }) {
    super({
      element: options.parentContainer
    });
    this.layerListDiv = createElementWith(false, 'div', {class: 'pane-section-container '+this.name});
    setTimeout(() => {
      if (this.getMap()) {
        this.generateLayers();
        this.element.appendChild(this.layerListDiv);
      } else {
        setTimeout(() => {
          this.generateLayers();
          this.element.appendChild(this.layerListDiv);
        },1500);
      }
    },1000);
  }
  handleClick(event: MouseEvent): void {
    console.log(event);
  }
  generateLayers(): void {
    this.getMap()!.getAllLayers().forEach((l,i,a) => {
      const layerListItem = this.makeLayerListItem(l);
      if (i > 0) {
        this.layerListDiv.appendChild(document.createElement('hr'));
      }
      this.layerListDiv.appendChild(layerListItem);
    });
  }
  makeLayerListItem(lyr: BaseLayer): HTMLElement {
    const lyrClass = lyr.getClassName();
    const lyrGroup = lyr.get('group') as string;
    const layerItem = createElementWith(false, "div", {
      'data-layer-classname': lyrClass,
      'data-layer-group': lyrGroup,
      'data-layer-visible': String(lyr.getVisible()),
      class: 'layersmanager-item'
    });
    const nameSpan = createElementWith(false, "span", {
      innerHTML: makeTitleCase(lyrClass, '-')
    });
    const visibilityInput = createElementWith(false, "input", {
      class: lyrClass,
      type: 'checkbox',
      id: lyrClass + '_visible',
      name: lyrClass,
      value: lyr.getVisible(),
      checked: lyr.getVisible(),
      onclick: (e: MouseEvent) => {
        lyr.setVisible(!lyr.getVisible());
        layerItem.setAttribute("data-layer-visible", String(lyr.getVisible()));
      }
    });
    layerItem.appendChild(visibilityInput);
    layerItem.appendChild(nameSpan);

    return layerItem;
  }
}
