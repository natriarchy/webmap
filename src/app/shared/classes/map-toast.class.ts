export class MapToast {
  readonly icons = {
    action: 'check-square-fill',
    info: 'info-circle-fill',
    warning: 'exclamation-triangle-fill',
    close: 'x'
  };
  private element: HTMLElement;
  private listeners: {[key: string]: any} = {};
  constructor() {
    if (!document.getElementById('toast-element')) {
      this.element = document.createElement('section');
      this.element.id = 'toast-element';
      document.querySelector('div.ol-overlaycontainer-stopevent')!.append(this.element);
    } else {
      this.element = document.getElementById('toast-element')!;
    }
  }
  public make(opts: {
    tone: 'warning' | 'info' | 'action',
    header: string,
    body?: any,
    timer?: 'immediate' | 'short' | 'long' | 'indeterminate',
    value?: string
  }): MapToast {
    if (!this.element) {
      this.element = document.createElement('section');
      this.element.id = 'toast-element';
      document.querySelector('div.ol-overlaycontainer-stopevent')!.append(this.element);
    }
    this.element.className = opts.tone;

    const makeInput = (val: string) => {
      const _input = document.createElement('input');
      _input.setAttribute('type', 'text');
      _input.id = 'toastValueInput';
      _input.className = 'hide-input';
      _input.setAttribute('value', val);
      return _input;
    };
    const valueInput = opts.value ? makeInput(opts.value) : undefined;

    this.element.innerHTML = `
      <div class="toast-container">
        <div class="toast-header">
          <span class="toast-icon map-btn --no-int">
            <span class="bi bi-${this.icons[opts.tone]}"></span>
          </span>
          <span class="toast-title">
            ${opts.header}
            ${opts.value ? valueInput?.outerHTML + '<label for="toastValueInput">' + opts.value + '</label>' : ''}
          </span>
          <button class="map-btn --icon" onclick="document.getElementById('toast-element').classList.add('hidden');">
            <span class="bi bi-${this.icons['close']}"></span>
          </button>
        </div>
        ${opts.body ? '<div class="toast-body">'+opts.body+'</div>' : ''}
        <div id="toast-timer" style="display:none"><div></div></div>
      </div>
    `;
    if (opts.timer) this.destroy(opts.timer);

    return this;
  }
  public destroy(type: 'immediate' | 'short' | 'long' | 'indeterminate' = 'immediate'): void {
    const el = document.getElementById('toast-timer')!;
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
      el.style.display = 'block';
      el.firstElementChild!.animate(...animateOpts[type]);
    };

    if (type !== 'indeterminate') {
      const animation = this.element.animate(
        [{opacity: 1}, {opacity: 0}],
        {delay: animateOpts[type][1].duration * 0.9, duration: animateOpts[type][1].duration * 0.1}
      );
      animation.onfinish = (e: any) => {
        this.element.classList.add('hidden');
        el.style.display = 'none';
      };
    }
  }
  public addClick(result: 'close' | 'value'): void {
    document.getElementById('toast-element')!.addEventListener(
      'click',
      (e: MouseEvent) => result === 'close' ? this.destroy('short') : this.getValue(e),
      {once: true}
    );
  }
  public getValue(e: any): void {
    const valInput = document.getElementById('toastValueInput');
    if (valInput) {
      (valInput as HTMLInputElement).select();
      (valInput as HTMLInputElement).setSelectionRange(0, 99999); /* For mobile devices */

      /* Copy the text inside the text field */
      navigator.clipboard.writeText((valInput as HTMLInputElement).value);
    }
  }

  public on(method: 'click', callback: any): void {
    this.listeners[method] = callback;
    this.element.addEventListener(
      'click',
      (e: MouseEvent) => this.emit(method, this),
      {once: true}
    );
  }

  private emit(method: string, payload: any) {
    const callback = this.listeners[method];
    if (typeof callback === 'function') {
        callback(payload);
    }
  }
}
