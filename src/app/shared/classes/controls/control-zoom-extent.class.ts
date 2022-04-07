import { easeOut } from 'ol/easing';
import { fromExtent } from 'ol/geom/Polygon';
import Control from 'ol/control/Control';
import { createElementWith, generatePointSVG } from '../../utils/fns-utility';
import { BSIconOptions } from '../../utils/constants';

export class ZoomExtentGroup extends Control {
  name = 'zoom-extent-grp';
  buttonGrp: HTMLDivElement;
  buttonDetails: Array<{btnTitle: string, btnAriaLabel: string, btnIcon: string;}>= [
    {btnTitle: 'Zoom In', btnAriaLabel: 'Plus Magnifying Glass Icon, Use to Increase Zoom', btnIcon: 'zoom-in'},
    {btnTitle: 'Reset View', btnAriaLabel: 'Home Icon, Use to Reset Map Zoom and Location', btnIcon: 'house'},
    {btnTitle: 'Zoom Out', btnAriaLabel: 'Minus Magnifying Glass Icon, Use to Decrease Zoom', btnIcon: 'zoom-out'}
  ];
  defaultExtent: [number, number, number, number];
  constructor(
    options: {
      parentContainer: HTMLElement,
      defaultExtent: [number, number, number, number]
    }) {
    super({  element: options.parentContainer });

    this.set('name', this.name);
    this.defaultExtent = options.defaultExtent;

    const ctrlBtns = this.buttonDetails.map(btn => createElementWith(false, 'button', {
      type: 'button',
      title: btn.btnTitle,
      class: 'webmap-btn ctrl grouped',
      'aria-label': btn.btnAriaLabel,
      innerHTML: generatePointSVG(btn.btnIcon as BSIconOptions).outerHTML,
      onclick: this.handleClick.bind(this)
    }));

    this.buttonGrp = createElementWith(false, 'div', { class: 'control-grp zoom-extent-grp', children: ctrlBtns });

    this.element.appendChild(this.buttonGrp);
  }
  handleClick(event: MouseEvent): void {
    event.preventDefault();
    const btnTitle: string = (event.target as HTMLButtonElement).title;
    const view = this.getMap()!.getView();
    if (btnTitle === 'Reset View') {
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
