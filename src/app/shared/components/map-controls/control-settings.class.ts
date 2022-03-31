import Control from 'ol/control/Control';
import { generateToast } from '../../utils/fns-toast';
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
    const toastbtn1 = createElementWith(false, 'button', {
      innerHTML: 'Toaster',
      onclick: (e: MouseEvent) => {
        generateToast('action',"here's a dumb toast, fuck off",undefined,'long');
      }
    });
    const toastbtn2 = createElementWith(false, 'button', {
      innerHTML: 'Toaster',
      onclick: (e: MouseEvent) => {
        generateToast('info',"here's a dumb toast, fuck off",undefined,'long');
      }
    });
    const toastbtn3 = createElementWith(false, 'button', {
      innerHTML: 'Toaster',
      onclick: (e: MouseEvent) => {
        generateToast('warning',"here's a dumb toast, fuck off",undefined,'short');
      }
    });
    this.settingsDiv = createElementWith(false, 'div', {
      class: 'pane-section-container '+this.name,
      children: [toastbtn1,toastbtn2,toastbtn3]
    });
    this.element.appendChild(this.settingsDiv);
  }
  handleClick(event: any): void {
    console.info(event);
  }
  handleChange(event: any): void {
    console.info(event);
  }
}
