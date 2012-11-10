$(document).delegate('#makebutton', 'click', function(ev) {
  var owner = $(ev.srcElement).attr('data-owner');
  var form_id = '#make_plant_form_' + owner;

  $(form_id).submit();
});

$(document).delegate('#deletebutton', 'click', function(ev) {
  var owner = $(ev.srcElement).attr('data-owner');
  var form_id = '#delete_form_' + owner;

  $(form_id).submit();
})

$(document).delegate('#deletePlantButton', 'click', function(ev) {
  var owner = $(ev.srcElement).attr('data-owner');
  var form_id = '#plantDeleteForm_' + owner;
  
  $(form_id).submit();
})

$(document).delegate('#dryPlantButton', 'click', function(ev) {
  var username = $(ev.srcElement).attr('data-username');
  // we need to make an ajax request
  $.get('/check_and_record', {
      moisture: 0,
      plant_username: username
    },
    function() {
      console.log(arguments);
  });

})


$(document).delegate('#signupbutton', 'click', function() {
  $('#signup').submit();
})
