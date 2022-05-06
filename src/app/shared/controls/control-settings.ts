import Control from 'ol/control/Control';
import { MapModal } from '../classes/map-modal.class';
import { InitSettings, SettingsOptions } from '../models';
import { createElementWith, createFormField } from '../utils/fns-utility';

export class Settings extends Control {
  name = 'settings';
  layersPaneActive = false;
  baseSettings: SettingsOptions = {
    'AllowSelectHover': { type: 'checkbox', options: [{label: 'Allow Hover Select Interaction', value: true}], fn: (e) => this.toggleSetting(e, 'AllowSelectHover')  },
    'AllowFeatureClickModal': { type: 'checkbox', options: [{label: 'Allow Click Select Interaction', value: true}], fn: (e) => this.toggleSetting(e, 'AllowFeatureClickModal')  },
    'ShowCursorCoords': { type: 'checkbox', options: [{label: 'Show Cursor Coordinates', value: false}], fn: (e) => this.toggleSetting(e, 'ShowCursorCoords') },
    'OtherAction': { type: 'button', outerLabel: 'Generate Temporary Toast Message', options: [{label: 'Make Toast'}], fn: this.makeToast.bind(this) },
    'Modal Button': { type: 'button', outerLabel: 'Generate Modal Element', options: [{label: 'Make Modal'}], fn: this.makeModal.bind(this) }
  };
  constructor(
    opts: {
      targetId?: string,
      initSettings?: SettingsOptions
    }) {
    super({element: document.createElement('div')});
    this.set('name', this.name);
    if (opts.initSettings) Object.assign(this.baseSettings, opts.initSettings);
    this.element.className = 'pane-section-container '+this.name;
    const settingEls = Object.entries(this.baseSettings).map(s => createFormField(
      s[1].type,
      false,
      s[1].options,
      s[1].type === 'checkbox' ? undefined : {label: s[1].outerLabel, group: 'set_'+s[0].replace(' ', ''), addClass: undefined},
      s[1].fn ? {type: 'click', fn: s[1].fn} : undefined
    ));
    settingEls.forEach(s => this.element.appendChild(s));
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
