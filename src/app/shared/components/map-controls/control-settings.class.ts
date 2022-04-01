import Control from 'ol/control/Control';
import { SettingsOptions, SettingsOptionsMaster } from '../../models';
import { generateToast } from '../../utils/fns-toast';
import { createElementWith } from '../../utils/fns-utility';

export class Settings extends Control {
  name = 'settings';
  settingsDiv: HTMLElement;
  layersPaneActive = false;
  baseSettings: SettingsOptionsMaster = {
    'Allow Hover': { type: 'boolean', label: 'Allow Hover Interaction', initValue: true, fn: this.toggleHover.bind(this)  },
    'Show Coordinates': { type: 'boolean', label: 'Show Coordinates of Cursor at Bottom of Page', initValue: false, fn: this.toggleCoords.bind(this) },
    'Toast Button': { type: 'action', label: 'Click to Generate a Temporary Toast Message', fn: this.toggleHover.bind(this) }
  };
  constructor(
    options: {
      parentContainer: HTMLElement,
      initSettings?: SettingsOptions<false>
    }) {
    super({element: options.parentContainer});
    this.set('name', this.name);
    if (options.initSettings) Object.assign(this.baseSettings, options.initSettings);

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
  toggleHover(): void {}
  toggleCoords(): void {}
}
