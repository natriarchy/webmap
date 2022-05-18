import { easeOut } from 'ol/easing';
import { fromExtent } from 'ol/geom/Polygon';
import Control from 'ol/control/Control';
import { generatePointSVG } from '../utils/fns-utility';
import { BSIconOptions } from '../utils/constants';

export class ZoomExtentGroup extends Control {
  readonly name = 'zoom-extent-grp';
  buttons_: Array<HTMLElement>;
  buttonDetails: Array<[string, string]> = [
    ['Zoom In', 'zoom-in'],
    ['Reset View', 'house'],
    ['Zoom Out', 'zoom-out']
  ];
  defaultExtent: [number, number, number, number] | undefined;
  constructor(opts: {
      targetId?: string,
      defaultExtent?: [number, number, number, number]
    }) {
    super({ element: document.createElement('div') });
    this.set('name', this.name);
    this.defaultExtent = opts.defaultExtent;

    this.buttons_ = this.buttonDetails
      .filter(b => opts.defaultExtent ? true : b[0] !== 'Reset View')
      .map(b => {
        const button_ = document.createElement('button');
        button_.title = b[0];
        button_.setAttribute('type', 'button');
        button_.appendChild(generatePointSVG(b[1] as BSIconOptions, false));
        button_.onclick = this.handleClick.bind(this);

        return button_;
      });

    this.element.className = 'ol-unselectable ol-custom-control';
    this.buttons_.forEach(b => this.element.appendChild(b));
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
