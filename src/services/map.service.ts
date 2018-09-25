/// <reference types="@types/googlemaps" />
import {Injectable} from '@angular/core';
import {CrimeService} from './crime.service';
import * as MarkerClusterer from 'marker-clusterer-plus';
import {Crime} from '../models/crime';
import {CrimeMarker} from '../models/crime-marker';

@Injectable()

export class MapService {

  bounds: google.maps.LatLngBounds;
  lat = 51.5021934;
  lng = -0.1284072;
  map: google.maps.Map;
  markerClusterer: MarkerClusterer;
  markers: CrimeMarker[] = [];
  infowindow: google.maps.InfoWindow = new google.maps.InfoWindow({});
  crimes: Crime[];
  defaultFilter: any = {date: '2018-07', category: 'all-crime'};

  constructor(private crimeService: CrimeService) { }

  initMap(gmapElement): void {
    const mapProp = {
      center: new google.maps.LatLng(this.lat, this.lng),
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(gmapElement.nativeElement, mapProp);

    google.maps.event.addListener(this.map, 'idle', () => {
      this.bounds = this.map.getBounds();
      this.updateMap(this.defaultFilter);
    });
  }

  initClusterer(): void  {
    this.markerClusterer = new MarkerClusterer(this.map, this.markers,
      {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m', zoomOnClick: false});

    google.maps.event.addListener(this.markerClusterer, 'click', this.handleClusterInfo.bind(this));
  }

  updateMap(filter): void {
    this.crimeService.getCrimes(this.defineArea(), filter)
      .subscribe((crimes) => {
        this.crimes = crimes;
        this.updateMarkers();
      });
  }

  defineArea(): string {
    const bounds = this.bounds;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();

    return `${ne.lat()},${sw.lng()}:${ne.lat()},${ne.lng()}:${sw.lat()},${ne.lng()}:${sw.lat()},${sw.lng()}`;
  }

  updateMarkers(): void {
    for (let i = this.markers.length - 1; i >= 0; i--) {
      let isMarkerOutdated = true;
      for (let j = this.crimes.length - 1; j >= 0; j--) {
        if (this.crimes[j].id === this.markers[i].crime.id) {
          this.crimes.splice(j, 1);
          isMarkerOutdated = false;
          break;
        }
      }
      if (isMarkerOutdated) {
        this.removeMarker(this.markers[i]);
        this.markers.splice(i, 1);
      }
    }

    this.crimes.forEach((crime) => {
      this.markers.push(this.addMarker(crime));
    });

    console.log(this.crimes);
    console.log(this.markers);
  }

  addMarker(crime: Crime): CrimeMarker {
    const coords = new google.maps.LatLng(crime.location.latitude, crime.location.longitude);
    const marker: CrimeMarker = new CrimeMarker({
      position: coords,
      crime: crime
    });
    marker.addListener('click', () => {
      this.handleMarkerInfo(marker);
    });
    marker.setMap(this.map);
    if (this.markerClusterer) {
      this.markerClusterer.addMarker(marker);
    }
    return marker;
  }

  removeMarker(marker): void {
    if (this.markerClusterer) {
      this.markerClusterer.removeMarker(marker);
    }
    marker.setMap(null);
  }

  handleClusterInfo(cluster) {
    const markers = cluster.getMarkers();
    let content = '';
    markers.forEach((marker) => {
      content += this.createInfoString(marker.crime);
    });
    this.showInfowindow(content, cluster.getCenter());
  }

  handleMarkerInfo(marker) {
    this.infowindow.setContent(this.createInfoString(marker.crime));
    this.infowindow.open(this.map, marker);
  }

  showInfowindow(content, position) {
    this.infowindow.setContent(content);
    this.infowindow.setPosition(position);
    this.infowindow.open(this.map);
  }

  createInfoString(crime): string {
    const status = crime.status ? `${crime.status.name} / ${crime.status.date}` : `unavailable`;
    return `<div>
            <h1>${crime.category}</h1>
            <h2>Status:</h2>
            <p>${status}</p>
            </div>`;
  }

}
