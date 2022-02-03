
var vehicule = []
const apiKey = "AAPK020c96eefdfd42c28bb455760d3f2efazFdj0zWahCb9LTepXcAxN3SZC0GRV9Eyyt4iKdWU1iv01vLertpO3njj0qMNjKgu";

$( document ).ready(function() {
    const socket = io("http://localhost:3000");//"https://carrera-info802.herokuapp.com/"

    socket.on("vehicule", (data) => {
      $('#combo_box').text("")
      for (el in data){
            $('#combo_box').append("<option>"+ data[el].name +"</option>");
      }
      $('.autonomie').text(data[0].autonomy + "km")
      $('.charging_time').text(data[0].charge_time)
      vehicule = data
    })

    socket.on("borne", (data) => {
     console.log(data)
    })

    $('#combo_box').on('change', function (e) {
      var el = vehicule.filter(el => el.name === this.value)[0];
      if(el != undefined){
            $('.autonomie').text(el.autonomy + "km")
            $('.charging_time').text(el.charge_time)
      }
  });

  socket.on("res_temps", (data) => {
     $('.temps_total').text(data);
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

  center: ol.proj.fromLonLat([0.003208,43.186965]),

  zoom: 13
});
map.setView(view);

let startLayer, endLayer, routeLayer;
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
let startCoords, endCoords;

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

      document.getElementById("directions").innerHTML = "";
      document.getElementById("directions").style.display = "none";

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
    
    socket.emit("get_borne",startCoords, endCoords,400000);
    updateRoute(startCoords, endCoords);

  }

});

function addRouteLayer() {
  routeLayer = new ol.layer.Vector({
    style: new ol.style.Style({
      stroke: new ol.style.Stroke({ color: "hsl(205, 100%, 50%)", width: 4, opacity: 0.6 })
    })
  });

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

      routeLayer.setSource(
        new ol.source.Vector({
          features: geojson.readFeatures(response.routes.geoJson)
        })
      );

      const directionsHTML = response.directions[0].features.map((f) => f.attributes.text).join("<br/>");
      document.getElementById("directions").innerHTML = directionsHTML;
      document.getElementById("directions").style.display = "none";

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



});