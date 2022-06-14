import { Object as OLObj } from 'ol';
import Control from 'ol/control/Control';
import { MapModal } from '../classes/map-modal.class';
import { MapToast } from '../classes/map-toast.class';
import { InitSettings, SettingsOptions } from '../models';
import { createFormField } from '../utils/fns-utility';

export class Settings extends Control {
  readonly name = 'settings';
  readonly icon = 'gear-fill';
  layersPaneActive = false;
  settingsObj: OLObj = new OLObj();
  baseSettings: SettingsOptions = {
    'AllowSelectHover': { type: 'checkbox', options: [{label: 'Allow Hover Select Interaction', value: true}], fn: (e) => this.toggleSetting(e, 'AllowSelectHover')  },
    'AllowFeatureClickModal': { type: 'checkbox', options: [{label: 'Allow Click Select Interaction', value: true}], fn: (e) => this.toggleSetting(e, 'AllowFeatureClickModal')  },
    'ShowCursorCoords': { type: 'checkbox', options: [{label: 'Show Cursor Coordinates', value: false}], fn: (e) => this.toggleSetting(e, 'ShowCursorCoords') },
    'OtherAction': { type: 'button', outerLabel: 'Generate Temporary Toast Message', options: [{label: 'Make Toast'}], fn: this.makeToast.bind(this) },
    'Modal Button': { type: 'button', outerLabel: 'Generate Modal Element', options: [{label: 'Make Modal'}], fn: this.makeModal.bind(this) }
  };
  constructor(
    opts?: {targetId?: string; initSettings?: SettingsOptions;}) {
    super({element: document.createElement('div')});
    this.set('name', this.name);
    this.set('icon', this.icon);
    if (opts?.initSettings) Object.assign(this.baseSettings, opts.initSettings);
    this.element.className = 'pane-section-container '+this.name;
    const settingEls = Object.entries(this.baseSettings).map(s => createFormField(
      s[1].type,
      false,
      s[1].options,
      s[1].type === 'checkbox' ? undefined : {label: s[1].outerLabel, group: 'set_'+s[0].replace(' ', ''), addClass: undefined},
      s[1].fn ? {type: 'click', fn: s[1].fn} : undefined
    ));
    settingEls.forEach(s => this.element.appendChild(s));
    const ctrlList = document.createElement('ol');
    const makeLI = (name: string, obj: any) => {
      const li = document.createElement('li');
      li.innerHTML = name;
      li.onclick = (e) => {
        if (obj.get('name') !== 'settings') (obj.element as HTMLElement).style.visibility = (obj.element as HTMLElement).style.visibility === 'hidden' ? 'visible' : 'hidden';
      };
      ctrlList.appendChild(li);
    };
    const observer = new MutationObserver((mutations, obs) => {
      if (document.querySelector('.ol-overlaycontainer-stopevent')) {
        this.settingsObj = this.getMap()!.get('settings');
        this.settingsObj.on('change', s => console.info(s));
        this.getMap()!.getControls().forEach(
          c => c.get('name') ? makeLI(c.get('name'), c) : null
        );
        this.element.appendChild(ctrlList);
        obs.disconnect();
        obs.takeRecords();
        return;
      }
    });
    observer.observe(document, {
      childList: true,
      subtree: true
    });
  }
  toggleSetting(e: any, prop: string, newVal = 'toggle'): void {
    const map = this.getMap();
    const settings: OLObj = map ? map.get('settings') : undefined;
    if (map) {
      settings.set(prop, !settings.get(prop), false);
      settings.changed();
      console.info(`Settings: "${prop}" set to ${settings.get(prop)}`);
    }
  }
  makeToast(e: any) {
    const _toast = new MapToast();
    _toast.make({tone: 'info', header: 'This is a toast message!', timer: 'short'});
  }
  makeModal(e: any) {
    new MapModal({type: 'feature', header: 'Example Feature Modal', subheader: 'Layer Name', description: 'Descriptions of features, with data etc.'});
  }
}
