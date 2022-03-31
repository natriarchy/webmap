import { BSIconOptions } from "./constants";
import { createElementWith, generatePointSVG } from "./fns-utility";

export const generateToast = (tone: 'warning' | 'info' | 'action', header: string, body?: any, timer?: 'short' | 'long'): HTMLElement => {
  if (document.getElementById('toast-message')) document.getElementById('toast-message')!.remove();
  const toneIcon: {[key: string]: BSIconOptions} = {
    action: 'check-square-fill',
    info: 'info-circle-fill',
    warning: 'exclamation-triangle-fill'
  };
  const innerHTMLString = `
    <div class="toast-container">
      <div class="toast-header">
        <span class="icon-btn no-interaction toast-icon">${generatePointSVG(toneIcon[tone]).outerHTML}</span>
        <span class="toast-title">${header}</span>
        <button class="toast-close icon-btn" onclick="document.getElementById('toast-message').remove();">${generatePointSVG('x').outerHTML}</button>
      </div>
      ${body ? '<div class="toast-body">'+body+'</div>' : ''}
      ${timer ? '<div id="toast-timer"><div></div></div>' : ''}
    </div>
  `;
  const newToast = createElementWith(false, 'section', {
    id: 'toast-message',
    class: tone,
    innerHTML: innerHTMLString
  });
  document.querySelector('div.ol-overlaycontainer-stopevent')!.append(newToast);
  if (timer) {
    let timing = timer === 'short' ? 3000 : 7000;
    document.getElementById('toast-timer')!.firstElementChild!.animate([{width: '100%'},{width: '0%'}],{duration: timing});
    const animation = document.getElementById('toast-message')!.animate([{opacity: 1},{opacity: 0}],{delay: timing * 0.9, duration: timing * 0.1});
    animation.onfinish = (e: any) => {newToast?.remove();};
  }
  return newToast;
};
