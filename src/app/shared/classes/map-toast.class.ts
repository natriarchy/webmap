import { BSIconOptions } from "../utils/constants";
import { createElementWith, generatePointSVG } from "../utils/fns-utility";

export class MapToast {
  private element: HTMLElement;
  private listeners: {[key: string]: any} = {};
  private toneIcon: {[key: string]: BSIconOptions} = {
    action: 'check-square-fill',
    info: 'info-circle-fill',
    warning: 'exclamation-triangle-fill'
  };
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

    const valueInput = opts.value
      ? createElementWith(false, 'input', {
        type: 'text',
        id: 'toastValueInput',
        class: 'hide-input',
        value: opts.value
      })
      : undefined;
    this.element.innerHTML = `
      <div class="toast-container">
        <div class="toast-header">
          <span class="toast-icon webmap-btn no-interaction">${generatePointSVG(this.toneIcon[opts.tone]).outerHTML}</span>
          <span class="toast-title">
            ${opts.header}
            ${opts.value ? valueInput?.outerHTML + '<label for="toastValueInput">' + opts.value + '</label>' : ''}
          </span>
          <button class="toast-close webmap-btn" onclick="document.getElementById('toast-element').classList.add('hidden');">${generatePointSVG('x').outerHTML}</button>
        </div>
        ${opts.body ? '<div class="toast-body">'+opts.body+'</div>' : ''}
        <div id="toast-timer" style="display:none"><div></div></div>
      </div>
    `;
    if (opts.timer) this.destroy(opts.timer);

    return this;
  }
  public destroy(timerType: 'immediate' | 'short' | 'long' | 'indeterminate' = 'immediate'): void {
    const timerEl = document.getElementById('toast-timer')!;
    const animationopts: {[key: string]: KeyframeAnimationOptions} = {
      'immediate': {duration: 0},
      'short': {duration: 3000},
      'long': {duration: 7000},
      'indeterminate': {duration: 1750, iterations: Infinity}
    };
    const indeterminateTimer: Array<Keyframe> = [
      {offset: 0.0, width: '100%', transform: 'translateX(0) scaleX(0)'},
      {offset: 0.3, width: '100%', transform: 'translateX(0) scaleX(0.4)'},
      {offset: 0.5, width: '100%', transform: 'translateX(50%) scaleX(0.5)'},
      {offset: 1.0, width: '100%', transform: 'translateX(100%) scaleX(0)'}
    ];
    const basicTimer: Array<Keyframe> = [{width: '100%'},{width: '0%'}];

    if (timerType !== 'immediate') {
      timerEl.style.display = 'block';
      timerEl.firstElementChild!.animate(
        timerType === 'indeterminate' ? indeterminateTimer : basicTimer,
        animationopts[timerType]
      );
    }
    if (timerType !== 'indeterminate') {
      const timing = animationopts[timerType].duration as number;
      const animation = this.element.animate([{opacity: 1},{opacity: 0}],{delay: timing * 0.9, duration: timing * 0.1});
      animation.onfinish = (e: any) => {
        this.element.classList.add('hidden');
        timerEl.style.display = 'none';
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
