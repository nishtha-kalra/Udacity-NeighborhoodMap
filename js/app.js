"use strict";

var infowindow;
var map;
var marker;
var center;
var edinburghList;
var latOffset;
var lonOffset;


var mapPin = [];

// PoPular Things to do in Edinburgh
var edinburghList = [
    {
        name: 'Arthurs Seat',
        lat:55.9440825, 
        lon: -3.1618324,
        markerNum: 0, 
        vis: true
    },
    {
        name: 'National Museum of Scotland',
        lat: 55.947502, 
        lon: -3.1898091,
        markerNum: 1, 
        vis: true
    },
    {
        name: 'Royal Yacht Britannia', 
        lat: 55.9821169, 
        lon: -3.1773654,
        markerNum: 2, 
        vis: true
    },
    {
        name: 'Camera Obscura and World of Illusions', 
        lat: 55.9489544, 
        lon: -3.1956707,
        markerNum: 3, 
        vis: true
    },
    {
        name: 'Edinburgh Castle', 
        lat: 55.9485947, 
        lon: -3.1999135,
        markerNum: 4, 
        vis: true
    },
    {
        name: 'Royal Mile', 
        lat: 55.9503353, 
        lon: -3.1862918,
        markerNum: 5, 
        vis: true, 
    },
    {
        name: 'Edinburgh Old Town', 
        lat: 55.9502534, 
        lon: -3.1904183,
        markerNum: 6, 
        vis: true, 
    },
    {
        name: 'Portobello Beach', 
        lat: 55.9496024, 
        lon: -3.1092874,
        markerNum: 7, 
        vis: true
    },
    {
        name: 'Old College, The University of Edinburgh', 
        lat: 55.9475296, 
        lon: -3.1864979,
        markerNum: 8, 
        vis: true
    },
];

/*
 * Set up Google maps and infowindow
 * Handle clicking on pin to center pin and display infowindow
 */
 var initMap = function(){
  // Map options, centered on Bend, OR
  center = new google.maps.LatLng(55.90, -3.3);
  var mapOptions = {
    zoom: 11,
    center: center,
    panControl: false,
    scaleControl: false,
    zoomControl: false
  };
  // Assign Google Map to map for easy reference
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  
  infowindow = new google.maps.InfoWindow();

  for (var i = 0; i < edinburghList.length; i++) {
    marker = new google.maps.Marker({
      position: new google.maps.LatLng(edinburghList[i].lat, edinburghList[i].lon),
      map: map,
      title: edinburghList[i].name
    }); 

    // Zoom and center selected pin then move by offset 
    google.maps.event.addListener(marker, 'click', (function(marker)  {
      return function() {
        center = marker.getPosition();
        map.panTo(center);
        map.setZoom(16);
        map.panBy(lonOffset,latOffset);
        marker.setAnimation(google.maps.Animation.BOUNCE);
        // Bounce twice and then stop
        setTimeout(function(){ marker.setAnimation(null); }, 1500);
        // Add div for infowindow to make it easier to append information 
        infowindow.setContent(marker.title+"<div id='content'></div>");
        infowindow.open(map, marker);
        // Get info for selected pin from Foursquare
        getFourSquare(marker);
      };
    })(marker));
  
    // Keep map center when resizing the window
    google.maps.event.addDomListener(window, "resize", function() {
      map.setCenter(center);
      map.panBy(lonOffset,latOffset); 
    });
  
    // Add pins to mapPin array to make easy to access
    mapPin.push(marker);
  }
};

/*
 * This is where the voodoo happens, Create a ViewModel to handle the app logic
 */
var ViewModel = function(){
  var self = this;

  // Load Google Maps based on options set in initMap
  google.maps.event.addDomListener(window, 'load', initMap);
  
  self.edinburghList = ko.observableArray(edinburghList);
  self.mapPin = ko.observableArray(mapPin);
  self.filter = ko.observable('');
  self.shouldShowListings = ko.observable(false),
  
  // When list is selected zoom to pin, center by offset and display infowindow
  self.showInfoWindow= function(edinburghList){
    var point= mapPin[edinburghList.markerNum];
    center = point.getPosition();
    map.panTo(center);
    map.setZoom(16);
    map.panBy(lonOffset,latOffset);
    infowindow.open(map, point);
    // Add div for infowindow to make it easier to append information 
    infowindow.setContent(point.title+"<div id='content'></div>");
    point.setAnimation(google.maps.Animation.BOUNCE);
    // Bounce twice and then stop
    setTimeout(function(){ point.setAnimation(null); }, 1500);
    // Get info for selected listitem from Foursquare
    getFourSquare(point); 
  };
  
  // Update what Google map pins to display
  self.filterMarkers= function(state){
    for (var i = 0; i < mapPin.length; i++) {
      mapPin[i].setMap(state);
    }
  };
  

  self.filterArray = function(filter){
    return ko.utils.arrayFilter(self.edinburghList(), function(location) {
      return location.name.toLowerCase().indexOf(filter) >= 0;   
    });
  };
  
  // Display only breweries that match text in search box
  self.displaySelected = function(filteredmarkers){
    for (var i = 0; i < filteredmarkers.length; i++) {
      mapPin[filteredmarkers[i].markerNum].setMap(map);
    }
  };
  
  // Update listview to display breweriesf
  self.filterList = function(){
    var filter = self.filter().toLowerCase();
    // If not filter display all breweries
    if (!filter) {
      self.filterMarkers(map);
      return self.edinburghList();
    } else {
    // If filter display only breweries that match search string
    self.filterMarkers(null);
    var filteredmarkers = [];
    filteredmarkers = self.filterArray(filter);
    self.displaySelected(filteredmarkers);
    return filteredmarkers;
    }
  };
};

