import { easeOut } from 'ol/easing';
import { fromExtent } from 'ol/geom/Polygon';
import Control from 'ol/control/Control';

export class ZoomExtent extends Control {
  readonly name = 'zoom-extent-grp';
  readonly icons = {
    'Zoom In': 'zoom-in',
    'Reset View': 'house',
    'Zoom Out': 'zoom-out'
  };
  _buttons: Array<HTMLElement>;
  defaultExtent: [number, number, number, number] | undefined;
  constructor(opts: {
      targetId?: string,
      defaultExtent?: [number, number, number, number]
    }) {
    super({ element: document.createElement('div') });
    this.set('name', this.name);
    this.defaultExtent = opts.defaultExtent;

    this._buttons = Object.entries(this.icons)
      .filter(b => opts.defaultExtent ? true : b[0] !== 'Reset View')
      .map(b => {
        const _btn = document.createElement('button');
        _btn.title = b[0];
        _btn.setAttribute('type', 'button');
        _btn.innerHTML = `<span class="bi bi-${b[1]}"></span>`;
        _btn.onclick = this.handleClick.bind(this);

        return _btn;
      });

    this.element.className = 'ol-unselectable ol-custom-control';
    this.element.append(...this._buttons);
  }
  handleClick(e: MouseEvent): void {
    e.preventDefault();
    const btnTitle: string = (e.target as HTMLButtonElement).title;
    const view = this.getMap()!.getView();
    if (btnTitle === 'Reset View' && this.defaultExtent) {
      view.fit(
        fromExtent(this.defaultExtent),
        {
          padding: [10,10,10,10],
          duration: 250,
          easing: easeOut
        });
    } else {
      const newZoom = view.getConstrainedZoom(view.getZoom()! + (btnTitle === 'Zoom In' ? 1 : -1));
      view.animate({
        zoom: newZoom,
        duration: 250,
        easing: easeOut
      });
    };
  }
}
