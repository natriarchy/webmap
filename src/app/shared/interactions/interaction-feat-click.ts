import OLObj from 'ol/Object';
import { singleClick } from 'ol/events/condition';
import Feature from 'ol/Feature';
import Select from 'ol/interaction/Select';
import { SelectEvent } from 'ol/interaction/Select';
import { Layer, Vector as VectorLayer, VectorTile as VectorTileLayer } from 'ol/layer';
import { Stroke, Style } from 'ol/style';

export class FeatClickModal extends Select {
  activeModalEl: HTMLElement | undefined;
  constructor(opts: {selectLyrClass?: string, lyrTypeProp?: string}) {
    super({
      condition: (e) => {
        const checkCanvas = (e.originalEvent.target.tagName === 'CANVAS' || e.originalEvent.target.className === 'ol-overlay-container ol-selectable');
        const checkSetting = ((e.map.get('settings') as OLObj).get('AllowFeatureClickModal') !== false);

        return singleClick(e) && checkCanvas && checkSetting;
      },
      filter: (f,l) => ![(this.get('selectLyrClass') || 'click-selection'),'geolocation'].includes(l.getClassName()),
      hitTolerance: 10,
      style: null
    });
    this.set('selectLyrClass', opts.selectLyrClass || 'click-selection');
    this.set('lyrTypeProp', opts.lyrTypeProp || 'olLyrType');
    this.on('select', this.handleSelection.bind(this));
  }

  handleSelection(e: SelectEvent): void {
    const map = this.getMap();
    const _modalCtrl = this.getMap()!.get('modal-ctrl');
    _modalCtrl.destroy();
    let selectionLayer = map.getAllLayers().find(l => l.getClassName() === (this.get('selectLyrClass') || 'click-selection'))!;
    if (selectionLayer) map.removeLayer(selectionLayer);
    if (e.selected.length > 0) {
      const currentLayer = this.getLayer(e.selected[0]);
      const keyProp = currentLayer.get('styleDetails').opts.keyProp;
      _modalCtrl.launch({
        type: 'feature',
        header: String(e.selected[0].getId() || e.selected[0].get(keyProp)),
        subheader: currentLayer.getClassName(),
        content: Object.entries(e.selected[0].getProperties()),
        actions: [{
          label: '<span class="bi bi-zoom-in"></span>',
          title: 'Zoom to Feature',
          action: (e: MouseEvent) => { if (this.getFeatures().item(0)?.getGeometry()) this.getMap().getView().fit(this.getFeatures().item(0).getGeometry(),{maxZoom: 10}); }
        }]
      });
      selectionLayer = this.handleSelectionLyr(e.selected[0], currentLayer);
      map.addLayer(selectionLayer);
    }
  }

  private handleSelectionLyr(selectedFeat: Feature<any>, selectedLayer: Layer<any, any>): Layer<any, any> {
    const selectionStyle = (f: any) => f.getId() === selectedFeat.getId() ? new Style({stroke: new Stroke({color: 'rgba(0,255,255,0.7)', width: 4})}) : undefined;
    if (selectedLayer.get('lyrType') === 'VectorTileLayer') {
      return new VectorTileLayer({className: 'click-selection', renderMode: 'vector', source: selectedLayer.getSource(), style: selectionStyle, zIndex: 10});
    } else {
      return new VectorLayer({className: 'click-selection', source: selectedLayer.getSource(), style: selectionStyle, zIndex: 10});
    }
  }
}
