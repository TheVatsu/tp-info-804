
var vehicule = []
const apiKey = "AAPK020c96eefdfd42c28bb455760d3f2efazFdj0zWahCb9LTepXcAxN3SZC0GRV9Eyyt4iKdWU1iv01vLertpO3njj0qMNjKgu";

$( document ).ready(function() {
    const socket = io("https://carrera-info802.herokuapp.com/");//"http://localhost:3000" 
    let startCoords, endCoords;
    var nb_km = null;
    var nb_point = 0
    var current_point = 0;
    var array_borne = []
    var road_coordinates = []
    var range_borne = 3000
    socket.on("vehicule", (data) => {
      if(data.length > 0){
        $('#combo_box').text("")
        for (el in data){
              $('#combo_box').append("<option>"+ data[el].name +"</option>");
        }
        $('.autonomie').text(data[0].autonomy + "km")
        $('.charging_time').text(data[0].charge_time)
        vehicule = data
      }
    })
    socket.on("borne", (data) => {
      current_point++;
      var pourcent = Math.trunc(current_point/nb_point * 100)
      if(pourcent != 100){
        $(".loading").text("Bornes : " + pourcent + "%")
      }else{
        $(".loading").text("Les bornes rouges indiquent où vous devez vous rechargez")
      }
      for(let i in data){
        addPoint(data[i],false);
        array_borne.push(data[i])
      }
      if(current_point === nb_point){
        show_red_borne()
      }
    })

    $('#combo_box').on('change', function (e) {
      var el = vehicule.filter(el => el.name === this.value)[0];
      if(el != undefined){
            $('.autonomie').text(el.autonomy + "km")
            $('.charging_time').text(el.charge_time)
      }
  });

  socket.on("res_temps", (data) => {
     const decimal = parseFloat(data) % 1;
     const entire = parseInt(data).toFixed(0);
     const minuts = parseInt(decimal * 60);
     $('.temps_total').text(entire + " H " + minuts);
  });

  
  $("#bouton_temps").click(function(){
    var path = "national";
    var km = $('#nb_km').val();
    var el = vehicule.filter(el => el.name === $('#combo_box').val())[0];
    if(el != undefined && km != ''){
      if(($('#combo_box_road').val()) === "Autoroute"){
        path = "highway";
      }
      socket.emit(path,km,el.autonomy,parseInt(el.charge_time));
    }
  });



const map = new ol.Map({
  target: "map"
});

const view = new ol.View({

  center: ol.proj.fromLonLat([1.003208,48.186965]),

  zoom: 5
});
map.setView(view);

let startLayer, endLayer, routeLayer,layer_list;
function addCircleLayers() {

  startLayer = new ol.layer.Vector({
    style: new ol.style.Style({
      image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({ color: "white" }),
        stroke: new ol.style.Stroke({ color: "black", width: 2 })
      })
    })
  });
  map.addLayer(startLayer);
  endLayer = new ol.layer.Vector({
    style: new ol.style.Style({
      image: new ol.style.Circle({
        radius: 7,
        fill: new ol.style.Fill({ color: "black" }),
        stroke: new ol.style.Stroke({ color: "white", width: 2 })
      })
    })
  });

  map.addLayer(endLayer);

}

let currentStep = "start";

const geojson = new ol.format.GeoJSON({
  defaultDataProjection: "EPSG:4326",
  featureProjection: "EPSG:3857"
});

map.on("click", (e) => {

  const coordinates = ol.proj.transform(e.coordinate, "EPSG:3857", "EPSG:4326");
  const point = {
    type: "Point",
    coordinates
  };

  if (currentStep === "start") {
    startLayer.setSource(
      new ol.source.Vector({
        features: geojson.readFeatures(point)
      })
    );
    startCoords = coordinates;

    // clear endCoords and route if they were already set
    if (endCoords) {
      endCoords = null;

      endLayer.getSource().clear();
      routeLayer.getSource().clear();
      for(var i in layer_list){
        layer_list[i].getSource().clear()
      }

      document.getElementById("directions").innerHTML = "";
      document.getElementById("directions").style.display = "block";

    }

    currentStep = "end";
  } else {

    endLayer.setSource(
      new ol.source.Vector({
        features: geojson.readFeatures(point)
      })
    );
    endCoords = coordinates;
    currentStep = "start";
    
    updateRoute(startCoords, endCoords);

  }

});

