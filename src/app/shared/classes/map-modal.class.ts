import { createElementWith, generatePointSVG } from "../utils/fns-utility";

export class MapModal {
  type: 'feature' | 'info' = 'feature';
  modalElement: HTMLElement;
  listeners: {[key: string]: any} = {'zoomBtnClick': undefined};
  constructor(options: {
    type: 'feature' | 'info',
    header: string,
    subheader?: string,
    description?: string,
    attrTable?: object
  }) {
    if (document.getElementById('modal-element')) document.getElementById('modal-element')!.remove();
    const modalElHTML = `
      <div class="modal-header">
        <h3><span>${options.header}</span>${options.subheader ? '<span>'+options.subheader+'</span>' : ''}</h3>
        <button type="button" class="modal-close webmap-btn" onclick="document.getElementById('modal-element').remove()">${generatePointSVG('x').outerHTML}</button>
      </div>
      <div class="modal-body">
        ${options.description ? '<p>'+options.description+'</p>' : ''}
        ${options.attrTable ? this.makeTable(options.attrTable) : undefined}
      </div>
    `;
    const actionBtn = createElementWith(false, 'button', {type: 'button', class: 'webmap-btn', innerHTML: 'Zoom to Feature', onclick: (e: MouseEvent) => this.emit('zoomBtnClick')});
    const modalContainer = createElementWith(false, 'section', {
      class: 'modal-container',
      innerHTML: modalElHTML,
      children: [actionBtn]
    });
    this.modalElement = createElementWith(false, 'section', {
      id: 'modal-element',
      class: options.type,
      children: [modalContainer]
    });
    document.querySelector('div.ol-overlaycontainer-stopevent')!.append(this.modalElement);
  }

  private makeTable(attributes: { [key: string]: any }): string {
    const tableRows = Object.entries(attributes)
      .filter(a => !['geometry', '_symbol', 'layer'].includes(a[0]))
      .map(e => `<tr><td class='prop'>${e[0]}</td><td class='val'>${e[1]}</td></tr>`);
    return createElementWith(false, 'table', {
      class: 'map-table attribute',
      innerHTML: '<tr><th>Property</th><th>Value</th></tr>' + tableRows.join('')
    }).outerHTML;
  }

  public detroyModal(): void {
    if (document.getElementById('modal-element')) document.getElementById('modal-element')?.remove();
  }

  private emit(method: string, payload = null) {
    const callback = this.listeners[method];
    if (typeof callback === 'function') {
        callback(payload);
    }
  }

  addEventListener(method: string, callback: any): void {
    this.listeners[method] = callback;
  }

  removeEventListener(method: string): void {
      delete this.listeners[method];
  }
}
