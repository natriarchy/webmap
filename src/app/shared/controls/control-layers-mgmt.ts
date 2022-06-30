import Control from 'ol/control/Control';
import BaseLayer from 'ol/layer/Base';
import { LyrConstants, LyrStyleOpts } from '../models';

export class LayersMgmt extends Control {
  readonly name = 'layers';
  readonly icon = 'layers';
  readonly icons = {
    info: 'info-circle-fill',
    filter: 'funnel-fill',
    sort: 'sort-alpha-down'
  };
  _layersEl: HTMLElement;
  _layersGrps: Set<string> = new Set();

  constructor(opts: {type: 'pane' | 'standalone'; targetId: string;}) {
    super({
      element: document.createElement('div'),
      target: document.getElementById(opts.targetId) || undefined
    });
    this.set('name', this.name);
    this.set('icon', this.icon);

    if (opts.type === 'standalone') {
      const _ctrlBtn = document.createElement('button');
      _ctrlBtn.title = 'Toggle Layers Manager';
      _ctrlBtn.setAttribute('type', 'button');
      _ctrlBtn.setAttribute('data-active', 'false');
      _ctrlBtn.innerHTML = `<span class="bi bi-${this.icon}"></span>`;
      _ctrlBtn.onclick = this.handleToggle.bind(this);
      this.element.appendChild(_ctrlBtn);

      this._layersEl = document.createElement('div');
      this._layersEl.className = `layers-mgmt ${opts.type}`;
      this.element.appendChild(this._layersEl);
    } else {
      this._layersEl = this.element;
    };

    this.element.className = opts.type === 'standalone'
      ? 'ol-unselectable ol-custom-control'
      : 'pane-section-container ' + this.name;

    const observer = new MutationObserver((m, o) => {
      const lyrsDiv_ = document.querySelector('.ol-layers');
      if (lyrsDiv_ && lyrsDiv_.children.length > 1) {
        this.generateLayers();
        o.disconnect();
        o.takeRecords();
        return;
      }
    });
    observer.observe(document, { childList: true, subtree: true });
  }
  handleToggle(e: MouseEvent): void {
    const handleClickOutside = (function (e: any) {
      const lyrsDiv: HTMLElement = document.querySelector('.layers-mgmt')!;
      const isSame = (keyEl: any, checkEls: Array<any>) => checkEls.includes(keyEl);
      const isIn = (r: DOMRect) => (e.pageX < r.right && e.pageX > r.left && e.pageY < r.bottom && e.pageY > r.top);
      const tests = [
        isSame(document.querySelector('#layers-filter'), [(e.target as HTMLElement).parentElement, e.target]),
        isIn(lyrsDiv.getBoundingClientRect()),
        isSame(lyrsDiv.previousElementSibling, [(e.target as HTMLElement).parentElement, e.target])
      ];
      if (tests.every(v => v === false)) {
        lyrsDiv.style.display = 'none';
        lyrsDiv.previousElementSibling!.setAttribute('data-active', 'false');
        lyrsDiv.previousElementSibling!.classList.remove('dropdown-open');
        document.removeEventListener('click', handleClickOutside);
      };
      return;
    });
    document.removeEventListener('click', handleClickOutside);
    const btn = e.currentTarget as HTMLElement;
    let state = btn.getAttribute('data-active') === 'true';
    btn.setAttribute('data-active', String(!state));
    state = btn.getAttribute('data-active') === 'true';
    btn.classList.toggle('dropdown-open');
    if (state) {
      document.addEventListener('click', handleClickOutside);
      this._layersEl.style.display = 'flex';
    };
    this._layersEl.animate(
      [{opacity: 0, 'overflow-y': 'hidden'}, {opacity: 1, 'overflow-y': 'auto'}],
      {duration: 250, direction: state ? 'normal' : 'reverse'}
    ).onfinish = e => {
      this._layersEl.style.display = state ? 'flex' : 'none';
    };
  }
  generateLayers(): void {
    const _layersList = document.createElement('div');
    _layersList.className = 'layers-list';
    this._layersEl.appendChild(_layersList);
    this.getMap()!.getAllLayers()
      .filter(l => !!l.get('group'))
      .forEach(l => {
        const layerEl = this.makeLayerEl(l);
        this._layersGrps.add(l.get('group'));
        _layersList.appendChild(layerEl);
      }
    );
    if (this._layersGrps.size > 0) {
      const ctrlVals = {
        'filter': ['--Show All Layers--', '--Visible Layers--', ...Array.from(this._layersGrps)].map(
          (v,i) => ({label: v, value: i < 2 ? {0: '', 1: 'true'}[i] : v})
        ),
        'sort': ['name','group','visible'].map(i => ({label: i}))
      };
      const layersCtrl = this.newEl('form', {
        className: 'layers-ctrl',
        onchange: (e: InputEvent) => {
          const targetEl = e.target as HTMLElement;
          const action = String(targetEl.getAttribute('name') ?? targetEl.id).split('-')[1];
          const value = action === 'sort'
            ? ((e.currentTarget as HTMLFormElement).elements.namedItem('layers-sort') as RadioNodeList).value
            : (targetEl as HTMLSelectElement).value;
          if (action === 'filter') {
            const filterAttr = `data-${['','true'].includes(value) ? 'visible' : 'group'}`;
            document.querySelectorAll(`[${filterAttr}]`).forEach(
              e => e.className = (value === '' || e.getAttribute(filterAttr) === value) ? 'layer' : 'layer hidden'
            );
          } else {
            const sortFn = (a: Element, b: Element) => Number(a.getAttribute(`data-${value}`)! > b.getAttribute(`data-${value}`)! || -1) * Number(value !== 'visible' || -1);
            _layersList.replaceChildren(...Array.from(_layersList.children).sort(sortFn));
          }
        },
        children: ['filter','sort'].map(
          (v,i,a) => this.newFormGrp(i === 0 ? 'select' : 'radio', i === 1, ctrlVals[v as 'filter'|'sort'], {
            label: `<span class="map-btn --no-int bi bi-${this.icons[v as 'filter'|'sort']}"></span>`,
            group: `layers-${v}`,
            addClass: `layers-${v} ${i === 0 ? 'full-width' : 'hide-input'}`
          })
        )
      });
      this._layersEl.prepend(layersCtrl);
    }
  }
  makeLayerEl(lyr: BaseLayer): HTMLElement {
    const toTitle = (str: string): string => str.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    const _label = this.newEl('label', {
      className: 'layer-label',
      htmlFor: lyr.getClassName() + '_toggle',
      innerHTML: [
        `<span>${toTitle(lyr.getClassName())}</span>`,
        ...(lyr.get('group') ? [`<span class="group">${lyr.get('group')}</span>`] : [])
      ].join('')
    });

    const _toggle = this.newEl('input', {
      className: lyr.getClassName(),
      type: 'checkbox',
      id: lyr.getClassName() + '_toggle',
      name: lyr.getClassName(),
      title: 'Toggle Layer',
      checked: lyr.getVisible(),
      onclick: (e: MouseEvent) => {
        const _layerEl = document.querySelector(`.layer[data-name="${lyr.getClassName()}"]`)!;
        lyr.setVisible(!lyr.getVisible());
        _layerEl.setAttribute('data-visible', String(lyr.getVisible()));
        if (['VectorTileLayer','VectorLayer'].includes(lyr.get('lyrType'))) {
          const _legend: HTMLElement = _layerEl.querySelector('.legend')!;
          _legend.style.display = !lyr.getVisible() ? 'none' : 'flex';
          if (lyr.getVisible() && !_legend.hasChildNodes()) {
            const _legendTable = this.makeLegend(lyr.get('styleDetails'));
            _legend.appendChild(_legendTable);
          }
        }
      }
    });

    const _infoBtn = this.newEl('button', {
      className: 'layer-info map-btn --icon',
      type: 'button',
      title: lyr.getClassName() + ' More Info',
      innerHTML: `<span class="bi bi-${this.icons.info}"></span>`,
      onclick: (e: MouseEvent) => { alert(Object.entries(lyr.getProperties())); }
    });

    const _legend = this.newEl('div', {
      className: 'legend',
      ...((lyr.getVisible() && ['VectorTileLayer','VectorLayer'].includes(lyr.get('lyrType'))) && {
        children: [
          this.makeLegend(lyr.get('styleDetails'))
        ]
      })
    });

    return this.newEl('div', {
      className: 'layer',
      children: [_toggle,_label,_infoBtn,_legend],
      'data-name': lyr.getClassName(),
      'data-group': lyr.get('group') || '',
      'data-visible': String(lyr.getVisible())
    });
  }

