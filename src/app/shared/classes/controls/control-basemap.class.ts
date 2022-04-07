import { Control } from 'ol/control';
import tippy from 'tippy.js';
import TileLayer from 'ol/layer/Tile';
import { XYZ } from 'ol/source';
import { createElementWith, generatePointSVG } from '../../utils/fns-utility';

export class BasemapToggle extends Control {
  name = 'basemap-toggle';
  basemapType: 'Streets' | 'Satellite';
  dropdownContent: HTMLElement;
  tippyDropdown: any;
  basemapDetails = {
    'Satellite': {
      // lyrs param {y queries for sattelite hybrid, s queries for just sattelite, r queries for standard Maps}
      url: 'https://mt{1-3}.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}',
      attribution: '<span>Imagery ©2020 Bluesky, Maxar Technologies, Sanborn, USDA Farm Service Agency, <a href="https://www.google.com/permissions/geoguidelines/attr-guide/">Google Streets & Satellite 2020</a></span>'
    },
    'Streets': {
      url: 'https://{a-d}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
      attribution: '<span><a href="http://www.openstreetmap.org/copyright">© OpenStreetMap</a> contributors, <a href="https://carto.com/attribution">© CARTO</a></span>'
    }
  };
  constructor(
    options: {
      parentContainer: HTMLElement,
      defaultBasemap?: 'Streets' | 'Satellite'
    }) {
    super({
      element: options.parentContainer
    });
    this.set('name', this.name);
    this.basemapType = options.defaultBasemap || 'Streets';
    const ctrlBtn = createElementWith(false, 'button', {
      title: 'Set Basemap',
      class: 'webmap-btn ctrl basemap-toggle',
      'aria-label': 'Map Icon, Use to Change Basemap Type',
      innerHTML: generatePointSVG('map-fill').outerHTML
    });
    ctrlBtn.addEventListener(
      'click',
      this.handleClick.bind(this),
      false
    );
    this.element.appendChild(ctrlBtn);
    this.dropdownContent = this.makeDropdown();
    this.tippyDropdown = tippy(ctrlBtn,
      {
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
        onShow() {
          ctrlBtn.classList.add('dropdown-open','no-interaction');
        },
        onHide() {
          ctrlBtn.classList.remove('dropdown-open','no-interaction');
        }
      }
    );
  }
  handleClick(event: MouseEvent): void {
    event.preventDefault();
  }
  changeBasemap(type: 'Streets' | 'Satellite'): void {
    const basemapLyr = this.getMap()!.getAllLayers().filter(l => l.getClassName() === 'basemap')[0];
    this.tippyDropdown.hide();
    if (basemapLyr) {
      (basemapLyr as TileLayer<XYZ>).getSource().setUrl(this.basemapDetails[type].url);
      (basemapLyr as TileLayer<XYZ>).getSource().setAttributions(this.basemapDetails[type].attribution);
      console.info('Basemap layer set to '+ type);
    }
  }
  makeDropdown(): HTMLElement {
    return createElementWith(false, 'div', {
      class: 'tippy-dropdown-div',
      children: ['Streets','Satellite'].map((el,i,a) => createElementWith(false, 'button', {
          type: 'button',
          title: `Set Basemap to ${el}`,
          innerHTML: el,
          onclick: (e: any) => this.changeBasemap(el as 'Streets' | 'Satellite')
        }))
    });
  }
}
