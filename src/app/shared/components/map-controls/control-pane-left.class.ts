import { Map } from 'ol';
import { Control } from 'ol/control';
import { BSIconOptions } from '../../utils/constants';
import { createElementWith, generatePointSVG } from '../../utils/fns-utility';

export class LeftPane extends Control {
  toggleBtn: HTMLElement;
  paneElement: HTMLElement;
  toggleStatus = false;
  toggleIcons = (paneOpen: boolean):BSIconOptions => paneOpen ? 'arrow-left-square-fill' : 'list';
  paneSectionsElement: HTMLElement;
  activeSectionsControls: Array<string> = ['layersmanager','settings'];
  constructor(
    options: {
      paneName: string,
      toggleBtnContainer: HTMLElement,
      paneElement: HTMLElement,
      toggleStatus?: boolean
    }) {
    super({
      element: options.toggleBtnContainer
    });
    // set up toggle button
    this.paneElement = options.paneElement;
    this.toggleStatus = options.toggleStatus ? options.toggleStatus : false;
    this.toggleBtn = createElementWith(false, 'button', {
      title: 'Toggle ' + options.paneName,
      class: `control-button ${options.paneName.toLowerCase()}-toggle`,
      innerHTML: generatePointSVG(this.toggleIcons(this.toggleStatus)).outerHTML
    });
    this.toggleBtn.addEventListener(
      'click',
      this.handleToggle.bind(this),
      false
    );
    this.element.appendChild(this.toggleBtn);

    this.paneSectionsElement = createElementWith(false, 'form', {
      id: 'pane-sections',
      onchange: (e: any) => {
        this.paneSectionsElement.parentElement!.querySelectorAll('.pane-section-container').forEach(i => {
          i.classList.contains(e.target.value) ? i.classList.add('active') : i.classList.remove('active')
        });
        document.getElementById('pane-section-title')!.innerText = e.target.value;
      }
    });
    this.paneElement.prepend(this.paneSectionsElement);
    setTimeout(this.intializePane.bind(this), 1000, this.getMap());
  }
  intializePane(map?: Map) {
    if (map) {
      this.activeSectionsControls = map.getControls().getArray().map(c => c.constructor.name.toLowerCase()).filter(n => ['layersmanager','settings'].includes(n.toLowerCase()));
      this.paneSectionsElement.innerHTML = this.setUpPaneSections(this.activeSectionsControls);
    } else {
      setTimeout(this.intializePane.bind(this), 1000, this.getMap());
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
  public setUpPaneSections(paneSections: Array<string>): string {
    let paneSectionsHTML = '';
    const sectionRadioInput = (section: string) => createElementWith(false, 'input', {
      type: 'radio',
      name: 'sections',
      class: 'pane-section-radio',
      id: 'pane-radio-' + section,
      value: section
    });
    const sectionRadioLabel = (section: string) => createElementWith(false, 'label', {
      class: 'pane-section-label',
      for: 'pane-radio-' + section,
      innerHTML: generatePointSVG(section === 'settings' ? 'settings' : 'layers').outerHTML
    });
    paneSections.forEach(s => paneSectionsHTML += `<div class="pane-section">${sectionRadioInput(s).outerHTML + sectionRadioLabel(s).outerHTML}</div>`);

    return paneSectionsHTML;
  }
}
