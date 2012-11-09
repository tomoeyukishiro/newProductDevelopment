var TwilioClient = require('../node-twilio').Client;
var appModule = require('../app.js');

// grab the express app and port so twilio client doesnt make a new server
// which throws on heroku due to port binding
var app = appModule.app;
var port = appModule.port;
if (!port) {
  throw new Error('need port!');
}

var validPhones = exports.validPhones = {
  '14084559405': true, // peter
  '14258947762': true, // jill
  '19492957173': true, // justin?
  '14159370321': true // brian
};

var client = exports.client = new TwilioClient(
  'AC0097e3ebc6e9c4f7f1fc0fe963ef729c',
  'ac6b5d8f13c3f81753a613f623eb3d9a',
  'radiant-atoll-9524.herokuapp.com/',
  {
    express: app,
    port: port
  }
);
var phone = exports.phone = client.getPhoneNumber('+14085969236');

var userToPhone = exports.userToPhone = {
  peter: '14084559405',
  jill: '14258947762',
  peter_cottle: '14084559405',
  jill_schweitzer: '14258947762'
};

exports.sendTextToUser = function(username, body, callback) {
  if (!userToPhone[username]) {
    callback('A phone number for that user doesnt exist!');
    console.log('WARNING no number for ', username);
    return;
  }

  phone.setup(function() {
    // now phone works
    var phoneNumber = userToPhone[username];
    var options = {};

    phone.sendSms(phoneNumber, body, options, function(reqParams, response) {
      console.log('sent text, req params');
      console.log(reqParams);
      console.log('response was');
      console.log(response);
      callback(null, response);
    });
  });
}

