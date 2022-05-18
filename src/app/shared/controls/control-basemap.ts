import { Control } from 'ol/control';
import tippy from 'tippy.js';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import { createElementWith, generatePointSVG } from '../utils/fns-utility';

export class BasemapToggle extends Control {
  readonly name = 'basemap-toggle';
  button_: HTMLElement;
  activeBasemap: string;
  dropdownContent: HTMLElement;
  tippyDropdown: any;
  basemapDetails: Array<{name: string; url: string; attribution: string; default?: boolean;}>;
  constructor(opts: {
      sources: Array<{name: string; url: string; attribution: string; default?: boolean;}>,
      targetId?: string
    }) {
    super({element: document.createElement('div')});
    this.set('name', this.name);
    this.basemapDetails = opts.sources;
    this.activeBasemap = this.basemapDetails.find(s => s.default)?.name || this.basemapDetails[0].name;


    this.button_ = document.createElement('button');
    this.button_.title = 'Set Basemap';
    this.button_.setAttribute('type', 'button');
    this.button_.appendChild(generatePointSVG('map-fill', false));
    this.button_.onclick = this.handleClick.bind(this);

    this.element.className = 'ol-unselectable ol-custom-control';
    this.element.appendChild(this.button_);

    this.dropdownContent = this.makeDropdown();
    this.tippyDropdown = tippy(this.button_, {
        content: this.dropdownContent,
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
  }
  handleClick(event: MouseEvent): void {
    event.preventDefault();
  }
  changeBasemap(btn: HTMLElement): void {
    const type = btn.getAttribute('data-name');
    const basemapLyr = this.getMap()!.getAllLayers().filter(l => l.getClassName() === 'basemap')[0];
    const basemapSrc = this.basemapDetails.find(s => s.name === type);
    this.tippyDropdown.hide();
    if (basemapLyr && basemapSrc) {
      (basemapLyr as TileLayer<XYZ>).getSource().setUrl(basemapSrc.url);
      (basemapLyr as TileLayer<XYZ>).getSource().setAttributions(basemapSrc.attribution);
      console.info('Basemap layer set to '+ type);
      document.querySelectorAll('.basemap-option').forEach(
        b => b.setAttribute('data-active', String(b.getAttribute('data-name') === type))
      );
    }
  }
  makeDropdown(): HTMLElement {
    return createElementWith(false, 'div', {
      class: 'tippy-dropdown-div',
      children: this.basemapDetails.map((el,i,a) => createElementWith(false, 'button', {
          type: 'button',
          class: 'basemap-option',
          title: `Set Basemap to ${this.makeTitleCase(el.name)}`,
          innerHTML: this.makeTitleCase(el.name),
          'data-active': String(i===0),
          'data-name': el.name,
          onclick: (e: any) => this.changeBasemap(e.target)
        }))
    });
  }
  private makeTitleCase(str: string, separator?: string): string {
    return str.split(separator || ' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
  }
}
