var TwilioClient = require('../node-twilio').Client;
var appModule = require('../app.js');
var db = require('../db');

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

exports.sendTextToUser = function(username, body, callback) {
  db.getUser(username, function(err, userData) {
    if (err) {
      callback(err);
      return;
    }
    if (!userData || !userData.phoneNumber) {
      callback('A phone number for that user doesnt exist!');
      console.log('WARNING no number for ', username);
      return;
    }
    var phoneNumber = userData.phoneNumber;

    phone.setup(function() {
      // now phone works
      var options = {};

      phone.sendSms(phoneNumber, body, options, function(reqParams, response) {
        console.log('sent text, req params');
        console.log(reqParams);
        console.log('response was');
        console.log(response);
        callback(null, response);
      });
    });
  });
}

