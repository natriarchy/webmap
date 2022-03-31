import { BSIconOptions } from "./constants";
import { createElementWith, generatePointSVG } from "./fns-utility";

/**
 * @function generateToast Function to generate a "toast" element, a message or short dialogue centered at the bottom of the page.
 * @param {string} tone - 'warning' or 'info' or 'action', Will Change the Color and Icon of the Toast Element
 * @param {string} header - Text to Inlude in the Header of the Toast, can include html.
 * @param {any} body - optional
 * @param {string} [timer] - If set, will destroy toast after a short or long timer
 **/
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
        <span class="toast-icon webmap-btn no-interaction">${generatePointSVG(toneIcon[tone]).outerHTML}</span>
        <span class="toast-title">${header}</span>
        <button class="toast-close webmap-btn" onclick="document.getElementById('toast-message').remove();">${generatePointSVG('x').outerHTML}</button>
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
