var soap = require('soap');
const express = require('express');
const socketIO = require('socket.io');
const request = require('request');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express().use(express.static("public"))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));


const io = socketIO(server);

const url_soap = 'https://vehicule-soap.herokuapp.com/?wsdl';
const url_rest = 'https://rest-vehicule.herokuapp.com/';
const url_api_borne = 'https://opendata.reseaux-energies.fr/api/records/1.0/search/';
var args = {};
var vehicule = []
soap.createClient(url_soap, function(err, client) {
  client.get_vehicules(args, function(err, result) {
    vehicule = result.get_vehiculesResult.data;
    io.emit("vehicule",vehicule);
  });
});

io.on('connection',(socket)=>{
  io.to(socket.id).emit("vehicule",vehicule);

  socket.on('highway',(km,autonomy,loading_time)=>{
    request(url_rest + 'highway?km='+km+'&autonomy='+autonomy+'&loading_time='+loading_time, function (error, response, body) {
       io.to(socket.id).emit("res_temps",body);
    });
  });

  socket.on('national',(km,autonomy,loading_time)=>{
    request(url_rest + 'national?km='+km+'&autonomy='+autonomy+'&loading_time='+loading_time, function (error, response, body) {
       io.to(socket.id).emit("res_temps",body);
    });
  });

  socket.on('get_borne',(start,end,dist)=>{
    start = start +'';
    const long = start.split(",")[0];
    const lat = start.split(",")[1];
    request(url_api_borne + '?dataset=bornes-irve&q=&geofilter.distance='+long+'%2C+'+lat+'%2C+'+dist, function (error, response, body) {
      io.to(socket.id).emit("borne",body);
    });
  });

});


