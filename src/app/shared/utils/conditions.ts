import { MapBrowserEvent } from "ol";
import { Condition } from "ol/events/condition";

// Custom Conditions to Handle Interactions

//// Check that event target is the map canvas or map overlay container (improves interaction smoothness)
export const isCanvas: Condition = (e: MapBrowserEvent<any>) => (e.originalEvent.target.tagName === 'CANVAS' || e.originalEvent.target.className === 'ol-overlay-container ol-selectable');
//// Check if the mousewheel is being used at all
export const isMWheel: Condition = (e: MapBrowserEvent<any>) => (e.originalEvent.button === 1 || e.originalEvent.which === 2 || e.originalEvent.buttons === 4);
//// Quickly check map object for special setting changes
export const checkSetting = (e: MapBrowserEvent<any>, setting: string): boolean => (e.map.get(setting) && e.map.get(setting) !== false);
