/// <reference types="@types/googlemaps" />
import { Component, OnInit } from '@angular/core';
import { ViewChild } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

import { NavController, Events, AlertController, Platform } from 'ionic-angular';
import { SettingsPage } from '../settings/settings';

import * as MarkerClusterer from 'marker-clusterer-plus';

import {CrimeService} from '../../services/crime.service';
import {FilterService} from '../../services/filter.service';

import {Crime} from '../../models/crime';
import {CrimeMarker} from '../../models/crime-marker';

declare const navigator: any;
declare const Connection: any;

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {

  bounds: google.maps.LatLngBounds;
  lat = 51.5021934;
  lng = -0.1284072;
  map: google.maps.Map;
  markerClusterer: MarkerClusterer;
  markers: CrimeMarker[] = [];
  infowindow: google.maps.InfoWindow = new google.maps.InfoWindow({});
  crimes: Crime[];
  zoomMinSize = 15;
  isZoomBtnShown = false;

  constructor(
    public events: Events,
    public navCtrl: NavController,
    private alertCtrl: AlertController,
    private cd: ChangeDetectorRef,
    private crimeService: CrimeService,
    private filterService: FilterService,
    private platform: Platform) {

    events.subscribe('filter:set', () => {
      this.updateMap(this.filterService.getFilter());
    });
  }

  @ViewChild('gmap') gmapElement: any;

  ngOnInit() {
    this.platform.ready().then(() => {
      if (this.isNetworkAvailable()) {
        this.initMap(this.gmapElement);
        this.initClusterer();
      } else {
        this.showConnectionError();
      }
    })
  }

  isNetworkAvailable() {
    return navigator.connection.type !== Connection.NONE;
    // return true;
  }

  showConnectionError() {
    let alert = this.alertCtrl.create({
      title: 'Connection Status',
      subTitle: 'No network connection',
      buttons: ['ok']
    });
    alert.present();
  }

  openSettings() {
    this.navCtrl.push(SettingsPage);
  }

  initMap(gmapElement): void {
    const mapProp = {
      center: new google.maps.LatLng(this.lat, this.lng),
      zoom: 17,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    this.map = new google.maps.Map(gmapElement.nativeElement, mapProp);

    google.maps.event.addListener(this.map, 'idle', () => {
      this.bounds = this.map.getBounds();
      this.updateMap(this.filterService.getFilter());
    })
  }

  initClusterer(): void {
    this.markerClusterer = new MarkerClusterer(this.map, this.markers,
      {
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m',
        zoomOnClick: false
      });

    google.maps.event.addListener(this.markerClusterer, 'click', this.handleClusterInfo.bind(this));
  }

  updateMap(filter): void {
    // check zoom level to avoid getting too much data from API
    if (this.map.getZoom() >= this.zoomMinSize) {
      this.isZoomBtnShown = false;
      this.crimeService.fetchCrimes(this.defineArea(), filter)
        .subscribe((crimes) => {
          this.crimes = crimes;
          this.updateMarkers();
        });
    } else {
      this.markers.forEach((marker) => {this.removeMarker(marker)});
      this.markers = [];
      this.isZoomBtnShown = true;
    }
    this.cd.detectChanges();
  }

  zoomMap() {
    console.log('zoom!');
    this.map.setZoom(this.zoomMinSize);
    this.updateMap(this.filterService.getFilter());
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
      let marker = this.addMarker(crime);
      this.markers.push(marker);
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

