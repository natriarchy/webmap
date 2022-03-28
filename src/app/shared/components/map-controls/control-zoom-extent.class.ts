import { easeOut } from 'ol/easing';
import { fromExtent } from 'ol/geom/Polygon';
import Control from 'ol/control/Control';
import { createElementWith, generatePointSVG } from '../../utils/fns-utility';
import { BSIconOptions } from '../../utils/constants';

export class ZoomExtentGroup extends Control {
  buttonGrp: HTMLDivElement;
  buttonDetails: Array<{btnTitle: string, btnAddClass?: string, btnAriaLabel?: string, btnIcon: BSIconOptions; }>= [
    {btnTitle: 'Zoom In', btnAriaLabel: 'Plus Magnifying Glass Icon, Use to Increase Zoom', btnIcon: 'zoom-in'},
    {btnTitle: 'Reset View', btnAriaLabel: 'Home Icon, Use to Reset Map Zoom and Location', btnIcon: 'house'},
    {btnTitle: 'Zoom Out', btnAriaLabel: 'Minus Magnifying Glass Icon, Use to Decrease Zoom', btnIcon: 'zoom-out'}
  ];
  defaultExtent: [number, number, number, number] | undefined;
  constructor(
    options: {
      parentContainer: HTMLElement,
      defaultExtent?: [number, number, number, number]
    }) {
    super({
      element: options.parentContainer
    });
    this.defaultExtent = options.defaultExtent;
    this.buttonGrp = document.createElement('div');
    this.buttonGrp.className = 'control-grp zoom-extent-grp';
    this.buttonDetails.forEach(btn => {
      const newBtn = createElementWith(false, 'button', {
        title: btn.btnTitle,
        class: 'control-button',
        'aria-label': btn.btnAriaLabel,
        innerHTML: generatePointSVG(btn.btnIcon).outerHTML
      });
      newBtn.addEventListener(
        'click',
        this.handleClick.bind(this),
        false
      );
      this.buttonGrp.appendChild(newBtn);
    });
    this.element.appendChild(this.buttonGrp);
  }
  handleClick(event: MouseEvent): void {
    event.preventDefault();
    const btnTitle: string = (event.target as HTMLButtonElement).title;
    const view = this.getMap()!.getView();
    if (btnTitle === 'Reset View') {
      view.fit(
        fromExtent(this.defaultExtent!),
        {
          padding: [10,10,10,10],
          duration: 350,
          easing: easeOut
        });
    } else {
      const newZoom = view.getConstrainedZoom(view.getZoom()! + (btnTitle === 'Zoom In' ? 1 : -1));
      view.animate({
        zoom: newZoom,
        duration: 350,
        easing: easeOut
      });
    };
  }
}
