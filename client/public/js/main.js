
var vehicule = []

$( document ).ready(function() {
    const socket = io("http://localhost:3000");//"https://carrera-info802.herokuapp.com/"

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

  socket.on("res_temps", (data) => {
     $('.temps_total').text(data);
  });

  
  $("#bouton_temps").click(function(){
    var path = "national";
    var km = $('#nb_km').val();
    var el = vehicule.filter(el => el.name === $('#combo_box').val())[0];
    if(el != undefined && km != ''){
      if(($('#combo_box_road').val()) === "Autoroute"){
        path = "highway";
      }
      socket.emit(path,km,el.autonomy,parseInt(el.charge_time));
    }
  });
    
});

