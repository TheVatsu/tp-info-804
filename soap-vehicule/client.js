var soap = require('soap');
var url = 'http://127.0.0.1:8000/?wsdl';
var args = {};
soap.createClient(url, function(err, client) {
    client.get_vehicules(args, function(err, result) {
        console.log(result.get_vehiculesResult.data);
    });
})