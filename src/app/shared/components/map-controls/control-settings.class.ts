import Control from 'ol/control/Control';
import { Toaster } from '../../classes/toaster.class';
import { SettingsOptions, SettingsOptionsMaster } from '../../models';
import { createElementWith } from '../../utils/fns-utility';

export class Settings extends Control {
  name = 'settings';
  settingsDiv: HTMLElement;
  layersPaneActive = false;
  baseSettings: SettingsOptionsMaster = {
    'Allow Hover': { type: 'boolean', label: 'Allow Hover Interaction', initValue: true, fn: this.toggleHover.bind(this)  },
    'Show Coordinates': { type: 'boolean', label: 'Show Coordinates of Cursor at Bottom of Page', initValue: false, fn: this.toggleCoords.bind(this) },
    'Toast Button': { type: 'action', label: 'Click to Generate a Temporary Toast Message', fn: this.makeToast.bind(this) }
  };
  constructor(
    options: {
      parentContainer: HTMLElement,
      initSettings?: SettingsOptions<false>
    }) {
    super({element: options.parentContainer});
    this.set('name', this.name);
    if (options.initSettings) Object.assign(this.baseSettings, options.initSettings);
    const settingEls = Object.entries(this.baseSettings).map(s => createElementWith(false,'button', {
      type: 'button',
      title: s[1].label,
      innerHTML: s[0],
      onclick: s[1].fn
    }));
    this.settingsDiv = createElementWith(false, 'div', {
      class: 'pane-section-container '+this.name,
      children: settingEls
    });
    this.element.appendChild(this.settingsDiv);
  }
  handleClick(event: any): void {
    console.info(event);
  }
  handleChange(event: any): void {
    console.info(event);
  }
  toggleHover(e: any): void {
    console.info(e);
    console.info('toggle hover');
  }
  toggleCoords(e: any): void {
    console.info(e);
    console.info('toggle coords');
  }
  makeToast(e: any) {
    console.info('make toast');
  }
}