function addRouteLayer() {
  routeLayer = new ol.layer.Vector({
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: "hsl(205, 100%, 50%)", width: 4, opacity: 0.6 })
    })
  });
  layer_list = []

  map.addLayer(routeLayer);
}

function updateRoute() {
  const authentication = new arcgisRest.ApiKey({
    key: apiKey
  });
  arcgisRest

    .solveRoute({
      stops: [startCoords, endCoords],
      authentication
    })

    .then((response) => {
      var coord = response.routes.geoJson.features[0].geometry.coordinates
      var listPoints= [startCoords,endCoords]
      for(var i = 0 ; i < coord.length ; i+= 30){
        listPoints.push(coord[i])
      }
      nb_point = listPoints.length
      current_point = 0
      array_borne = []
      road_coordinates = response.routes.geoJson.features[0].geometry.coordinates

      socket.emit("get_borne",listPoints,range_borne);
      nb_km = parseInt(response.routes.geoJson.features[0].properties.Total_Kilometers)
      $('#nb_km').val(nb_km)
      routeLayer.setSource(
        new ol.source.Vector({
          features: geojson.readFeatures(response.routes.geoJson)
        })
      );

      const directionsHTML = response.directions[0].features.map((f) => f.attributes.text).join("<br/>");
      document.getElementById("directions").innerHTML = directionsHTML;
      document.getElementById("directions").style.display = "block";

    })

    .catch((error) => {
      alert("There was a problem using the geocoder. See the console for details.");
      console.error(error);
    });

}

const basemapId = "ArcGIS:Navigation";
const basemapURL = "https://basemaps-api.arcgis.com/arcgis/rest/services/styles/" + basemapId + "?type=style&token=" + apiKey;
olms(map, basemapURL)
  .then(function (map) {
    addCircleLayers();

    addRouteLayer();

  });

function addPoint(point , isRed){
  if(!isRed){
    var layer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [
                new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([point[1], point[0]]))
                })
            ]
        })
    });
    layer_list.push(layer)
    map.addLayer(layer);
  }else{
    var layer = new ol.layer.Vector({
        source: new ol.source.Vector({
            features: [
                new ol.Feature({
                    geometry: new ol.geom.Point(ol.proj.fromLonLat([point[1], point[0]]))
                })
            ]
        }),style: new ol.style.Style({
          image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({color: 'red'}),
            stroke: new ol.style.Stroke({
              color: [0,0,0], width: 2
            })
          })
        })
    });
    layer_list.push(layer)
    map.addLayer(layer);
  }
}

//calcule la distance entre deux point gps
function distance(lat1, lon1, lat2, lon2, unit) {
	if ((lat1 == lat2) && (lon1 == lon2)) {
		return 0;
	}
	else {
		var radlat1 = Math.PI * lat1/180;
		var radlat2 = Math.PI * lat2/180;
		var theta = lon1-lon2;
		var radtheta = Math.PI * theta/180;
		var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
		if (dist > 1) {
			dist = 1;
		}
		dist = Math.acos(dist);
		dist = dist * 180/Math.PI;
		dist = dist * 60 * 1.1515;
		if (unit=="K") { dist = dist * 1.609344 }
		if (unit=="N") { dist = dist * 0.8684 }
		return dist;
	}
}

function road_distance(borne){
  var dist = 0
  var i = 0
  while (dist === 0 || distance(road_coordinates[i][1],road_coordinates[i][0],borne[0],borne[1],'K') > range_borne / 1000){
      dist += distance(road_coordinates[i][1],road_coordinates[i][0],road_coordinates[i+1][1],road_coordinates[i+1][0],'K')
      i++
      if(i === road_coordinates.length -1){break}
  }
  return dist
}


function show_red_borne(){
  var e = vehicule.filter(el => el.name === $('#combo_box').val())[0];
  if(e.autonomy < nb_km){
    var default_autonomy = e.autonomy * 0.8
    var autonomy = default_autonomy
    while(autonomy < nb_km){
      var closest = 0
      var best_dist = road_distance(array_borne[0])
      for(let i in array_borne){
        var dist = road_distance(array_borne[i])
        if( dist < autonomy && dist - autonomy > best_dist - autonomy ){
          best_dist = dist;
          closest = i
        }
      }
      addPoint(array_borne[closest],true)
      autonomy += default_autonomy
   }
   
  }
}
});