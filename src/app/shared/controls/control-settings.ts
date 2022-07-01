import OLObj from 'ol/Object';
import Control from 'ol/control/Control';
import { Setting, SettingsOptions } from '../models';

export class Settings extends Control {
  readonly name = 'settings';
  readonly icon = 'gear-fill';
  layersPaneActive = false;
  settingsObj: OLObj = new OLObj();
  baseSettings: SettingsOptions = {
    'AllowSelectHover': { type: 'checkbox', label: 'Allow Hover Select Interaction', actions: { value: true }, fnOpts: {type: 'change', fn: (e) => this.toggleSetting(e, 'AllowSelectHover')}},
    'AllowFeatureClickModal': { type: 'checkbox', label: 'Allow Click Select Interaction', actions: {value: true}, fnOpts: {type: 'change', fn: (e) => this.toggleSetting(e, 'AllowFeatureClickModal')}},
    'ShowCursorCoords': { type: 'checkbox', label: 'Show Cursor Coordinates', actions: {value: false}, fnOpts: {type: 'change', fn: (e) => this.toggleSetting(e, 'ShowCursorCoords')}},
    'OtherAction': { type: 'button', label: 'Generate Temporary Toast Message', actions: {label: 'Make Toast'}, fnOpts: {type: 'click', fn: this.makeToast.bind(this) }},
    'Modal Button': { type: 'button', label: 'Generate Modal Element', actions: {label: 'Make Modal'}, fnOpts: {type: 'click', fn: this.makeModal.bind(this)}}
  };
  constructor(
    opts?: {targetId?: string; initSettings?: SettingsOptions;}) {
    super({element: document.createElement('div')});
    this.set('name', this.name);
    this.set('icon', this.icon);
    if (opts?.initSettings) Object.assign(this.baseSettings, opts.initSettings);
    this.element.className = 'pane-section-container '+this.name;
    const settingEls = Object.entries(this.baseSettings).map(s => this.makeSetting(
      s[0],
      s[1]
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
    const updateSettings = (obj: OLObj, init = false) => Object.entries(obj.getProperties()).forEach(e => {
      const settingKeys = init ? Object.keys(this.baseSettings) : this.settingsObj.getKeys();
      if (!settingKeys.includes(e[0])) {
        this.element.appendChild(this.makeSetting(e[0], e[1]));
      }
    });
    const observer = new MutationObserver((m, o) => {
      if (document.querySelector('.ol-overlaycontainer-stopevent')) {
        this.settingsObj = this.getMap()!.get('settings');
        updateSettings(this.settingsObj, true);
        console.info(this.settingsObj);
        this.settingsObj.on('change', s => {
          updateSettings(s.target as OLObj);
          this.settingsObj = s.target as OLObj;
        });
        this.getMap()!.getControls().forEach(
          c => c.get('name') ? makeLI(c.get('name'), c) : null
        );
        this.element.appendChild(ctrlList);
        o.disconnect();
        o.takeRecords();
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
    const _toast = this.getMap()!.get('toast-ctrl');
    _toast.launch({tone: 'info', header: 'This is a toast message!'});
  }
  makeModal(e: any) {
    const _modalCtrl = this.getMap()!.get('modal-ctrl');
    _modalCtrl.launch({type: 'feature', header: 'Example Feature Modal', subheader: 'Layer Name', description: 'Descriptions of features, with data etc.'});
  }
  makeSetting(id: string, opts: Setting<'button'> | Setting<'checkbox'> | Setting<'radio'> | Setting<'select'>): HTMLElement {
    const fixStr = (str: string | undefined) => str ? str.replace(/(_|\s|\&)/gi, '-').toLowerCase() : undefined;
    const elID = `${fixStr(id)}-${opts.type}`;
    let actionEls: Array<HTMLElement>;
    if (opts.type === 'select') {
      actionEls = [this.newEl('select', {id: elID, innerHTML: opts.actions.map(iv => `<option value="${iv.value}">${iv.label}</option>`).join('')})];
    } else if (Array.isArray(opts.actions)) {
      actionEls = opts.actions.map(a => this.newEl('input', {
        type: opts.type,
        value: a.value || a.label,
        onclick: opts.fnOpts.type === 'click' ? opts.fnOpts.fn : undefined,
        onchange: opts.fnOpts.type === 'change' ? opts.fnOpts.fn : undefined,
        ...(opts.type === 'radio' && {name: fixStr(elID)+'-grp', checked: a.value || false})
      }));
    } else {
      actionEls = [this.newEl(opts.type === 'button' ? 'button' : 'input', {
        type: opts.type,
        id:  elID,
        title: opts.label,
        innerHTML: opts.type === 'button' ? opts.actions.label : undefined,
        onclick: opts.fnOpts.type === 'click' ? opts.fnOpts.fn : undefined,
        onchange: opts.fnOpts.type === 'change' ? opts.fnOpts.fn : undefined,
        ...(opts.type === 'checkbox' && {checked: opts.actions.value || false})
      })];
    };
    return this.newEl('div', { class: 'input-field-group', children: [ this.newEl('label', {for: elID, innerHTML: opts.label }), ...actionEls ] });
  }
  private newEl<HTMLType extends keyof HTMLElementTagNameMap>(tag: HTMLType, props: { [key: string]: any }): HTMLElementTagNameMap[HTMLType] {
    const _newEl = document.createElement(tag);
    Object.entries(props).forEach(e => {
      if (e[0] === 'children') {
        _newEl.append(...e[1])
      } else if (['checked','className','htmlFor','id','innerHTML','name','onclick','onchange','title','type'].includes(e[0])) {
        Object.assign(_newEl, Object.fromEntries([e]));
      } else {
        _newEl.setAttribute(e[0], e[1]);
      }
    });
    return _newEl;
  }
}