  private newEl<HTMLType extends keyof HTMLElementTagNameMap>(tag: HTMLType, props: { [key: string]: any }): HTMLElementTagNameMap[HTMLType] {
    const _newEl = document.createElement(tag);
    Object.entries(props).forEach(e => {
      if (e[0] === 'children') {
        _newEl.append(...e[1])
      } else if (['checked','className','htmlFor','id','innerHTML','name','onclick','onchange','title','type'].includes(e[0])) {
        Object.assign(_newEl, Object.fromEntries([e]));
      } else {
        _newEl.setAttribute(e[0], e[1]);
      }
    });
    return _newEl;
  }

  private makeLegend<FT extends LyrConstants['feat-type']>(opts: {style: LyrConstants['style-type'], geom: FT, opts: LyrStyleOpts<any, any>}): HTMLTableElement {
    const base: FT extends 'Point' ? LyrConstants['Point-base'] : LyrConstants[FT] = opts.opts.base;
    const classes: { [key: string]: LyrConstants[FT]; } = (opts.opts as LyrStyleOpts<'ramp-basic'|'ramp-special', any>).classes || {};
    const allClasses = Object.assign({base: base}, classes || {});
    const get = <Init extends string|number> (row: any, prop: string, init: Init): Init => row[prop] || (base as any)[prop] || init;
    const makePatch: {[key: string]: (row: any) => string} = {
      'Point': (row: LyrConstants['Point'|'Point-base']) => get(row,'src','').startsWith('data:image/svg')
        ? get(row,'src','').slice(24).replace('fill:white;',`fill:${get(row,'fill','rgb(128,147,241)')};`)
        : `<img src="${get(row,'src','')}" />`,
      'Line': (row: LyrConstants['Line']) => {
        const attrs = [
          `stroke:${this.reColor(get(row,'stroke',''))};stroke-width:20;`,
          `stroke:${get(row,'stroke','')};stroke-width:12;${row.strokeType === 'dashed' ? 'stroke-dasharray:45 20;' : ''}`
        ];

        return `<svg width="1em" height="0.5em" viewBox="0 0 200 100">${attrs.reduce((p,v) => `${p}<path d="M15 85 Q 25 50 85 50 L115 50 Q175 50 185 15" style="fill:transparent;stroke-linecap:round;${v}" />`,'')}</svg>`;
      },
      'Polygon': (row: LyrConstants['Polygon']) => {
        const attrs = [
          `fill:${get(row,'fill','transparent')};stroke:${get(row,'stroke','') || this.reColor(get(row,'fill','rgba(0,0,0,0)'))};${row.strokeType === 'dashed' ? 'stroke-dasharray:45 20;':''}`
        ];

        return `<svg width="1em" height="0.5em" viewBox="0 0 200 100">${attrs.reduce((p,v)=> `${p}<rect x="10" y="10" width="180" height="80" style="fill-opacity:0.7;stroke-width:10;${v}" />`,'')}</svg>`;
      }
    };

    return this.newEl('table', {
      class: 'map-table legend',
      children: Object.entries(allClasses).map(e => this.newEl('tr', {
        innerHTML: `<td class="patch">${makePatch[opts.geom](e[1])}</td><td class="label">${e[1].label}</td>`
      }))
    });
  }

