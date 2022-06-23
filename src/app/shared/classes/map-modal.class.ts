import { FormInputEl } from "../models";

interface ContentType {
  feature: Array<[string, any]>;
  dialog: Array<FormInputEl<'button'>|FormInputEl<'checkbox'>|FormInputEl<'radio'>|FormInputEl<'select'>|FormInputEl<'text'>>;
}

export class MapModal <T extends 'feature' | 'dialog'> {
  type: T;
  modalElement: HTMLElement;
  listeners: {[key: string]: any} = {'zoomBtnClick': undefined};
  constructor(opts: {
    type: T,
    header: string,
    subheader?: string,
    description?: string,
    content?: ContentType[T]
  }) {
    if (document.getElementById('modal-element')) document.getElementById('modal-element')!.remove();
    this.type = opts.type;

    const actionBtn = document.createElement('button');
    actionBtn.setAttribute('type', 'button');
    actionBtn.className = 'webmap-btn';
    actionBtn.innerHTML = opts.type === 'dialog' ? 'Submit' : 'Zoom to Feature',
    actionBtn.onclick = (e: MouseEvent) => {
      if (opts.type === 'dialog') {
        const form = document.getElementById('modal-element')!.querySelector('form');
        let vals = [];
        for (let i = 0; i < (form as HTMLFormElement).elements.length; i++) {
          const el = (form as HTMLFormElement).elements.item(i) as any;
          vals.push(['checkbox','radio'].includes(el.type) ? el.checked : el.value);
        }
        console.info(vals);
      } else {
        this.emit('zoomBtnClick');
      };
    }
    const destroyModal = (e: any): void => {
      if (document.getElementById('modal-element')) document.getElementById('modal-element')?.remove();
    };
    const closeBtn = this.newEl('button', {
      type: 'button',
      class: 'modal-close webmap-btn',
      innerHTML: '<span class="bi bi-x"></span>',
      onclick: destroyModal
    });
    const modalContainer = document.createElement('section');
    modalContainer.className = 'modal-container';
    modalContainer.innerHTML = `
      <div class="modal-header">
        <div class="modal-title">
          <h3>${opts.header}</h3>
          ${opts.subheader ? '<h4>'+opts.subheader+'</h4>' : ''}
        </div>
      </div>
      <div class="modal-body">
        ${opts.description ? '<p>'+opts.description+'</p>' : ''}
      </div>
    `;
    modalContainer.appendChild(actionBtn);

    this.modalElement = document.createElement('section');
    this.modalElement.id = 'modal-element';
    this.modalElement.className = `--${opts.type}`;
    this.modalElement.appendChild(modalContainer);
    if (opts.type === 'dialog') {
      this.modalElement.onclick = (e: MouseEvent) => {
        const bounceAnimation = [1,1.05,1.025,1.05,1].map(i => ({transform: `scale(${i})`}));
        if (e.target === e.currentTarget) modalContainer.animate(bounceAnimation, {duration: 300});
        // (e.target as HTMLElement).remove();
      };
    };
    (opts.type === 'dialog' ? document.body : document.querySelector('div.ol-overlaycontainer-stopevent'))!.append(this.modalElement);
    modalContainer.querySelector('.modal-header')?.append(closeBtn);
    if (opts.content) {
      this.modalElement.querySelector('div.modal-body')!.appendChild(this.makeContent(opts.content)!);
    }
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

  private makeForm(id: string, inputs: Array<FormInputEl<'button'|'checkbox'|'radio'|'select'|'text'>>, submitfn?: (e: any) => any): HTMLFormElement {
    const fixStr = (str: string | undefined) => str ? str.replace(/(_|\s|\&)/gi, '-').toLowerCase() : undefined;
    const inputEls: Array<HTMLElement> = inputs.map(input => {
      const elID = `${fixStr(input.id)}-${input.type}`;
      const formFieldEl = this.newEl('div', { class: `input-field-group for-${input.type}`});
      if (input.type === 'select') {
        formFieldEl.append(
          this.newEl('label', {for: elID, innerHTML: input.label }),
          this.newEl('select', {id: elID, innerHTML: (input as FormInputEl<'select'>).options.map(s => `<option value="${s.value}">${s.label}</option>`).join('')})
        );
      } else if (input.type === 'radio') {
        const radioEls = (input as FormInputEl<'radio'>).options.reduce((p,v,i) => p.concat([
          this.newEl('label', {for: `${elID}-${i}`, innerHTML: v.label }),
          this.newEl('input', {
            type: input.type,
            id:  `${elID}-${i}`,
            name: `${elID}-grp`,
            checked: v.value || false,
            onchange: input.fnOpts?.type === 'change' ? input.fnOpts.fn : undefined,
            value: v.value || v.label
          })
        ]), [this.newEl('span',{innerHTML: input.label})] as Array<HTMLElement>)
        formFieldEl.append(...radioEls);
      } else {
        formFieldEl.append(
          this.newEl('label', {for: elID, innerHTML: input.label }),
          this.newEl(input.type === 'button' ? 'button' : 'input', {
            type: input.type,
            id:  elID,
            innerHTML: input.type === 'button' ? (input.options as any).label : undefined,
            onclick: input.fnOpts?.type === 'click' ? input.fnOpts.fn : undefined,
            onchange: input.fnOpts?.type === 'change' ? input.fnOpts.fn : undefined,
            ...(input.type === 'checkbox' && {checked: (input as FormInputEl<'checkbox'>).options.value || false}),
            ...(input.type !== 'checkbox' && {value: (input.options as any).value ? (input.options as any).value : undefined})
          })
        );
      };
      return formFieldEl;
    });

    return this.newEl('form', { children: inputEls });
  }
  private makeContent(content: ContentType[T]): HTMLElement | undefined {
    let contentHTML;
    if (this.type === 'feature') {
      const tableRows = (content as ContentType['feature']).filter(a => !['geometry', '_symbol', 'layer'].includes(a[0]))
        .map(e => `<tr><td class='prop'>${e[0]}</td><td class='val'>${e[1]}</td></tr>`);
      const _table = this.newEl('table', {className: 'map-table attribute', innerHTML: '<tr><th>Property</th><th>Value</th></tr>' + tableRows.join('')});
      contentHTML = _table;
    } else if (this.type === 'dialog') {
      contentHTML = this.makeForm('modal-form', content as ContentType['dialog']);
    };

    return contentHTML;
  }
  private newEl<HTMLType extends keyof HTMLElementTagNameMap>(tag: HTMLType, props: { [key: string]: any }): HTMLElementTagNameMap[HTMLType] {
    const _newEl = document.createElement(tag);
    Object.entries(props).filter(v => !!v[1]).forEach(e => {
      if (e[0] === 'children') {
        _newEl.append(...e[1]);
      } else if (['className','checked','htmlFor','id','innerHTML','name','onclick','onchange','title','type','value'].includes(e[0])) {
        Object.assign(_newEl, Object.fromEntries([e]));
      } else {
        _newEl.setAttribute(e[0], e[1]);
      }
    });
    return _newEl;
  }
}
