import { Map } from 'ol';
import { Control } from 'ol/control';
import { BSIconOptions } from '../../utils/constants';
import { createElementWith, generatePointSVG } from '../../utils/fns-utility';

export class LeftPaneMulti extends Control {
  toggleBtn: HTMLElement;
  paneElement: HTMLElement;
  toggleStatus = false;
  toggleIcons = (paneOpen: boolean):BSIconOptions => paneOpen ? 'arrow-left-square-fill' : 'list';
  paneSections: HTMLElement;
  activeSectionsControls: Array<string> = ['layersmanager','settings'];
  constructor(
    options: {
      paneName: string,
      toggleBtnContainer: HTMLElement,
      paneElement: HTMLElement,
      toggleStatus?: boolean
    }) {
    super({ element: options.toggleBtnContainer });
    // set up toggle button
    this.paneElement = options.paneElement;
    this.toggleStatus = options.toggleStatus ? options.toggleStatus : false;
    this.toggleBtn = createElementWith(false, 'button', {
      title: 'Toggle ' + options.paneName,
      class: `webmap-btn ctrl ${options.paneName.toLowerCase()}-toggle`,
      innerHTML: generatePointSVG(this.toggleIcons(this.toggleStatus)).outerHTML,
      onclick: this.handleToggle.bind(this)
    });
    this.element.appendChild(this.toggleBtn);

    this.paneSections = createElementWith(false, 'form', {
      id: 'pane-sections',
      onchange: (e: any) => {
        this.paneSections.parentElement!.querySelectorAll('.pane-section-container').forEach(i => {
          i.classList.contains(e.target.value) ? i.classList.add('active') : i.classList.remove('active')
        });
        document.getElementById('pane-section-title')!.innerText = e.target.value;
      }
    });
    this.paneElement.prepend(this.paneSections);
    setTimeout(this.intializePane.bind(this), 500, this.getMap());
  }
  intializePane(map?: Map): void {
    if (map) {
      const activeControls = super.getMap()!
        .getControls()
        .getArray()
        .filter(n => n.hasOwnProperty('name') && ['layersmanager','settings'].includes(n.get('name') || ''))
        .map(c => c.get('name')!.toLowerCase());
      let paneSectionsHTML = '';
      const sectionRadioInput = (section: string) => createElementWith(false, 'input', {
        type: 'radio',
        name: 'sections',
        class: 'pane-section-radio',
        id: 'pane-radio-' + section,
        value: section
      });
      const sectionRadioLabel = (section: string) => createElementWith(false, 'label', {
        class: 'pane-section-label webmap-btn',
        for: 'pane-radio-' + section,
        innerHTML: section === 'layersmanager' ? generatePointSVG('layers').outerHTML : generatePointSVG(section as BSIconOptions).outerHTML
      });
      activeControls.forEach(s => paneSectionsHTML += `<div class="pane-section">${sectionRadioInput(s).outerHTML + sectionRadioLabel(s).outerHTML}</div>`);
      document.getElementById('pane-sections')!.innerHTML = paneSectionsHTML;
      (this.paneSections.querySelector('input') as HTMLInputElement).click();
    } else {
      setTimeout(this.intializePane.bind(this), 500, super.getMap());
    }
  }
  handleToggle(event: MouseEvent): void {
    event.preventDefault();
    this.paneElement.classList.toggle('pane-hidden');
    document.getElementById('controls-top-left')!.classList.toggle('pane-open');
    this.toggleStatus = !this.toggleStatus;
    this.set('toggleStatus', this.toggleStatus);
    this.toggleBtn.replaceChildren(generatePointSVG(this.toggleIcons(this.toggleStatus)));
  }
}