  private newFormGrp(
    type: 'radio' | 'select',
    hideInput: boolean,
    values: Array<{label: string; value?: boolean | string | number;}>,
    wrapper: {label: string, group: string, addClass?: string}
  ): HTMLElement {
    const fixId = (id: string | undefined) => id ? id.replace(/(_|\s|\&)/gi, '-').toLowerCase() : undefined;
    const toTitle = (str: string): string => str.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
    const fieldEls = type === 'select'
      ? [this.newEl('select', { id: fixId(wrapper.group), innerHTML: values.map(v => `<option value="${v.value}">${v.label}</option>`).join('') })]
      : values.flatMap(v => [
            this.newEl('label', { for: `${fixId(v.label)}-${type}`, innerHTML: toTitle(v.label) }),
            this.newEl('input', { type: type, id: `${fixId(v.label)}-${type}`, name: fixId(wrapper.group), checked: v.value || false, value: v.value || v.label })
          ].sort((a,b) => Number(a > b || -1) * Number(hideInput || -1)
        )
      );
    return this.newEl('div', {
        class: `input-field-group${wrapper.addClass ? ' ' + wrapper.addClass : ''}`,
        innerHTML: wrapper.label,
        children: fieldEls
    });
  }

  private reColor(color: string, opacity = 0.8): string {
    const isHex = color[0] === '#';
    // if 3 character hex string (i.e. #fff) make normal 6 character hex
    const _color = color.length === 4 ? color.split('').map((v,i) => i < 1 ? v : v + v).join('') : color;
    // separate 3 color channels into a string array
    const rgbRaw = isHex ? _color.slice(1).match(/.{2}/g)!.slice(0,3) : _color.replace(/[a-z\s\(\)]/ig,'').split(',', 3);
    const yiqVal = rgbRaw.reduce((s,v,i,a) => s + (parseInt(v, isHex ? 16 : 10) * [299, 587, 114][i]), 0) / 1000;
      // If the YIQ is above 128 then it's considered a bright color.
    return yiqVal >= 128 ? `rgba(100,100,100,${opacity})` : `rgba(245,245,245,${opacity})`;
  };

}
