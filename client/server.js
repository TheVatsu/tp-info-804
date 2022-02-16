'use strict'

var soap = require('soap');
const express = require('express');
const socketIO = require('socket.io');
const axios = require('axios');

const PORT = process.env.PORT || 3000;

const server = express().use(express.static("public"))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));


const io = socketIO(server);

const config = require("./config.json")
const URL_SOAP = 'https://vehicule-soap.herokuapp.com/?wsdl';
const URL_REST = 'https://rest-vehicule.herokuapp.com/';
const URL_BORNE = 'https://opendata.reseaux-energies.fr/api/records/1.0/search/?'+config.BORNE_KEY;
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
    axios.get(URL_REST + 'highway?km='+km+'&autonomy='+autonomy+'&loading_time='+loading_time).then( function (response) {
       io.to(socket.id).emit("res_temps",response);
    });
  });

  socket.on('national',(km,autonomy,loading_time)=>{
    axios.get(URL_REST + 'national?km='+km+'&autonomy='+autonomy+'&loading_time='+loading_time).then( function (response) {
       io.to(socket.id).emit("res_temps",response);
    });
  });

  socket.on('get_borne',async (list,dist)=>{
    for(var i = 0; i < list.length ; i++){
      var p = list[i]+''
      var long = p.split(",")[0]
      var lat = p.split(",")[1]
      
     axios.get(URL_BORNE + '&dataset=bornes-irve&q=&rows=4&geofilter.distance='+lat+'%2C+'+long+'%2C+'+dist).then(function(response){ 
      var array = []    
      for(var el in response.data.records){
        if(array.filter(e => e[0] === response.data.records[el].fields.geo_point_borne[0] && e[1] === response.data.records[el].fields.geo_point_borne[1] ).length === 0){
          array.push(response.data.records[el].fields.geo_point_borne);
        }
      }
      io.to(socket.id).emit("borne",array);
     })

    }
  });

});

