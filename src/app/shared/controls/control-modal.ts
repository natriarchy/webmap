import Control from "ol/control/Control";
import { FormInputEl } from "../models";

interface ContentType {
  feature: Array<[string, any]>;
  dialog: Array<FormInputEl<'button'>|FormInputEl<'checkbox'>|FormInputEl<'radio'>|FormInputEl<'select'>|FormInputEl<'text'>>;
}
interface ModalOpts {
  type: 'dialog'|'feature';
  header: string;
  subheader?: string;
  description?: string;
  content?: ContentType['dialog'] | ContentType['feature'];
  actions?: Array<{label: string; title?: string; action: (e: MouseEvent, el?: HTMLElement) => any;}>;
}

export class ModalCtrl extends Control {
  readonly name = 'modal-ctrl';
  readonly icons = {
    action: 'check-square-fill',
    info: 'info-circle-fill',
    warning: 'exclamation-triangle-fill',
    close: 'x'
  };
  _mapEl: HTMLElement;
  _modalEl: HTMLElement;

  constructor(mapEl: HTMLElement, opts?: { targetId?: string }) {
    super({element: document.createElement('section')});
    this.set('name', this.name);
    this._mapEl = mapEl;

    this.element.className = 'modal-container --hidden';

    this._modalEl = this.reset();

    const observer = new MutationObserver((m, o) => {
      if (mapEl.querySelector('.ol-overlaycontainer-stopevent')) {
        this.getMap()!.set('modal-ctrl', {launch: this.launch.bind(this), destroy: this.destroy.bind(this) });
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

  reset(): HTMLElement {
    if (this._modalEl) this._modalEl.remove();

    this._modalEl = document.createElement('div');
    this._modalEl.className = 'modal';
    this._modalEl.innerHTML = `
      <div class="modal-header">
        <div class="modal-title"></div>
      </div>
      <div class="modal-body"></div>
      <div class="modal-actions"></div>
    `;

    const _closeBtn = document.createElement('button');
    _closeBtn.className = 'modal-close map-btn --icon';
    _closeBtn.onclick = (e: any) => this.destroy();
    _closeBtn.innerHTML = `<span class="bi bi-${this.icons['close']}"></span>`;
    this._modalEl.querySelector('.modal-header')!.appendChild(_closeBtn);

    this.element.append(this._modalEl);

    return this._modalEl;
  }

  launch(opts: ModalOpts): HTMLElement {
    this._modalEl = this.reset();
    this.element.className = 'modal-container --' + opts.type;

    this._modalEl.querySelector('.modal-title')!.innerHTML = opts.subheader
      ? `<h3>${opts.header}</h3><h4>${opts.subheader}</h4>`
      : `<h3>${opts.header}</h3>`;

    if (opts.description) this._modalEl.querySelector('.modal-body')!.innerHTML = `<p>${opts.description}</p>`;

    if (opts.content) this._modalEl.querySelector('.modal-body')!.appendChild(this.makeContent(opts.type, opts.content)!);

    if (opts.actions) {
      const actionBtns = opts.actions.map(a => {
        const _btn = document.createElement('button');
        _btn.setAttribute('type', 'button');
        _btn.className = 'map-btn';
        _btn.title = a.title || '';
        _btn.innerHTML = a.label,
        _btn.onclick = (e: MouseEvent) => a.action(e, this._modalEl);
        return _btn;
      });
      this._modalEl.querySelector('.modal-actions')!.append(...actionBtns);
    };

    if (opts.type === 'dialog') {
      this.element.onclick = (e: MouseEvent) => {
        const bounceAnimation = [1,1.05,1.025,1.05,1].map(i => ({transform: `scale(${i})`}));
        if (e.target === e.currentTarget) this._modalEl.animate(bounceAnimation, {duration: 300});
        // (e.target as HTMLElement).remove();
      };
    };

    (opts.type === 'dialog' ? this._mapEl : document.querySelector('div.ol-overlaycontainer-stopevent'))!.appendChild(this.element);

    return this._modalEl;
  }

  destroy(): void {
    this.element.className = 'modal-container --hidden';
    this.reset();
    // const animation = this.element.animate(
    //   [{opacity: 1}, {opacity: 0}],
    //   {delay: 3000 * 0.9, duration: 3000 * 0.1}
    // );
    // animation.onfinish = (e: any) => {
    //   this.element.classList.add('--hidden');
    //   this.reset();
    // };
  }

  private makeForm(id: string, inputs: Array<FormInputEl<'button'|'checkbox'|'radio'|'select'|'text'>>, submitfn?: (e: any) => any): HTMLFormElement {
    const fixStr = (str: string | undefined) => str ? str.replace(/(_|\s|\&)/gi, '-').toLowerCase() : undefined;
    const inputEls: Array<HTMLElement> = inputs.map(input => {
      const elID = fixStr(input.id);
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

  private makeContent<T extends 'feature' | 'dialog'>(type: T, content: ContentType[T]): HTMLElement | undefined {
    let contentHTML;
    if (type === 'feature') {
      const tableRows = (content as ContentType['feature']).filter(a => !['geometry', '_symbol', 'layer'].includes(a[0]))
        .map(e => `<tr><td class='prop'>${e[0]}</td><td class='val'>${e[1]}</td></tr>`);
      const _table = this.newEl('table', {className: 'map-table attribute', innerHTML: '<tr><th>Property</th><th>Value</th></tr>' + tableRows.join('')});
      contentHTML = _table;
    } else if (type === 'dialog') {
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
