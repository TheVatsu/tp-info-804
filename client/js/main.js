$( document ).ready(function() {
    $.soap({
        url: 'https://vehicule-soap.herokuapp.com/?wsdl',
        method: 'get_vehicules',
    
        data: {},
    
        success: function (soapResponse) {
           alert(soapResponse)
        },
        error: function (SOAPResponse) {
            alert(SOAPResponse)
        }
    })
});