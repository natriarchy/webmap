import { Control } from 'ol/control';
import { createElementWith, generatePointSVG } from '../../utils/fns-utility';

export class Fullscreen extends Control {
  name = 'fullscreen-toggle';
  ctrlBtn: HTMLElement;
  fullScreenActive = false;
  events = [
    'fullscreenchange',
    'webkitfullscreenchange',
    'MSFullscreenChange'
  ];

  fullScreenEventType = {
      ENTERFULLSCREEN: 'enterfullscreen',
      LEAVEFULLSCREEN: 'leavefullscreen'
  };
  constructor(
    options: {
      parentContainer: HTMLElement
    }) {
    super({
      element: options.parentContainer
    });
    this.set('name', this.name);
    this.ctrlBtn = createElementWith(false, 'button', {
      title: 'Toggle Full Screen',
      class: 'control-button fullscreen-toggle',
      'aria-label': 'Toggle Full Screen',
      innerHTML: generatePointSVG('fullscreen').outerHTML
    });
    this.ctrlBtn.addEventListener(
      'click',
      this.handleClick.bind(this),
      false
    );
    this.ctrlBtn.setAttribute('data-tippy-content', this.isFullScreen() ? 'Exit fullscreen' : 'Enter fullscreen' + ' (F)');

    this.element.appendChild(this.ctrlBtn);

    document.addEventListener('fullscreenchange', (event) => {
        if(document.fullscreenElement) {
          (this.ctrlBtn as HTMLButtonElement).title = 'Exit fullscreen (F)';
        } else {
          (this.ctrlBtn as HTMLButtonElement).title = 'Enter fullscreen (F)';
        }
    });

    // window.addEventListener('keyup', (event) => {
    //     if(isShortcutKeyOnly(event, 'f')) {
    //         this.handleFullscreen();
    //     }
    // });
  }
  handleClick(event: MouseEvent): void {
    event.preventDefault();
    this.handleFullscreen();
  }

  handleFullscreen() {
      // if(!this.isFullScreenSupported()) {
      //     Toast.info({text: 'Fullscreen is not supported'});
      //     return;
      // }

      if(this.isFullScreen()) {
          this.exitFullScreen();
          this.ctrlBtn.replaceChildren(generatePointSVG('fullscreen'));
      } else {
          let element = this.getMap()!.getTargetElement();
          this.requestFullScreen(element);
          this.ctrlBtn.replaceChildren(generatePointSVG('fullscreen-exit'));

          // if(this.keys) {
          //     this.requestFullScreenWithKeys(element);
          // }else {
          // }
      }
  }

  // handleFullScreenChange() {
  //     if(this.isFullScreen()) {
  //         this.dispatchEvent(this.fullScreenEventType.ENTERFULLSCREEN);
  //     }else {
  //         this.dispatchEvent(this.fullScreenEventType.LEAVEFULLSCREEN);
  //     }

  //     this.getMap()!.updateSize();

  //     this.fullScreenActive = !this.fullScreenActive;
  //     this.ctrlBtn.classList.toggle('oltb-tool-button--active');
  // }


  isFullScreenSupported() {
      const body = document.body;

      return !!(
          this.checkObj(body,'webkitRequestFullscreen') ||
          (this.checkObj(body,'msRequestFullscreen') && this.checkObj(document,'msFullscreenEnabled')) ||
          (this.checkObj(body, 'requestFullscreen') && this.checkObj(document,'fullscreenEnabled'))
      );
  }

  isFullScreen() {
      return !!(
          this.checkObj(document,'webkitIsFullScreen') ||
          this.checkObj(document,'msFullscreenElement') ||
          document.fullscreenElement
      );
  }

  requestFullScreen(element: any) {
      if(element.requestFullscreen) {
          element.requestFullscreen();
      }else if(element['msRequestFullscreen']) {
          element['msRequestFullscreen']();
      }else if(element['webkitRequestFullscreen']) {
          element['webkitRequestFullscreen']();
      }
  }

  requestFullScreenWithKeys(element: any) {
      if (element['webkitRequestFullscreen']) {
          element['webkitRequestFullscreen']();
      } else {
          this.requestFullScreen(element);
      }
  }
  exitFullScreen(): void {
    if(document.exitFullscreen) {
        document.exitFullscreen();
    } else if (this.checkObj(document,'msExitFullscreen')) {
      this.checkObj(document,'msExitFullscreen')();
    } else if (document.hasOwnProperty('webkitExitFullscreen')) {
      this.checkObj(document,'webkitExitFullscreen')();
    }
  }
  checkObj(obj: any, prop: string) {
    return obj && obj.hasOwnProperty(prop) ? obj[prop] : undefined;
  }
}
