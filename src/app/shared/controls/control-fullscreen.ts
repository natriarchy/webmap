import FullScreen from "ol/control/FullScreen";


export class FullScreenCustom extends FullScreen {
  readonly name = 'full-screen';
  readonly icons = {
    label: 'fullscreen',
    labelActive: 'fullscreen-exit'
  };
  constructor(opts?: {targetId?: string}) {
    super({
      label: Object.assign(document.createElement('span'), {className: 'bi bi-fullscreen'}),
      tipLabel: 'Toggle Full Screen',
      labelActive: Object.assign(document.createElement('span'), {className: 'bi bi-fullscreen-exit'})
    });
    const targetEl = document.getElementById(opts?.targetId || 'controltb-top-left') || document.createElement('section');
    targetEl.id = opts?.targetId || 'controltb-top-left';
    this.setTarget(targetEl);
    this.element.className = 'ol-unselectable ol-custom-control';
  }
}
