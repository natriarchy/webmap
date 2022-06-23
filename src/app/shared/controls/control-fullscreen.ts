import FullScreen from "ol/control/FullScreen";

const makeLabel = (className: string): HTMLSpanElement => {
  const newEl = document.createElement('span');
  newEl.className = className;
  return newEl;
};

export class FullScreenCustom extends FullScreen {
  readonly name = 'full-screen';
  readonly icons = {
    label: 'fullscreen',
    labelActive: 'fullscreen-exit'
  };
  constructor(opts?: {targetId?: string}) {
    super({
      label: makeLabel('bi bi-fullscreen'),
      tipLabel: 'Toggle Full Screen',
      labelActive: makeLabel('bi bi-fullscreen-exit')
    });
    const targetEl = document.getElementById(opts?.targetId || 'controltb-top-left') || document.createElement('section');
    targetEl.id = opts?.targetId || 'controltb-top-left';
    this.setTarget(targetEl);
    this.element.className = 'ol-unselectable ol-custom-control';
  }
}
