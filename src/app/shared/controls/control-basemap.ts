import OLObj from 'ol/Object';
import Control from 'ol/control/Control';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import tippy from 'tippy.js';
import { Setting } from '../models';
import { MapModal } from '../classes/map-modal.class';

interface BasemapInfo {
  name: string;
  url: string;
  attribution: string;
  active?: boolean;
}

export class BasemapToggle extends Control {
  readonly name = 'basemap-toggle';
  readonly icons = {
    ctrl: 'map-fill'
  };
  _ctrlBtn: HTMLElement;
  _dropdownEl: HTMLElement;
  _tippy: any;
  basemaps: Array<BasemapInfo>;
  constructor(opts: {sources: Array<BasemapInfo>; targetId?: string;}) {
    super({element: document.createElement('div')});
    this.set('name', this.name);
    this.basemaps = opts.sources;

    this._ctrlBtn = document.createElement('button');
    this._ctrlBtn.title = 'Set Basemap';
    this._ctrlBtn.setAttribute('type', 'button');
    this._ctrlBtn.innerHTML = `<span class="bi bi-${this.icons.ctrl}"></span>`;
    this._ctrlBtn.onclick = e => e.preventDefault();

    this.element.className = 'ol-unselectable ol-custom-control';
    this.element.appendChild(this._ctrlBtn);

    this._dropdownEl = document.createElement('div');
    this._dropdownEl.className = 'tippy-dropdown-div';
    const init = this.basemaps.find(s => s.active)?.name || this.basemaps[0].name;
    this._dropdownEl.append(...this.basemaps.map(
      (el,i,a) => this.makeListBtn(el.name, el.active || el.name === init)
    ));

    this._tippy = tippy(this._ctrlBtn, {
        content: this._dropdownEl,
        appendTo: this.element,
        interactive: true,
        allowHTML: true,
        arrow: false,
        offset: [0, 7],
        placement: "right-start",
        animation: "shift-toward-extreme",
        theme: "map-light",
        trigger: "click focus",
        onShow(e) {
          e.reference.classList.add('dropdown-open','no-interaction');
        },
        onHide(e) {
          e.reference.classList.remove('dropdown-open','no-interaction');
        }
      }
    );
    const observer = new MutationObserver((m, o) => {
      if (document.querySelector('.ol-overlaycontainer-stopevent')) {
        const map = this.getMap()!;
        const settings: OLObj = map.get('settings');
        const settingObj: Setting<'button'> = {
          type: 'button',
          label: 'Add Basemap Layer',
          actions: {label: this._ctrlBtn.innerHTML},
          fnOpts: {type: 'click', fn: (e) => {
            new MapModal({type: 'dialog', header: 'Add Basemap Layer', subheader: 'Fill Out the Form', content: [
              { id: 'basemap-name', type: 'text', label: 'Name', options: {value: ''} },
              { id: 'basemap-url', type: 'text', label: 'URL', options: {value: 'https://'} },
              { id: 'basemap-attr', type: 'text', label: 'Attributions', options: {value: ''} },
              { id: 'basemap-active', type: 'checkbox', label: 'Make Active Basemap?', options: {value: true} }
            ]})
          }}
        };
        settings.set(this.name, settingObj);
        settings.changed();
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
  changeBasemap(btn: HTMLElement): void {
    const map = this.getMap()!;
    const basemap = btn.getAttribute('data-name');
    const basemapLyr = map.getAllLayers().filter(l => l.getClassName() === 'basemap')[0];
    const basemapSrc = this.basemaps.find(s => s.name === basemap)!;
    this._tippy.hide();
    if (basemapLyr && basemapSrc) {
      (basemapLyr as TileLayer<XYZ>).getSource().setUrl(basemapSrc.url);
      (basemapLyr as TileLayer<XYZ>).getSource().setAttributions(basemapSrc.attribution);
      console.info('Basemap layer set to '+ basemap);
      document.querySelectorAll('.basemap-option').forEach(
        b => b.setAttribute('data-active', String(b.getAttribute('data-name') === basemap))
      );
      this.basemaps.forEach(b => b.active = b === basemapSrc);
      const settings: OLObj = map.get('settings');
      settings.set('basemaps', {prop: this.basemaps, action: this.addBasemap.bind(this)});
      settings.changed();
    }
  }

  addBasemap(opts: BasemapInfo): void {
    if (this.basemaps.find(b => b.name === opts.name) === undefined) {
      this.basemaps.push(Object.assign(opts, {active: true}));
      this.basemaps.sort((a,b) => Number(a.name > b.name));
      const newBtn = this.makeListBtn(opts.name, true);
      const sortChildren = Array.from(this._dropdownEl.children);
      sortChildren.push(newBtn);
      sortChildren.sort(
        (a,b) => Number(a.getAttribute('data-name')! > b.getAttribute('data-name')! || -1)
      );
      this._dropdownEl.replaceChildren(...sortChildren);
      this.changeBasemap(newBtn);
    }
  }

  private makeListBtn(name: string, active = false): HTMLElement {
    const title = name.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    const _btn = document.createElement('button');
    _btn.className = 'basemap-option';
    _btn.innerHTML = title;
    _btn.onclick = (e: any) => this.changeBasemap(e.target);
    Object.entries({
      'type': 'button',
      'title': `Set Basemap to ${title}`,
      'data-active': String(active || false),
      'data-name': name
    }).forEach(e => _btn.setAttribute(e[0], e[1]));
    return _btn;
  };
}
