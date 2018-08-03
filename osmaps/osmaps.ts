/**
 * IONIC Component to OSM - OpenStreetMaps
 * License: https://github.com/luizolivetti
 * Version: v 0.1 alpha (18/07/2018)
 * Developers: OER TECNOLOGIA LTDA
 *             Luiz Olivetti 
 *             Rico Olivetti
 *
 * Redistribution and use of this software in source and binary forms, with or
 * without modification, are permitted provided that the following conditions
 * are met:
 * 
 * 1 Redistributions of source code must retain the above copyright notice,
 *   this list of conditions and the following disclaimer.
 * 
 * 2 Redistributions in binary form must reproduce the above copyright notice,
 *   this list of conditions and the following disclaimer in the documentation
 *   and/or other materials provided with the distribution.
 * 
 * 3 Neither the name of OER TECNOLOGIA, OpenStreetMap, OSMnames and Maptiler 
 *   nor the names of its contributors may be used to endorse or promote products 
 *   derived from this software without specific prior written permission of 
 *   OER TECNOLOGIA, OpenStreetMap, OSMnames and Maptiler
 * 
 */

// default 
import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

// npm ol
import Map from 'ol/Map.js';
import View from 'ol/View.js';
import Feature from 'ol/Feature.js';
import Overlay from 'ol/Overlay.js';
import Point from 'ol/geom/Point.js';
import {defaults as defaultControls, FullScreen} from 'ol/control.js';
import VectorLayer from 'ol/layer/Vector.js';
import { fromLonLat } from 'ol/proj.js';
import { toLonLat } from 'ol/proj.js';
import VectorSource from 'ol/source/Vector.js';
import {Fill, Stroke, Style, Icon} from 'ol/style.js';
import TileLayer from 'ol/layer/Tile.js';
import OSM from 'ol/source/OSM.js';
import Geolocation from 'ol/Geolocation.js';


//imports 
import { ViewChild, NgZone } from '@angular/core';


// Provider
import { ConnectivityServiceProvider } from '../connectivity-service/connectivity-service';

/**
 *
 */
@Injectable()
export class OsmapsProvider {

    /**
     * Properties
     */
     
     // keys
     mapsKey      = '<SET YOUR MAPTILER MAPSKEY HERE>';
     geocodingKey = '<SET YOUR MAPTILER GEOCODE HERE>';

     // paths
     findLocation  = 'https://search.osmnames.org/BR/q/';
     styleLocation = 'https://maps.tilehosting.com/c/5e0b8937-df47-4ebe-b794-400a7855e258/styles/topo/style.json?key=';

     // others
     feature       : any;
     map           : any;
     view          : any;
     osmauto       : any; //autocomplete
     details       : any;
     mapElement    : any;
     popupElement  : any;
     pleaseConnect : any;
     places        : any;
     geolocation   : any;
     projection    : any;
 
    /**
     *
     */
    constructor(public connectivityService: ConnectivityServiceProvider, private http : Http)
    {
/*
        this.geolocation = new Geolocation({
                                              // enableHighAccuracy must be set to true to have the heading value.
                                              trackingOptions: {
                                                enableHighAccuracy: true
                                              },

                                              projection: this.view.getProjection()
                                            
                                            });
        console.log(this.geolocation);
*/
    }

    /**
     *
     */
	  initialize(mapElement: any, popupElement: any): Promise<any> {

	    this.mapElement   = mapElement;
      this.popupElement = popupElement;

	    return this.loadOSMaps();
	 
	  }     

	  /**
	   *
	   */
	   loadOSMaps() : Promise<any> {

			return new Promise((resolve) => {   	
			 
			 	if(this.connectivityService.isOnline()){

              this.map = new Map({
                controls: defaultControls().extend([
                  new FullScreen()
                ]),
                layers: [
                  new TileLayer({
                    source: new OSM()
                  })
                ],
                target: this.mapElement,
              });

              // start in rio de janeiro
              this.map.getView().setCenter(fromLonLat([-43.463989, -22.938034]));
              this.map.getView().setZoom(5);

          resolve(true);

			  }

		  });

	  }

     /**
      *
      */
      searchPlace(searchValue) {
        
        if(searchValue != "")
        {
          let path = this.findLocation + searchValue + '.js?key=' + this.geocodingKey;

          this.http.get(path, {}).map(res => res.json()).subscribe(items => { 
            this.places = items;
          });

        }

        if(typeof this.places == "undefined") 
          return null;
        else
          return this.places.results;

      }

     /**
      *
      */
      selectPlace(item) {

        var rank = item.place_rank;
        var zoom = Math.min(4 + Math.floor(rank / 2), 20);

        this.map.getView().setCenter(fromLonLat([item.lon, item.lat]));
        this.map.getView().setZoom(zoom);

        return item;

      }

      /**
       *
       */
       addMarker(item){

              let iconFeature = new Feature({
                geometry: new Point(fromLonLat([item.lon, item.lat])),
                name: item.name
              });

              let iconStyle = new Style({
                image: new Icon(/** @type {module:ol/style/Icon~Options} */ ({
                  anchor: [0.5, 46],
                  anchorXUnits: 'fraction',
                  anchorYUnits: 'pixels',
                  src: 'assets/icon/mapIcon.png'
                }))
              });     

              iconFeature.setStyle(iconStyle);

              let vectorSource = new VectorSource({
                features: [iconFeature]
              });

              let vectorLayer = new VectorLayer({
                source: vectorSource
              });

              // add layer on map
              this.map.addLayer(vectorLayer);

              // display popup on click
              this.map.on('click', function(evt) {

                let feature = this.forEachFeatureAtPixel(evt.pixel,
                  function(feature, layer) {
                    return feature;
                });

                let element = <HTMLElement>document.getElementById('popup');
                    element.classList.add('popup-location');
                    element.innerHTML = item.display_name.replace(/,/gi, '<br/>');

                let popupElement = new Overlay({
                    element: element,
                    positioning: 'bottom-center',
                    stopEvent: false,
                    offset: [0, -50],
                    autoPan: true,
                    autoPanAnimation: {
                      duration: 250
                    }                  
                });

                this.addOverlay(popupElement);

                if (feature) {
                    let coordinates = feature.getGeometry().getCoordinates();
                    popupElement.setPosition(coordinates);
                } else {
                    // to-do something
                }
              });


       }

}
