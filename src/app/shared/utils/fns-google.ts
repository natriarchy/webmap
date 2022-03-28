import { toLonLat } from 'ol/proj';

/**
 * Open Location in Google Street View with only Lat Long
 * @param LAT Numerical Latitude, in decimal degrees
 * @param LONG Numerical Longitude, in decimal degrees
 */
export function openStreetView(LAT: number, LONG: number): any {
    const latlon = toLonLat([LAT, LONG]);
    window.open(`https://www.google.com/maps?q=&layer=c&cbll=${latlon[1].toString()},${latlon[0].toString()}`, '_blank');
};

/**
 * Open Location as pin in Google Maps with only Lat Long
 * @param LAT Numerical Latitude, in decimal degrees
 * @param LONG Numerical Longitude, in decimal degrees
 */
export function openGoogleMaps(LAT: number, LONG: number): any {
  window.open(
    `https://www.google.com/maps/place/${
        getDMS(LAT, 'lat')
    }+${
        getDMS(LONG, 'lon')
    }/@${LAT.toString()},${LONG.toString()}`, '_blank');
}

const truncate = (n: number): number => n > 0 ? Math.floor(n) : Math.ceil(n);

function getDMS(dd: number, lonOrLat:'lat' | 'lon'): any {
  const hemisphere = /^[WE]|(?:lon)/i.test(lonOrLat)
      ? dd < 0
          ? 'W'
          : 'E'
      : dd < 0
          ? 'S'
          : 'N';

  const absDD = Math.abs(dd);
  const degrees = truncate(absDD);
  const minutes = truncate((absDD - degrees) * 60);
  const seconds = ((absDD - degrees - minutes / 60) * Math.pow(60, 2)).toFixed(2);
  const dmsArray = [degrees, minutes, seconds, hemisphere];

  return `${dmsArray[0]}°${dmsArray[1]}'${dmsArray[2]}"${dmsArray[3]}`;
}
