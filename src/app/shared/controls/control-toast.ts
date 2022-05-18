import { Map } from 'ol';
import { Control } from 'ol/control';
import { ToastOpts } from '../models';
import { BSIconOptions } from '../utils/constants';
import { generatePointSVG } from '../utils/fns-utility';

export class ToastMessage extends Control {
  toneIcon: {[key: string]: BSIconOptions} = {
    action: 'check-square-fill',
    info: 'info-circle-fill',
    warning: 'exclamation-triangle-fill'
  };
  valueInput: HTMLInputElement | undefined;
  constructor() {
    super({element: document.createElement('section')});
    this.element.id = 'toast-element';
    this.element.className = 'hidden';
    setTimeout(() => {
      const map = this.getMap();
      if (map) {
        map.on('propertychange',(e) => {
          if (e.key === 'toast') {
            this.generateToast((e.target as Map).get('toast'));
          }
        });
      }
    }, 500);
  }
  generateToast(opts: ToastOpts) {
    this.element.className = opts.tone;
    if (opts.value) {
      this.valueInput = document.createElement('input');
      this.valueInput.type = 'text';
      this.valueInput.id = 'toastValueInput';
      this.valueInput.className = 'hide-input';
      this.valueInput.value = opts.value;
    };
    this.element.innerHTML = `
      <div class="toast-container">
        <div class="toast-header">
          <span class="toast-icon webmap-btn no-interaction">${generatePointSVG(this.toneIcon[opts.tone], false).outerHTML}</span>
          <span class="toast-title">
            ${opts.header}
            ${opts.value ? this.valueInput?.outerHTML + '<label for="toastValueInput">' + opts.value + '</label>' : ''}
          </span>
          <button class="toast-close webmap-btn" onclick="document.getElementById('toast-element').classList.add('hidden');">${generatePointSVG('x', false).outerHTML}</button>
        </div>
        ${opts.body ? '<div class="toast-body">'+opts.body+'</div>' : ''}
        ${opts.timer ? '<div id="toast-timer"><div></div></div>' : ''}
      </div>
    `;
    if (opts.fn) (this.element.firstElementChild as HTMLElement).onclick = opts.fn;
    if (opts.timer) this.destroyTimer(opts.timer);
  }
  public destroyTimer(timerType: 'short' | 'long' | 'indeterminate'): void {
    const animationopts: {[key: string]: KeyframeAnimationOptions} = {
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
    document.getElementById('toast-timer')!.firstElementChild!.animate(timerType === 'indeterminate' ? indeterminateTimer : basicTimer, animationopts[timerType]);
    if (timerType !== 'indeterminate') this.detroyToast(animationopts[timerType].duration as number);
  }
  public detroyToast(timing: number): void {
    const animation = this.element.animate([{opacity: 1},{opacity: 0}],{delay: timing * 0.9, duration: timing * 0.1});
    animation.onfinish = (e: any) => {this.element.classList.add('hidden');};
  }
  public addClick(result: 'close' | 'value'): void {
    this.element.addEventListener(
      'click',
      (e: MouseEvent) => result === 'close' ? this.destroyTimer('short') : this.getValue(e),
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
}
