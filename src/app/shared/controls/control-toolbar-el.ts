import Control from "ol/control/Control";

export class ControlToolbarEl extends Control {
  constructor(opts: {
    position: 'top-left' | 'top'
  }) {
    super({
      element: Object.assign(document.createElement('section'),{id: `controltb-${opts.position}`})
    })
  }
  with(controls: Array<Control>): Array<Control> {
    controls.forEach(c => c.setTarget(this.element));
    return [this, ...controls];
  }
}
