import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
  <app-map-view class="map-view" #map1></app-map-view>
  `,
  styles: [
    ':host { height: 100%; width: 100%;display: flex;}'
  ]
})
export class MainViewComponent {

}
