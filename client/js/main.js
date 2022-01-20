$( document ).ready(function() {
    $.soap({
        url: 'http://127.0.0.1:8000/?wsdl',
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