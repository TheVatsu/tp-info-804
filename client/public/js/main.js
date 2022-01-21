
var vehicule = []

$( document ).ready(function() {
    const socket = io("https://carrera-info802.herokuapp.com/");//  "http://localhost:3000"
    socket.emit("get_vehicules");

    socket.on("vehicule", (data) => {
      $('#combo_box').text("")
      for (el in data){
            $('#combo_box').append("<option>"+ data[el].name +"</option>");
      }
      $('.autonomie').text(data[0].autonomy + "km")
      $('.charging_time').text(data[0].charge_time)
      vehicule = data
    })

    $('#combo_box').on('change', function (e) {
      var el = vehicule.filter(el => el.name === this.value)[0];
      if(el != undefined){
            $('.autonomie').text(el.autonomy + "km")
            $('.charging_time').text(el.charge_time)
      }
  });
    
});

