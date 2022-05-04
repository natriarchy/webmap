import FullScreen from "ol/control/FullScreen";

export class FullScreenCustom extends FullScreen {
  constructor(opts: {targetId?: string}) {
    super({
      label: createSVGIcon('fullscreen'),
      labelActive: createSVGIcon('fullscreen-exit')
    });
    const targetEl = document.getElementById(opts.targetId ?? 'controltb-top-left') || document.createElement('section');
    targetEl.id = opts.targetId || 'controltb-top-left';
    this.setTarget(targetEl);
    this.element.className = 'ol-unselectable ol-custom-control';

    function createSVGIcon(shape: 'fullscreen'|'fullscreen-exit'): any {
      const newElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const paths = {
        'fullscreen': `
        <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
        `,
        'fullscreen-exit': `
          <path d="M5.5 0a.5.5 0 0 1 .5.5v4A1.5 1.5 0 0 1 4.5 6h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5zm5 0a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 10 4.5v-4a.5.5 0 0 1 .5-.5zM0 10.5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 6 11.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zm10 1a1.5 1.5 0 0 1 1.5-1.5h4a.5.5 0 0 1 0 1h-4a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4z"/>
        `
      };
      newElement.innerHTML = paths[shape];
      Object.entries({
        'xmlns': 'http://www.w3.org/2000/svg',
        'viewBox': '0 0 16 16',
        'height': '1em',
        'width': '1em',
        'fill': 'currentColor',
        'stroke': 'none'
      }).forEach(i => newElement.setAttribute(i[0], i[1]));

      return newElement as SVGElement;
    };
  }
}
