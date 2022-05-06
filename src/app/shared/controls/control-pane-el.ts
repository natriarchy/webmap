import Control from "ol/control/Control";

export class ControlPaneEl extends Control {
  readonly name = 'ctrl-pane';
  toggle_: HTMLElement;
  paneSections_: HTMLElement;
  toggleStatus = false;
  constructor(opts: {
    position: 'left',
    toggleTargetId: string,
    toggleStatus?: boolean
  }) {
    super({element: document.createElement('section')})
    this.element.id = `controlpn-${opts.position}`;
    this.element.className = 'pane-hidden';

    // set up toggle button
    this.toggleStatus = opts.toggleStatus ? opts.toggleStatus : false;
    this.toggle_ = document.createElement('button');
    this.toggle_.title = `Toggle ${opts.position} Pane`;
    this.toggle_.appendChild(this.createSVGIcon(this.toggleStatus ? 'arrow-left-square-fill' : 'list'));
    this.toggle_.onclick = this.handleToggle.bind(this);
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'ol-unselectable ol-custom-control';
    toggleDiv.appendChild(this.toggle_);
    const observer = new MutationObserver((mutations, obs) => {
      const toggleTarget_ = document.getElementById(opts.toggleTargetId);
      if (toggleTarget_) {
        toggleTarget_.prepend(toggleDiv);
        obs.disconnect();
        return;
      }
    });
    observer.observe(document, {childList: true, subtree: true});

    const sectionTitle_ = document.createElement('h3');
    sectionTitle_.id = 'pane-section-title';
    this.element.appendChild(sectionTitle_);

    this.paneSections_ = document.createElement('form');
    this.paneSections_.id = 'pane-sections';
    this.paneSections_.onchange = (e: any) => {
        this.paneSections_.parentElement!.querySelectorAll('.pane-section-container').forEach(i => {
          i.classList.contains(e.target.value) ? i.classList.add('active') : i.classList.remove('active')
        });
        sectionTitle_.innerText = e.target.value;
    };

    this.element.prepend(this.paneSections_);
  }
  handleToggle(e: MouseEvent): void {
    e.preventDefault();
    this.element.classList.toggle('pane-hidden');
    document.getElementById('controltb-top-left')?.classList.toggle('pane-open');
    this.toggleStatus = !this.toggleStatus;
    this.set('toggleStatus', this.toggleStatus);
    this.toggle_.replaceChildren(this.createSVGIcon(this.toggleStatus ? 'arrow-left-square-fill' : 'list'));
  }
  with(controls: Array<Control>): Array<Control> {
    controls.forEach(c => c.setTarget(this.element));
    setTimeout(() => {
    let paneSectionsHTML = '';
    const sectionRadioInput = (section: string) => {
      const radioInput_ = document.createElement('input');
      radioInput_.setAttribute('type', 'radio');
      radioInput_.name = 'sections';
      radioInput_.className = 'pane-section-radio';
      radioInput_.id = 'pane-radio-' + section;
      radioInput_.value = section;

      return radioInput_;
    };
    const sectionRadioLabel = (section: string) => {
      const radioLabel_ = document.createElement('label');
      radioLabel_.className = 'pane-section-label webmap-btn';
      radioLabel_.htmlFor = 'pane-radio-' + section;
      radioLabel_.replaceChildren(section === 'layersmanager'
        ? this.createSVGIcon('layers')
        : this.createSVGIcon('settings')
      );
      return radioLabel_;
    };
    controls.forEach(s => paneSectionsHTML += `<div class="pane-section">${sectionRadioInput(s.get('name')).outerHTML + sectionRadioLabel(s.get('name')).outerHTML}</div>`);
    this.paneSections_.innerHTML = paneSectionsHTML;
    (this.paneSections_.querySelector('input') as HTMLInputElement).click();
    }, 500);
    return [this, ...controls];
  }
  private createSVGIcon(shape: 'arrow-left-square-fill'|'layers'|'list'|'settings'): HTMLElement | SVGElement {
    const newElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const paths = {
      'arrow-left-square-fill': `
        <path d="M16 14a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12zm-4.5-6.5H5.707l2.147-2.146a.5.5 0 1 0-.708-.708l-3 3a.5.5 0 0 0 0 .708l3 3a.5.5 0 0 0 .708-.708L5.707 8.5H11.5a.5.5 0 0 0 0-1z"/>
      `,
      'layers': `
        <path d="M8.235 1.559a.5.5 0 0 0-.47 0l-7.5 4a.5.5 0 0 0 0 .882L3.188 8 .264 9.559a.5.5 0 0 0 0 .882l7.5 4a.5.5 0 0 0 .47 0l7.5-4a.5.5 0 0 0 0-.882L12.813 8l2.922-1.559a.5.5 0 0 0 0-.882l-7.5-4zm3.515 7.008L14.438 10 8 13.433 1.562 10 4.25 8.567l3.515 1.874a.5.5 0 0 0 .47 0l3.515-1.874zM8 9.433 1.562 6 8 2.567 14.438 6 8 9.433z"/>
      `,
      'list': `
        <path fill-rule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
      `,
      'settings': `
        <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
        <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
      `
    };
    newElement.innerHTML = paths[shape];
    Object.entries({
      'xmlns': 'http://www.w3.org/2000/svg',
      'viewBox': '0 0 16 16',
      'height': '1em',
      'width': '1em',
      'fill': 'currentColor',
      'stroke': 'none'
    }).forEach(i => newElement.setAttribute(i[0], i[1]));

    return newElement;
  };
}
