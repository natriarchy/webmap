import { Control } from 'ol/control';
import { MapToast } from '../../classes/map-toast.class';
import { createElementWith, generatePointSVG } from '../../utils/fns-utility';

export class Fullscreen extends Control {
  name = 'fullscreen-toggle';
  ctrlBtn: HTMLButtonElement;
  constructor(
    options: {
      parentContainer: HTMLElement
    }) {
    super({ element: options.parentContainer });
    this.set('name', this.name);
    this.ctrlBtn = createElementWith(false, 'button', {
      title: 'Toggle Full Screen',
      class: 'webmap-btn ctrl fullscreen-toggle',
      'aria-label': 'Toggle Full Screen',
      innerHTML: generatePointSVG('fullscreen').outerHTML,
      onclick: this.handleClick.bind(this)
    });
    this.element.appendChild(this.ctrlBtn);

    document.addEventListener('fullscreenchange', (event) => {
        this.ctrlBtn.replaceChildren(generatePointSVG(document.fullscreenElement ? 'fullscreen-exit' : 'fullscreen'));
        this.ctrlBtn.title = `${document.fullscreenElement ? 'Exit' : 'Enter'} Fullscreen`;
    });
  }
  handleClick(event: MouseEvent): void {
    event.preventDefault();
    if (!document.fullscreenEnabled) {
        new MapToast({tone: 'warning', header: 'Device does not allow fullscreen.', timer: 'short'});
        return;
    }
    const isFullScreen: boolean = !!(
          this.checkObj(document,'webkitIsFullScreen') ||
          this.checkObj(document,'msFullscreenElement') ||
          document.fullscreenElement
    );
    isFullScreen
      ? this.exitFullScreen()
      : this.requestFullScreen(this.getMap()!.getTargetElement());
  }

  requestFullScreen(element: any): void {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if(element['msRequestFullscreen']) {
        element['msRequestFullscreen']();
    } else if(element['webkitRequestFullscreen']) {
        element['webkitRequestFullscreen']();
    }
  }
  exitFullScreen(): void {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.hasOwnProperty('msExitFullscreen')) {
      this.checkObj(document,'msExitFullscreen')();
    } else if (document.hasOwnProperty('webkitExitFullscreen')) {
      this.checkObj(document,'webkitExitFullscreen')();
    }
  }
  checkObj(obj: any, prop: string): any {
    return obj && obj.hasOwnProperty(prop) ? obj[prop] : undefined;
  }
}
