$(document).delegate('#makebutton', 'click', function(ev) {
  var owner = $(ev.srcElement).attr('data-owner');
  var form_id = '#make_plant_form_' + owner;

  $(form_id).submit();
});

$(document).delegate('#deletebutton', 'click', function(ev) {
  var owner = $(ev.srcElement).attr('data-owner');
  var form_id = '#delete_form_' + owner;

  $(form_id).submit();
});

$(document).delegate('#deletePlantButton', 'click', function(ev) {
  var owner = $(ev.srcElement).attr('data-owner');
  var form_id = '#plantDeleteForm_' + owner;
  
  $(form_id).submit();
});

$(document).delegate('#setPlantMoistureButton', 'click', function(ev) {
  var plant_username = $(ev.srcElement).attr('data-username');
  var moisture = $(ev.srcElement).attr('data-moisture');

  $(ev.srcElement).animate({opacity: 0.3}, 700, 'swing')

  $.post('/change_plant', {
      moisture: moisture,
      plant_username: plant_username
    },
    function() {
      window.location.href = "/plant/" + plant_username;
  });
});

$(document).delegate('#dryPlantButton', 'click', function(ev) {
  var username = $(ev.srcElement).attr('data-username');
  $(ev.srcElement).animate({opacity: 0.3}, 700, 'swing')
  // we need to make an ajax request
  $.get('/check_and_record', {
      moisture: 0,
      plant_username: username
    },
    function() {
      // go there
      window.location.href = "/plant/" + username;
  });
});

$(document).delegate('#dryPlantButton', 'click', function(ev) {
  $(ev.srcElement).animate({opacity: 0.3}, 700, 'swing')
  var username = $(ev.srcElement).attr('data-username');
  // we need to make an ajax request
  $.post('/water_plant', {
      plant_username: username
    },
    function() {
      // go there
      window.location.href = "/plant/" + username;
  });
});

$(document).delegate('#toggleTextButton', 'click', function(ev) {
  $(ev.srcElement).animate({opacity: 0.3}, 700, 'swing')
  var username = $(ev.srcElement).attr('data-username');
  var value = $(ev.srcElement).attr('data-value');

  // we need to make an ajax request
  $.post('/toggle_text_limiting', {
      username: username,
      value: value
    },
    function() {
      // go there
      window.location.href = "/user/" + username;
  });
});


$(document).delegate('#signupbutton', 'click', function() {
  $('#signup').submit();
});
