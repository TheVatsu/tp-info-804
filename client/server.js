var soap = require('soap');
const express = require('express');
const socketIO = require('socket.io');
const request = require('request');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express().use(express.static("public"))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));


const io = socketIO(server);

var url_soap = 'https://vehicule-soap.herokuapp.com/?wsdl';
var url_rest = 'https://rest-vehicule.herokuapp.com/';
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
    console.log(km + " " + autonomy + " " + loading_time)
    request(url_rest + 'highway?km='+km+'&autonomy='+autonomy+'&loading_time='+loading_time, function (error, response, body) {
       io.to(socket.id).emit("res_temps",body);
    });
  });

  socket.on('national',(km,autonomy,loading_time)=>{
    request(url_rest + 'national?km='+km+'&autonomy='+autonomy+'&loading_time='+loading_time, function (error, response, body) {
       io.to(socket.id).emit("res_temps",body);
    });
  });

});


