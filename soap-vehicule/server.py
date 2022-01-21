from spyne import Application, rpc, ServiceBase , AnyDict
from lxml import etree
from spyne.protocol.soap import Soap11
from spyne.server.wsgi import WsgiApplication

port = 3001
vehicule = {"data" : [
    {"name":"Tesla Model S","autonomy":560,"charge_time":"7H"},
    {"name":"Kia e-niro","autonomy":370,"charge_time":"10H30"},
    {"name":"Renault Zoe ZE50 R110","autonomy":315,"charge_time":"3H"},
    {"name":"BMW I4","autonomy":475,"charge_time":"8H45"}
    ]}
    

class Soap(ServiceBase):
    @rpc(_returns=AnyDict)
    def get_vehicules(ctx):
        return vehicule
application = Application([Soap], 'spyne.examples.hello.soap',in_protocol=Soap11(validator='lxml'),out_protocol=Soap11())
wsgi_application = WsgiApplication(application)


if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    server = make_server('127.0.0.1', port, wsgi_application)
    print("server is running on port : " + str(port))
    server.serve_forever()
