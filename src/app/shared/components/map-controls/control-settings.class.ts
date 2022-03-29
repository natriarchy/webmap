import Control from 'ol/control/Control';
import { createElementWith } from '../../utils/fns-utility';

export class Settings extends Control {
  name = 'settings';
  settingsDiv: HTMLElement;
  layersPaneActive = false;
  constructor(
    options: {
      parentContainer: HTMLElement
    }) {
    super({
      element: options.parentContainer
    });
    this.set('name', this.name);
    this.settingsDiv = createElementWith(false, 'div', {class: 'pane-section-container '+this.name});
    this.element.appendChild(this.settingsDiv);
  }
  handleClick(event: any): void {
    console.info(event);
  }
  handleChange(event: any): void {
    console.info(event);
  }
}
