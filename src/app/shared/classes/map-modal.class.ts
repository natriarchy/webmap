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

    const actionBtn = document.createElement('button');
    actionBtn.setAttribute('type', 'button');
    actionBtn.className = 'webmap-btn';
    actionBtn.innerHTML = 'Zoom to Feature',
    actionBtn.onclick = (e: MouseEvent) => this.emit('zoomBtnClick');

    const modalContainer = document.createElement('section');
    modalContainer.className = 'modal-container';
    modalContainer.innerHTML = `
      <div class="modal-header">
        <h3><span>${options.header}</span>${options.subheader ? '<span>'+options.subheader+'</span>' : ''}</h3>
        <button type="button" class="modal-close webmap-btn" onclick="document.getElementById('modal-element').remove()"><span class="bi bi-x"></span></button>
      </div>
      <div class="modal-body">
        ${options.description ? '<p>'+options.description+'</p>' : ''}
        ${options.attrTable ? this.makeTable(options.attrTable) : undefined}
      </div>
    `;
    modalContainer.appendChild(actionBtn);

    this.modalElement = document.createElement('section');
    this.modalElement.id = 'modal-element';
    this.modalElement.className = options.type;
    this.modalElement.appendChild(modalContainer);

    document.querySelector('div.ol-overlaycontainer-stopevent')!.append(this.modalElement);
  }

  private makeTable(attributes: { [key: string]: any }): string {
    const tableRows = Object.entries(attributes)
      .filter(a => !['geometry', '_symbol', 'layer'].includes(a[0]))
      .map(e => `<tr><td class='prop'>${e[0]}</td><td class='val'>${e[1]}</td></tr>`);
    const _table = document.createElement('table');
    _table.className = 'map-table attribute';
    _table.innerHTML = '<tr><th>Property</th><th>Value</th></tr>' + tableRows.join('');

    return _table.outerHTML;
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
