from flask import Flask, request
from flask_restful import Resource, Api

app = Flask(__name__)
api = Api(app)

highway_speed = 130
national_speed = 80

class welcome(Resource):
    def get(self):
        return "welcome in my api"

class highway(Resource):
    def get(self):
        km = int(request.args.get('km'))
        autonomy = int(request.args.get('autonomy'))
        loading_time = int(request.args.get('loading_time'))
        return km / highway_speed + int(km / autonomy) * loading_time

class national(Resource):
    def get(self):
        km = int(request.args.get('km'))
        autonomy = int(request.args.get('autonomy'))
        loading_time = int(request.args.get('loading_time'))
        return km / national_speed + int(km / autonomy) * loading_time

api.add_resource(welcome, '/')
api.add_resource(highway, '/highway')
api.add_resource(national, '/national')

if __name__ == '__main__':
    print("launching app...")
    app.run(debug=True)