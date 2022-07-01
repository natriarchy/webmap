import Control from "ol/control/Control";
import OLObj from 'ol/Object';
import { Setting } from "../models";

export class ExportMap extends Control {
  readonly name = 'export-map';
  readonly icons = {
    ctrl: 'download'
  };
  _ctrlBtn: HTMLElement;
  _downloadEl: HTMLAnchorElement;
  constructor(opts?: { targetId?: string }) {
    super({ element: Object.assign(document.createElement('div'),{className: 'ol-unselectable ol-custom-control'}) });
    this.set('name', this.name);

    this._downloadEl = Object.assign(document.createElement('a'), {download: ''});
    this._downloadEl.style.display = 'none';

    this._ctrlBtn = Object.assign(document.createElement('button'), {
      title: 'Export Map to PNG',
      type: 'button',
      innerHTML: `<span class="bi bi-${this.icons['ctrl']}"></span>`,
      onclick: this.handleExport.bind(this)
    });

    this.element.append(this._ctrlBtn, this._downloadEl);
    const observer = new MutationObserver((m, o) => {
      if (document.querySelector('.ol-overlaycontainer-stopevent')) {
        const map = this.getMap()!;
        const settings: OLObj = map.get('settings');
        const settingObj: Setting<'button'> = {
          type: 'button',
          label: this._ctrlBtn.title,
          actions: {label: this._ctrlBtn.innerHTML},
          fnOpts: {type: 'click', fn: this._ctrlBtn.onclick!}
        };
        settings.set(this.name, settingObj);
        settings.changed();
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
  handleExport(e: any) {
    const map = this.getMap()!;
    map.once('rendercomplete', () => {
      const mapCanvas = document.createElement('canvas');
      const size = map.getSize()!;
      mapCanvas.width = size[0];
      mapCanvas.height = size[1];
      const mapContext = mapCanvas.getContext('2d');
      document.querySelectorAll('.ol-layers > div > canvas').forEach(el => {
        const canvas = el as HTMLCanvasElement;
        if (canvas.width > 0 && mapContext) {
          const opacity = canvas.parentElement?.style.opacity;
          mapContext.globalAlpha = opacity === '' ? 1 : Number(opacity);
          const transform = canvas.style.transform;
          // Get the transform parameters from the style's transform matrix
          const matrix: any = transform.match(/^matrix\(([^\(]*)\)$/)![1]
            .split(',')
            .map(Number);
          // Apply the transform to the export map context
          CanvasRenderingContext2D.prototype.setTransform.apply(mapContext, matrix as [DOMMatrix2DInit]);
          mapContext.drawImage(canvas, 0, 0);
        }
      });

      const date = new Date();
      const monthday = date.toLocaleDateString('en-US', {year: 'numeric', month: '2-digit', day: '2-digit'})
        .replace(/\//gi, '_')
        .slice(0, -5);
      const time = `T${date.toTimeString().slice(0,8).replace(/\:/gi,"")}`;
      const fileName = `Map_Export_${date.getFullYear()}_${monthday}_${time}.png`;
      if ((navigator as any).msSaveBlob) {
        // link download attribuute does not work on MS browsers
        (navigator as any).msSaveBlob((mapCanvas as any).msGetRegionContent(), fileName);
      } else {
        this._downloadEl.href = mapCanvas.toDataURL();
        this._downloadEl.setAttribute('download', fileName);
        this._downloadEl.click();
      };
    });
    map.renderSync();
    return;
  }
}
