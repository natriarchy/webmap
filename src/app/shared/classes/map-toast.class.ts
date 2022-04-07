import { BSIconOptions } from "../utils/constants";
import { createElementWith, generatePointSVG } from "../utils/fns-utility";

export class MapToast {
  toastElement: HTMLElement;
  toneIcon: {[key: string]: BSIconOptions} = {
    action: 'check-square-fill',
    info: 'info-circle-fill',
    warning: 'exclamation-triangle-fill'
  };
  innerHTMLString: string;
  valueInput: HTMLInputElement | undefined;
  constructor(options: {
    tone: 'warning' | 'info' | 'action',
    header: string,
    body?: any,
    timer?: 'short' | 'long' | 'indeterminate'
    value?: string,
  }) {
    if (document.getElementById('toast-element')) document.getElementById('toast-element')!.remove();
    if (options.value) this.valueInput = createElementWith(false, 'input', {
      type: 'text',
      id: 'toastValueInput',
      class: 'hide-input',
      value: options.value
    });
    this.innerHTMLString = `
      <div class="toast-container">
        <div class="toast-header">
          <span class="toast-icon webmap-btn no-interaction">${generatePointSVG(this.toneIcon[options.tone]).outerHTML}</span>
          <span class="toast-title">
            ${options.header}
            ${options.value ? this.valueInput?.outerHTML + '<label for="toastValueInput">' + options.value + '</label>' : ''}
          </span>
          <button class="toast-close webmap-btn" onclick="document.getElementById('toast-element').remove();">${generatePointSVG('x').outerHTML}</button>
        </div>
        ${options.body ? '<div class="toast-body">'+options.body+'</div>' : ''}
        ${options.timer ? '<div id="toast-timer"><div></div></div>' : ''}
      </div>
    `;
    this.toastElement = createElementWith(false, 'section', {
      id: 'toast-element',
      class: options.tone,
      innerHTML: this.innerHTMLString
    });
    document.querySelector('div.ol-overlaycontainer-stopevent')!.append(this.toastElement);
    if (options.timer) this.destroyTimer(options.timer);
  }
  public destroyTimer(timerType: 'short' | 'long' | 'indeterminate'): void {
    const animationOptions: {[key: string]: KeyframeAnimationOptions} = {
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
    document.getElementById('toast-timer')!.firstElementChild!.animate(timerType === 'indeterminate' ? indeterminateTimer : basicTimer, animationOptions[timerType]);
    if (timerType !== 'indeterminate') this.detroyToast(animationOptions[timerType].duration as number);
  }
  public detroyToast(timing: number): void {
    const animation = document.getElementById('toast-element')!.animate([{opacity: 1},{opacity: 0}],{delay: timing * 0.9, duration: timing * 0.1});
    animation.onfinish = (e: any) => {this.toastElement?.remove();};
  }
  public addClick(result: 'close' | 'value'): void {
    document.getElementById('toast-element')!.addEventListener(
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