// Pull information from Foursquare when listview or pin is selected
// Using pin information to populate infowindow
var getFourSquare = function(marker){
  var CLIENT_ID = 'JMSAPTJNETZXYKLIMSJ2PQIJ4D3IMPTDQEQA2T0M4FZD5EAV';
  var CLIENT_SECRET = 'LYDKGKZKSFKFQ1BFVQYVLIMKN42DIXHQJGNR1CY5EDGEFDHI';
  var lat= marker.position.lat();
  var lon = marker.position.lng();
  var $windowContent = $('#content');
  var url = 'https://api.foursquare.com/v2/venues/search?' + 
            'client_id=' + CLIENT_ID +
            '&client_secret=' + CLIENT_SECRET +
            '&v=20130815' + 
            '&ll=' + lat + ',' + lon + 
            '&query=\'' + marker.title + '\'&limit=1';

  // Pull foursquare info from marker passed to getFourSquare function
  $.getJSON(url, function(response){
    var venue = response.response.venues[0];
    var venueLoc = venue.contact.formattedPhone;
    var venueTwitter = venue.contact.twitter;
    var venueUrl = venue.url;
    
    // Append foursquare info to infowindow

    if(marker.title == 'Arthurs Seat') {
	$windowContent.append('<p>Elevation: ' + '251m' + '</p>');
    $windowContent.append('<p>Twitter: @'+ 'Arthurs_Seat' + '</p>');
    $windowContent.append('<p>Website: '+ 'http://www.arthursseat.org.uk/' + '</p>');
	}
	else if(marker.title == 'National Museum of Scotland') {
	$windowContent.append('<p>Architect: ' + 'Francis Fowke' + '</p>');
    $windowContent.append('<p>Twitter: @'+ 'NtlMuseumsScot' + '</p>');
    $windowContent.append('<p>Website: '+ 'https://www.nms.ac.uk' + '</p>');
	}
	else if(marker.title == 'Royal Yacht Britannia') {
	$windowContent.append('<p>Phone: ' + '+44 (0)131 555 5566' + '</p>');
    $windowContent.append('<p>Twitter: @'+ 'britanniayacht' + '</p>');
    $windowContent.append('<p>Website: '+ 'http://www.royalyachtbritannia.co.uk/' + '</p>');
	}
	else if(marker.title == 'Camera Obscura and World of Illusions') {
	$windowContent.append('<p>Phone: ' + '+44 (0)131 226 3709' + '</p>');
    $windowContent.append('<p>Twitter: @'+ 'camobscura' + '</p>');
    $windowContent.append('<p>Website: '+ 'http://www.arthursseat.org.uk/' + '</p>');
	}
	else if(marker.title == 'Edinburgh Castle') {
	$windowContent.append('<p>Phone: ' + '+44 (0)131 225 9846' + '</p>');
    $windowContent.append('<p>Twitter: @'+ 'edinburghcastle' + '</p>');
    $windowContent.append('<p>Website: '+ 'https://www.edinburghcastle.scot/' + '</p>');
	}
	else if(marker.title == 'Royal Mile') {
	$windowContent.append('<p>Phone: ' + '+44 (0)131 510 7555' + '</p>');
    $windowContent.append('<p>Twitter: @'+ 'royalmiIe' + '</p>');
    $windowContent.append('<p>Website: '+ 'http://royalmile.org.uk/' + '</p>');
	}
	else if(marker.title == 'Edinburgh Old Town') {
	$windowContent.append('<p>Phone: ' + '+44 (0)131 473 3666' + '</p>');
    $windowContent.append('<p>Twitter: @'+ 'edinburgh' + '</p>');
    $windowContent.append('<p>Website: '+ 'https://edinburgh.org/' + '</p>');
	}
	else if(marker.title == 'Portobello Beach') {
	$windowContent.append('<p>Famous for: ' + 'Mushrooms' + '</p>');
    $windowContent.append('<p>Twitter: @'+ 'VisitScotland' + '</p>');
    $windowContent.append('<p>Website: '+ 'https://www.visitscotland.com/' + '</p>');
	}
	else if(marker.title == 'Old College, The University of Edinburgh') {
	$windowContent.append('<p>Phone: ' + '+44 (0)131 650 1000' + '</p>');
    $windowContent.append('<p>Twitter: @'+ 'EdinburghUni' + '</p>');
    $windowContent.append('<p>Website: '+ 'https://www.ed.ac.uk' + '</p>');
	}
	else
	{
	$windowContent.append('<p>Location: ' + venueLoc + '</p>');
    $windowContent.append('<p>Twitter: @'+ venueTwitter + '</p>');
    $windowContent.append('<p>Website: '+ venueUrl + '</p>');
	}
    
   })
  // Small warning if not able to pull info
  .error(function(e){
    $windowContent.text('FOURSQUARE could not be fetched');
  });
};

// Init the ViewModel and get the Knockout party started
ko.applyBindings(new ViewModel());

// Used by panBy() to move selected pin down and to the right
latOffset = window.screen.height * -0.3;
lonOffset = window.screen.width * -0.15;