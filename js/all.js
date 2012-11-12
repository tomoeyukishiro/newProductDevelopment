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

$(document).delegate('#dryPlantButton', 'click', function(ev) {
  var username = $(ev.srcElement).attr('data-username');
  $(ev.srcElement).fadeOut();
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
  $(ev.srcElement).fadeOut();
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
  $(ev.srcElement).fadeOut();
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
