/*
 *  OpenStreetMap.de - Webseite
 *	Copyright (C) Pascal Neis, 2011
 *
 *	This program is free software; you can redistribute it and/or modify
 *	it under the terms of the GNU AFFERO General Public License as published by
 *	the Free Software Foundation; either version 3 of the License, or
 *	any later version.
 *
 *	This program is distributed in the hope that it will be useful,
 *	but WITHOUT ANY WARRANTY; without even the implied warranty of
 *	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *	GNU General Public License for more details.
 *
 *	You should have received a copy of the GNU Affero General Public License
 *	along with this program; if not, write to the Free Software
 *	Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 *	or see http://www.gnu.org/licenses/agpl.txt.
 */
 
/**
 * Title: geocode.js
 * Description: JS file for geocoding
 *
 * @author Pascal Neis, pascal@neis-one.org 
 * @version 0.1 2011-10-29
 */

//======================
// OBJECTS
// var HOST_GEOCODE_URL = 'http://open.mapquestapi.com';
// var GEOCODE_POST = HOST_GEOCODE_URL + '/nominatim/v1/search?format=json&json_callback=showResultsGeocode';
var GEOCODE_POST =  'https://nominatim.openstreetmap.org/search.php?format=json&json_callback=showResultsGeocode';
var searchType = 'search';

//======================
// FUNCTIONS
/*
 * geocodeAddress()-Function to read out textfield and check if it is a cordinate, if not send request to a OSM nominatim geocoder
 */
function geocodeAddress(){
        var freeform = document.getElementById('tfSearch').value;
        var query_1 = /[NS]\s*(\d{2,})°\s+(\d{2}\.\d{3,})\s+[EW]\s*(\d{1,})°\s+(\d{2}\.\d{3,})/;
	var query_2 = /(\d+)\.(\d.+)\s+(\d+)\.(\d+)/;
        var query_3 = /[NS]\s*(\d{1,})°\s*(\d{2,})'\s*(\d{1,}\.\d{2,})"\s*[EW]\s*(\d{1,})°\s*(\d{2,})'\s*(\d{1,}\.\d{2,})"/
        if (query_1.test(freeform) == true){
			query_1.exec(freeform);
			var latitude = parseFloat(RegExp.$1) + parseFloat(RegExp.$2)/60;
			var longtitude = parseFloat(RegExp.$3) + parseFloat(RegExp.$4)/60;
			setMarkerAndZoom(new OpenLayers.LonLat(longtitude,latitude));
        }
        else if (query_3.test(freeform) == true){
                        query_3.exec(freeform);
                        console.log(RegExp.$1, RegExp.$2,RegExp.$3,RegExp.$4,RegExp.$5,RegExp.$6);
                        var latitude = ((parseFloat(RegExp.$3))/60 + parseFloat(RegExp.$2))/60 + parseFloat(RegExp.$1);
                        var longtitude = (((parseFloat(RegExp.$6))/60 + parseFloat(RegExp.$5))/60) + parseFloat(RegExp.$4);
			setMarkerAndZoom(new OpenLayers.LonLat(longtitude,latitude));
        }
	else if (query_2.test(freeform) == true){
			query_2.exec(freeform);
			var latitude = RegExp.$1 + "." + RegExp.$2;
			var longtitude = RegExp.$3 + "." + RegExp.$4;
			setMarkerAndZoom(new OpenLayers.LonLat(longtitude,latitude));
	}
	else {
			document.getElementById('information').style.visibility = 'visible';
			document.getElementById('information').innerHTML =  '<p class="infoHL">Einen Moment bitte ...</p>';

			var newURL = GEOCODE_POST + "&q="+freeform;
			var script = document.createElement('script');
			script.type = 'text/javascript';
			script.src = newURL;
			document.body.appendChild(script);
	}
}

/*
 * showResultsGeocode()-Function to show the geocode result in a div
 */
function showResultsGeocode(response) {
	openSlide('slider');
	
    var html = '';    
    var lonlat = '';
	
	if(response){
		html += '<table width="190px">'
		html += ' <tr class="infoHL"><td colspan="2">Ergebnis der Adresssuche:</td></tr>';
		
		for(var i=0; i < response.length; i++){
			var result = response[i]; var resultNum = i+1;			
        	//odd or even ?
        	var rowstyle='geocodeResultOdd';
        	if(i%2==0){ rowstyle='geocodeResultEven'; }
        	
			html += '<tr class="'+rowstyle+'">';
			html += '<td align="right" valign="top"><span class="routeSummarybold">'+resultNum+'.</span></td>';
			html += '<td class="'+rowstyle+'">';
			if (result.class && result.type && result.class in geocoder_searchtypes &&
			       geocoder_searchtypes[result.class][result.type] != undefined) {
				html += geocoder_searchtypes[result.class][result.type] + ' ';
			}
			if(result.display_name){
				var new_display_name = result.display_name;//.replace(/,/g, ",<br />")
				html += '<a href="#" onclick="javascript:setMarkerAndZoom(new OpenLayers.LonLat('+result.lon+','+result.lat+'));">'+new_display_name.trim()+'</a>';
			}
			html += '</td><td>';
			if(result.icon){
				html += '<img src="' + result.icon + '">';
			}
			html += "</td></tr>";
			
			if(lonlat == ''){
				lonlat = new OpenLayers.LonLat(result.lon,result.lat);
			}
		}		
		html += '</table>';

		if(lonlat != ''){ setMarkerAndZoom(lonlat); }
		else{ html = '<br><br>Sorry, keine entsprechende Adresse gefunden!'; }
	}
	
    
    switch (searchType) {
		case "search":
			document.getElementById('information').style.display = "";
			document.getElementById('information').innerHTML = html;
			break;
	}
}

/*
 * setMarkerAndZoom()-Function to set a marker on the map and zoom
 */
function setMarkerAndZoom(lonlat){
	setMarker(lonlat);
	
	//Hack - FIXME !
	lonlat.lon -= 450;
	//Set Center with Zoom
	map.setCenter(lonlat, 15);
}

/*
 * setMarker()-Function to set a marker on the map
 */
function setMarker(lonlat){
	markername = "GeocodedAddres";
	lonlat.transform(proj4326, projmerc);
	for(var i= 0; i<markersLayer.features.length; i++){
		if(markersLayer.features[i].name == markername){ markersLayer.removeFeatures([markersLayer.features[i]]); }	
	}
	var point = new OpenLayers.Feature.Vector(new OpenLayers.Geometry.Point(lonlat.lon, lonlat.lat));
	point.attributes = { icon: "img/marker.png" };
		
	point.name = "GeocodedAddres";
	markersLayer.addFeatures([point]);
}

/*
 * Helper function
 */
function checkReturn(textfieldname,e){
	var evt = e || window.event;
	if(!evt){ return; }
		
	var key = 0;
	if (evt.keyCode) { key = evt.keyCode; } 
	else if (typeof(evt.which)!= 'undefined') { key = evt.which; } 
	if( key == 13 && textfieldname=='geocode'){ geocodeAddress(); return; }
}
