import {Crime} from './crime';

export class CrimeMarker extends google.maps.Marker {
  crime: Crime;

  constructor(options) {
    super(options);
    this.crime = options.crime;
  }

}
