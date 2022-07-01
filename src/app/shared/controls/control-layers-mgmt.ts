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
      Object.assign(_ctrlBtn, {
        type: 'button',
        title: 'Toggle Layers Manager',
        innerHTML: `<span class="bi bi-${this.icon}"></span>`,
        onclick: this.handleToggle.bind(this)
      });
      _ctrlBtn.setAttribute('data-active', 'false');
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
    ).onfinish = e => this._layersEl.style.display = state ? 'flex' : 'none';
  }

  generateLayers(): void {
    const _lyrsList = document.createElement('div');
    _lyrsList.className = 'layers-list';
    this._layersEl.appendChild(_lyrsList);

    this.getMap()!.getAllLayers()
      .filter(l => !!l.get('group'))
      .forEach(l => {
        const layerEl = this.makeLayerEl(l);
        this._layersGrps.add(l.get('group'));
        _lyrsList.appendChild(layerEl);
      }
    );

    if (this._layersGrps.size > 0) {
      const ctrlVals = {
        'filter': [
            '--Show All Layers--',
            '--Visible Layers--',
            ...Array.from(this._layersGrps)
          ].map(
            (v,i) => ({label: v, value: i < 2 ? {0: '', 1: 'true'}[i] : v})
          ),
        'sort': ['name','group','visible'].map(i => ({label: i}))
      };

      const fixId = (id: string | undefined) => id ? id.replace(/(_|\s|\&)/gi, '-').toLowerCase() : undefined;
      const toTitle = (str: string): string => str.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

      const _lyrsCtrl = document.createElement('form');
      _lyrsCtrl.className = 'layers-ctrl';
      _lyrsCtrl.innerHTML = ['filter','sort'].reduce((p, v, i) => {
          const vals: Array<{label: string; value?: boolean | string | number;}> = ctrlVals[v as 'filter'|'sort'];
          const fieldEls = i === 0
            ? '<select id="lyrs-filter">'+vals.map(e => `<option value="${e.value}">${e.label}</option>`).join('')+'</select>'
            : vals.map(e => `
                <input type="radio" id="lyrs-sort-${fixId(e.label)}" name="lyrs-sort" value="${e.label}" />
                <label for="lyrs-sort-${fixId(e.label)}">${toTitle(e.label)}</label>
             `).join('');

          return p + `
          <div class="input-field-group layers-${v} ${i === 0 ? 'full-width' : 'hide-input'}">
            <span class="map-btn --no-int bi bi-${this.icons[v as 'filter'|'sort']}"></span>
            ${fieldEls}
          </div>
          `;
        },
        ''
      );
      _lyrsCtrl.onchange = (e: any) => {
        const targetEl = e.target as HTMLElement;
        const action = String(targetEl.getAttribute('name') ?? targetEl.id).split('-')[1];
        const value = action === 'sort'
          ? ((e.currentTarget as HTMLFormElement).elements.namedItem('lyrs-sort') as RadioNodeList).value
          : (targetEl as HTMLSelectElement).value;

        if (action === 'filter') {
          const prop = `data-${['','true'].includes(value) ? 'visible' : 'group'}`;
          const lyrClass = (attr: string | null) => `layer${(value === '' || attr === value) ? '' : ' hidden'}`;
          document.querySelectorAll(`[${prop}]`).forEach(e => e.className = lyrClass(e.getAttribute(prop)));
        } else {
          _lyrsList.replaceChildren(
            ...Array.from(_lyrsList.children).sort(
              (a, b) => Number(a.getAttribute(`data-${value}`)! > b.getAttribute(`data-${value}`)! || -1) * Number(value !== 'visible' || -1)
            )
          );
        }
      };

      this._layersEl.prepend(_lyrsCtrl);
    }
  }

  makeLayerEl(lyr: BaseLayer): HTMLElement {
    const toTitle = (str: string): string => str.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');

    const _label = document.createElement('label');
    Object.assign(_label, {
      className: 'layer-label',
      htmlFor: lyr.getClassName() + '-toggle',
      innerHTML: `<span>${toTitle(lyr.getClassName())}</span><span class="group">${lyr.get('group')||''}</span>`
    });

    const _toggle = document.createElement('input');
    Object.assign(_toggle, {
      className: lyr.getClassName(),
      type: 'checkbox',
      id: lyr.getClassName() + '-toggle',
      name: lyr.getClassName(),
      title: 'Toggle Layer',
      checked: lyr.getVisible(),
      onclick: (e: MouseEvent) => {
        const layerEl = document.querySelector(`.layer[data-name="${lyr.getClassName()}"]`)!;
        lyr.setVisible(!lyr.getVisible());
        layerEl.setAttribute('data-visible', String(lyr.getVisible()));
        if (['VectorTileLayer','VectorLayer'].includes(lyr.get('lyrType'))) {
          const legend: HTMLElement = layerEl.querySelector('.legend')!;
          legend.style.display = !lyr.getVisible() ? 'none' : 'flex';
          if (lyr.getVisible() && !legend.hasChildNodes()) legend.appendChild(
            this.makeLegend(lyr.get('styleDetails'))
          );
        }
      }
    });

    const _infoBtn = document.createElement('button');
    Object.assign(_infoBtn, {
      className: 'layer-info map-btn --icon',
      type: 'button',
      title: lyr.getClassName() + ' More Info',
      innerHTML: `<span class="bi bi-${this.icons.info}"></span>`,
      onclick: (e: MouseEvent) => { alert(Object.entries(lyr.getProperties())); }
    });

    const _legend = document.createElement('div');
    _legend.className = 'legend';
    if (lyr.getVisible() && String(lyr.get('lyrType')).startsWith('Vector')) _legend.appendChild(
      this.makeLegend(lyr.get('styleDetails'))
    );

    const _layer = document.createElement('div');
    _layer.className = 'layer';
    _layer.append(_toggle, _label, _infoBtn, _legend);
    [lyr.getClassName(), lyr.get('group') || '', String(lyr.getVisible())].forEach(
      (e, i) => _layer.setAttribute(`data-${['name','group','visible'][i]}`, e)
    );

    return _layer;
  }

  private makeLegend<FT extends LyrConstants['feat-type']>(opts: {style: LyrConstants['style-type'], geom: FT, opts: LyrStyleOpts<any, any>}): HTMLTableElement {
    const base: FT extends 'Point' ? LyrConstants['Point-base'] : LyrConstants[FT] = opts.opts.base;
    const classes = Object.assign(
      {base: base},
      (opts.opts as LyrStyleOpts<'ramp-basic'|'ramp-special', any>).classes || {}
    );
    const get = <Init extends string|number> (row: any, prop: string, init: Init): Init => row[prop] || (base as any)[prop] || init;
    const makePatch: {[key: string]: (row: any) => string} = {
      'Point': (row: LyrConstants['Point'|'Point-base']) => get(row,'src','').startsWith('data:image/svg')
        ? get(row,'src','').slice(24).replace('fill:white;',`fill:${get(row,'fill','rgb(128,147,241)')};`)
        : `<img src="${get(row,'src','')}" />`,
      'Line': (row: LyrConstants['Line']) => {
        const styling = [
          `stroke:${this.reColor(get(row,'stroke',''))};stroke-width:20;`,
          `stroke:${get(row,'stroke','')};stroke-width:12;${row.strokeType === 'dashed' ? 'stroke-dasharray:45 20;' : ''}`
        ];

        return `
        <svg width="1em" height="0.5em" viewBox="0 0 200 100">
          ${styling.reduce(
            (p,v) => `${p}<path d="M15 85 Q 25 50 85 50 L115 50 Q175 50 185 15" style="fill:transparent;stroke-linecap:round;${v}" />`, ''
          )}
        </svg>`;
      },
      'Polygon': (row: LyrConstants['Polygon']) => {
        const styling = `fill:${get(row,'fill','transparent')};stroke:${get(row,'stroke','') || this.reColor(get(row,'fill','rgba(0,0,0,0)'))};${row.strokeType === 'dashed' ? 'stroke-dasharray:45 20;':''}`;

        return `
          <svg width="1em" height="0.5em" viewBox="0 0 200 100">
            <rect x="10" y="10" width="180" height="80" style="fill-opacity:0.7;stroke-width:10;${styling}" />
          </svg>
        `;
      }
    };

    const _newTable = document.createElement('table');
    _newTable.className = 'map-table legend';
    _newTable.innerHTML = Object.entries(classes).map(
      c => `<tr><td class="patch">${makePatch[opts.geom](c[1])}</td><td class="label">${c[1].label}</td></tr>`
    ).join('');

    return _newTable;
  }

  private reColor(color: string, opacity = 0.8): string {
    const isHex = color[0] === '#';
    // if 3 character hex string (i.e. #fff) make normal 6 character hex
    const _color = color.length === 4 ? color.split('').map((v,i) => i < 1 ? v : v + v).join('') : color;
    // separate 3 color channels into a string array
    const rgbRaw = isHex ? _color.slice(1).match(/.{2}/g)!.slice(0,3) : _color.replace(/[a-z\s\(\)]/ig,'').split(',', 3);
    const yiqVal = rgbRaw.reduce((s,v,i) => s + (parseInt(v, isHex ? 16 : 10) * [299, 587, 114][i]), 0) / 1000;
      // If the YIQ is above 128 then it's considered a bright color.
    return yiqVal >= 128 ? `rgba(100,100,100,${opacity})` : `rgba(245,245,245,${opacity})`;
  };

}
