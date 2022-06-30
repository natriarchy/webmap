import Control from "ol/control/Control";

export class ControlPaneEl extends Control {
  readonly name = 'ctrl-pane';
  readonly icons = {
    close: 'arrow-left-square-fill',
    open: 'list',
    layers: 'layers-fill',
    settings: 'gear-fill'
  };
  _toggleBtn: HTMLElement;
  _pnContent: HTMLElement;
  toggleStatus = false;

  constructor(opts: {
    position: 'left',
    toggleId: string,
    toggleInit?: boolean
  }) {
    super({element: document.createElement('section')})
    this.element.id = `controlpn-${opts.position}`;
    this.element.className = 'pane-hidden';

    // set up toggle button
    this.toggleStatus = opts.toggleInit ? opts.toggleInit : false;
    this._toggleBtn = document.createElement('button');
    this._toggleBtn.title = `Toggle ${opts.position} Pane`;
    this._toggleBtn.innerHTML = `<span class="bi bi-${this.icons[this.toggleStatus ? 'close' : 'open']}"></span>`;
    this._toggleBtn.onclick = this.handleToggle.bind(this);

    const _toggleEl = document.createElement('div');
    _toggleEl.className = 'ol-unselectable ol-custom-control';
    _toggleEl.append(this._toggleBtn);

    const toggleTargetObs = new MutationObserver((m, o) => {
      const _toggleTarget = document.getElementById(opts.toggleId);
      if (_toggleTarget) {
        _toggleTarget.prepend(_toggleEl);
        o.disconnect();
        return;
      }
    });
    toggleTargetObs.observe(document, {childList: true, subtree: true});

    const _titleEl = document.createElement('h3');
    _titleEl.id = 'pane-section-title';
    this.element.append(_titleEl);

    this._pnContent = document.createElement('form');
    this._pnContent.id = 'pane-sections';
    this._pnContent.onchange = (e: any) => {
        this._pnContent.parentElement!.querySelectorAll('.pane-section-container').forEach(i => {
          i.classList.contains(e.target.value) ? i.classList.add('active') : i.classList.remove('active')
        });
        _titleEl.innerText = e.target.value;
    };

    this.element.prepend(this._pnContent);
  }
  handleToggle(e: MouseEvent): void {
    e.preventDefault();
    this.element.classList.toggle('pane-hidden');
    document.getElementById('controltb-top-left')?.classList.toggle('pane-open');
    this.toggleStatus = !this.toggleStatus;
    this.set('toggleStatus', this.toggleStatus);
    this._toggleBtn.innerHTML =  `<span class="bi bi-${this.icons[this.toggleStatus ? 'close' : 'open']}"></span>`;
  }
  with(controls: Array<Control>): Array<Control> {
    controls.forEach(c => c.setTarget(this.element));
    const makeRadioGrp = (section: string, icon: string) => {
      const _radio = document.createElement('input');
      _radio.setAttribute('type', 'radio');
      _radio.name = 'sections';
      _radio.className = 'pane-section-radio';
      _radio.id = 'pane-radio-' + section;
      _radio.value = section;
      const _label = document.createElement('label');
      _label.className = 'pane-section-label map-btn --icon';
      _label.htmlFor = 'pane-radio-' + section;
      _label.innerHTML = `<span class="bi bi-${icon}"></span>`;
      return _radio.outerHTML + _label.outerHTML;
    };
    const toTitle = (str: string): string => str.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    setTimeout(() => {
      this._pnContent.innerHTML = controls.map(c => `<div class="pane-section" title="Go to ${toTitle(c.get('name'))}">${makeRadioGrp(c.get('name'), c.get('icon'))}</div>`).join('');
      (this._pnContent.querySelector('input') as HTMLInputElement).click();
    }, 500);
    return [this, ...controls];
  }
}
