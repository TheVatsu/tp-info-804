var soap = require('soap');
const express = require('express');
const socketIO = require('socket.io');
const request = require('request');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express().use(express.static("public"))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));


const io = socketIO(server);

const URL_SOAP = 'https://vehicule-soap.herokuapp.com/?wsdl';
const URL_REST = 'https://rest-vehicule.herokuapp.com/';
const URL_BORNE = 'https://opendata.reseaux-energies.fr/api/records/1.0/search/';
var args = {};
var vehicule = []
soap.createClient(URL_SOAP, function(err, client) {
  client.get_vehicules(args, function(err, result) {
    vehicule = result.get_vehiculesResult.data;
    io.local.emit("vehicule",vehicule);
  });
});

io.on('connection',(socket)=>{
  io.to(socket.id).emit("vehicule",vehicule);

  socket.on('highway',(km,autonomy,loading_time)=>{
    request(URL_REST + 'highway?km='+km+'&autonomy='+autonomy+'&loading_time='+loading_time, function (error, response, body) {
       io.to(socket.id).emit("res_temps",body);
    });
  });

  socket.on('national',(km,autonomy,loading_time)=>{
    request(URL_REST + 'national?km='+km+'&autonomy='+autonomy+'&loading_time='+loading_time, function (error, response, body) {
       io.to(socket.id).emit("res_temps",body);
    });
  });

  socket.on('get_borne',(start,end,dist)=>{
    start = start +'';
    end = end + '';
    var long = start.split(",")[0];
    var lat = start.split(",")[1];
    request(URL_BORNE + '?dataset=bornes-irve&q=&rows=100&geofilter.distance='+long+'%2C+'+lat+'%2C+'+dist, function (error, response, body) {
      io.to(socket.id).emit("borne",filterBorne(body));
    });
    
    long = end.split(",")[0];
    lat = end.split(",")[1];
    request(URL_BORNE + '?dataset=bornes-irve&q=&rows=100&geofilter.distance='+long+'%2C+'+lat+'%2C+'+dist, function (error, response, body) {
      io.to(socket.id).emit("borne",filterBorne(body));
    });
  });

});


function filterBorne(data){
  var array = [];
  var d = JSON.parse(data);
  console.log(d.nhits);
  for(el in d.records){
    if(array.filter(e => e === d.records[el].fields.geo_point_borne).length === 0){
      array.push(d.records[el].fields.geo_point_borne);
    }
  }
  return array;
}

