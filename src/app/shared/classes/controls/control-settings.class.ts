import Control from 'ol/control/Control';
import { MapModal } from '../elements/map-modal.class';
import { InitSettings, SettingsOptions } from '../../models';
import { createElementWith, createFormField } from '../../utils/fns-utility';

export class Settings extends Control {
  name = 'settings';
  settingsDiv: HTMLElement;
  layersPaneActive = false;
  baseSettings: SettingsOptions = {
    'AllowSelectHover': { type: 'checkbox', options: [{label: 'Allow Hover Select Interaction', value: true}], fn: (e) => this.toggleSetting(e, 'AllowSelectHover')  },
    'AllowSelectClick': { type: 'checkbox', options: [{label: 'Allow Click Select Interaction', value: true}], fn: (e) => this.toggleSetting(e, 'AllowSelectClick')  },
    'ShowCursorCoords': { type: 'checkbox', options: [{label: 'Show Cursor Coordinates', value: false}], fn: (e) => this.toggleSetting(e, 'ShowCursorCoords') },
    'OtherAction': { type: 'button', outerLabel: 'Generate Temporary Toast Message', options: [{label: 'Make Toast'}], fn: this.makeToast.bind(this) },
    'Modal Button': { type: 'button', outerLabel: 'Generate Modal Element', options: [{label: 'Make Modal'}], fn: this.makeModal.bind(this) }
  };
  constructor(
    options: {
      parentContainer: HTMLElement,
      initSettings?: SettingsOptions
    }) {
    super({element: options.parentContainer});
    this.set('name', this.name);
    if (options.initSettings) Object.assign(this.baseSettings, options.initSettings);
    const settingEls = Object.entries(this.baseSettings).map(s => createFormField(
      s[1].type,
      false,
      s[1].options,
      s[1].type === 'checkbox' ? undefined : {label: s[1].outerLabel, group: 'set_'+s[0].replace(' ', ''), addClass: undefined},
      s[1].fn
    ));
    this.settingsDiv = createElementWith(false, 'div', {
      class: 'pane-section-container '+this.name,
      children: settingEls
    });
    this.element.appendChild(this.settingsDiv);
  }
  toggleSetting<S extends keyof InitSettings>(e: any, prop: S): void {
    const map = this.getMap();
    const propVal = map ? map.get(prop) : undefined;
    if (map) map.set(prop, !propVal);
    console.info(`Settings: "${prop}" set to ${!propVal}`);
  }
  makeToast(e: any) {
    console.info('make toast');
  }
  makeModal(e: any) {
    console.info('make modal');
    new MapModal({type: 'feature', header: 'Example Feature Modal', subheader: 'Layer Name', description: 'Descriptions of features, with data etc.'});
  }
}
