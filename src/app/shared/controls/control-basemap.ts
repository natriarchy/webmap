import OLObj from 'ol/Object';
import Control from 'ol/control/Control';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import tippy from 'tippy.js';
import { Setting } from '../models';

interface BasemapInfo {
  name: string;
  url: string;
  attr: string;
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
    super({element: Object.assign(document.createElement('div'),{className: 'ol-unselectable ol-custom-control'})});
    this.set('name', this.name);
    this.basemaps = opts.sources;

    this._ctrlBtn = Object.assign(document.createElement('button'), {
      title: 'Set Basemap',
      type: 'button',
      innerHTML: `<span class="bi bi-${this.icons.ctrl}"></span>`,
      onclick: (e: MouseEvent) => e.preventDefault()
    });

    this.element.appendChild(this._ctrlBtn);

    this._dropdownEl = Object.assign(document.createElement('div'), {className: 'tippy-dropdown'});
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
          e.reference.classList.add('--dropdown','--no-int');
        },
        onHide(e) {
          e.reference.classList.remove('--dropdown','--no-int');
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
            const _modalCtrl = this.getMap()!.get('modal-ctrl');
            _modalCtrl.launch({
              type: 'dialog',
              header: 'Add Basemap Layer',
              subheader: 'Fill Out the Form',
              content: [
                { id: 'basemap-name', type: 'text', label: 'Name', options: {value: ''} },
                { id: 'basemap-url', type: 'text', label: 'URL', options: {value: 'https://'} },
                { id: 'basemap-attr', type: 'text', label: 'Attributions', options: {value: ''} },
                { id: 'basemap-active', type: 'checkbox', label: 'Make Active Basemap?', options: {value: true} }
              ],
              actions: [{
                label: 'Submit <span class="bi bi-submit"></span>',
                title: 'Submit',
                action: (e: MouseEvent, el: HTMLElement) => {
                  const form = el.querySelector('form') as HTMLFormElement;
                  const getEl = (id: string) => form.elements.namedItem(id) ? form.elements.namedItem(id) as HTMLInputElement : undefined;
                  const results: [string?,string?,string?,boolean?] = [
                    getEl('basemap-name')?.value,
                    getEl('basemap-url')?.value,
                    getEl('basemap-attr')?.value,
                    getEl('basemap-active')?.checked
                  ];
                  if (!results.includes(undefined)) this.addBasemap({name: results[0]!, url: results[1]!, attr: results[2]!, active: results[3] });
                }
              }]
            });
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
      (basemapLyr as TileLayer<XYZ>).getSource().setAttributions(basemapSrc.attr);
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
    const _btn = Object.assign(document.createElement('button'), {
      className: 'basemap-option',
      type: 'button',
      title: `Set Basemap to ${title}`,
      innerHTML: title,
      onclick: (e: any) => this.changeBasemap(e.target)
    });
    _btn.setAttribute('data-active', String(active || false));
    _btn.setAttribute('data-name', name);

    return _btn;
  };
}
