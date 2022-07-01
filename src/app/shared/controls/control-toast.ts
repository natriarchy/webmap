import Control from "ol/control/Control";

interface ToastOpts {
  tone: 'warning' | 'info' | 'action';
  header: string;
  body?: any;
  timer?: 'immediate' | 'short' | 'long' | 'indeterminate';
  value?: string;
}

export class ToastCtrl extends Control {
  readonly name = 'toast-ctrl';
  readonly icons = {
    action: 'check-square-fill',
    info: 'info-circle-fill',
    warning: 'exclamation-triangle-fill',
    close: 'x'
  };
  _toastEl: HTMLElement;

  constructor(mapEl: HTMLElement, opts?: { targetId?: string }) {
    super({element: document.createElement('section')});
    this.set('name', this.name);

    this.element.className = 'toast-container --hidden';

    this._toastEl = this.reset();

    const observer = new MutationObserver((m, o) => {
      if (mapEl.querySelector('.ol-overlaycontainer-stopevent')) {
        this.getMap()!.set('toast-ctrl', {launch: this.launch.bind(this), destroy: this.destroy.bind(this) });
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

  reset(tone?: string): HTMLElement {
    if (this._toastEl) this._toastEl.remove();
    this._toastEl = document.createElement('div');
    this._toastEl.className = tone ? `toast --${tone}` : 'toast';
    this._toastEl.innerHTML = `
      <div class="toast-header">
          <span class="toast-icon map-btn --no-int"></span>
          <span class="toast-title"></span>
          <hr>
      </div>
      <div class="toast-body" style="display:none"></div>
      <div class="toast-timer" style="display:none"><div></div></div>
    `;

    const _closeBtn = document.createElement('button');
    _closeBtn.className = 'toast-close map-btn --icon';
    _closeBtn.onclick = (e: any) => this.destroy('immediate');
    _closeBtn.innerHTML = `<span class="bi bi-${this.icons['close']}"></span>`;

    this._toastEl.querySelector('.toast-header')!.appendChild(_closeBtn);
    this.element.append(this._toastEl);

    return this._toastEl;
  }

  launch(opts: ToastOpts): HTMLElement {
    this._toastEl = this.reset(opts.tone);
    this.element.classList.remove('--hidden');

    const makeInput = (val: string) => {
      const _input = document.createElement('input');
      _input.setAttribute('type', 'text');
      _input.className = 'toastValue hide-input';
      _input.setAttribute('value', val);
      return _input;
    };
    const valueInput = opts.value ? makeInput(opts.value) : undefined;

    this._toastEl.querySelector('.toast-icon')!.innerHTML = `<span class="bi bi-${this.icons[opts.tone]}"></span>`;
    this._toastEl.querySelector('.toast-title')!.innerHTML = `
            ${opts.header}
            ${opts.value ? valueInput?.outerHTML + '<label>' + opts.value + '</label>' : ''}
    `;
    const _body = this._toastEl.querySelector('.toast-body') as HTMLElement;
    _body.style.display = opts.body ? 'flex' : 'none';
    _body.innerHTML = opts.body ? opts.body : '';

    if (opts.timer) this.destroy(opts.timer);

    return this._toastEl;
  }

  destroy(type: 'immediate' | 'short' | 'long' | 'indeterminate' = 'immediate'): void {
    const timerEl = this._toastEl.querySelector('.toast-timer') as HTMLElement;
    const timerInd: Array<Keyframe> = [[0.0, 0, 0], [0.3, 0, 0.4], [0.5, 50, 0.5], [1.0, 100, 0]].map(
      e => ({offset: e[0], width: '100%', transform: `translateX(${e[1]}%) scaleX(${e[2]})`})
    );
    const animateOpts: {[key: string]: [Array<Keyframe>, {duration: number, iterations?: number}]} = {
      immediate: [[], {duration: 0}],
      short: [[{width: '100%'}, {width: '0%'}], {duration: 3000}],
      long: [[{width: '100%'}, {width: '0%'}], {duration: 7000}],
      indeterminate: [timerInd, {duration: 1750, iterations: Infinity}]
    };

    if (type !== 'immediate') {
      timerEl.style.display = 'block';
      timerEl.firstElementChild!.animate(...animateOpts[type]);
    };

    if (type !== 'indeterminate') {
      const animation = this.element.animate(
        [{opacity: 1}, {opacity: 0}],
        {delay: animateOpts[type][1].duration * 0.9, duration: animateOpts[type][1].duration * 0.1}
      );
      animation.onfinish = (e: any) => {
        this.element.classList.add('--hidden');
        this._toastEl = this.reset();
      }
    };
  }
}
