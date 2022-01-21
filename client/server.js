var soap = require('soap');
const express = require('express');
const socketIO = require('socket.io');

const PORT = process.env.PORT || 3000;
const INDEX = '/index.html';

const server = express().use(express.static("public"))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));


const io = socketIO(server);

var url_soap = 'https://vehicule-soap.herokuapp.com/?wsdl';
var args = {};
var vehicule = []
soap.createClient(url_soap, function(err, client) {
  client.get_vehicules(args, function(err, result) {
    vehicule = result.get_vehiculesResult.data;
  });
});

io.on('connection',(socket)=>{
  //get vehicule
  socket.on('get_vehicules',()=>{
     io.to(socket.id).emit("vehicule",vehicule);
  });
});
