var TwilioClient = require('../node-twilio').Client;
var appModule = require('../app.js');
var db = require('../db');
var Q = require('q');

var MIN_TIME_TO_TEXT = 5 * 60; // 5 minutes

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
  var phoneNumber = null;

  Q.ncall(db.getUser, db, username)
  .then(function(userData) {
    if (!userData || !userData.phoneNumber) {
      console.log('WARNING no number for ', username);
      throw new Error('A phone number for that user doesnt exist!');
    }

    var last = userData.lastTexted;
    console.log('last texted', last);

    if (last) {
      var secondsSince = (new Date() - new Date(last)) / 1000;
      console.log('its been x seconds', secondsSince);
      if (secondsSince < MIN_TIME_TO_TEXT && userData.limitTexts) {
        throw new Error('too early im returning');
      }
    }

    phoneNumber = userData.phoneNumber;

    var deferred = Q.defer();
    phone.setup(deferred.resolve);
    return deferred.promise;
  })
  .then(function(str) {
    // now phone works
    var options = {};

    var deferred = Q.defer();
    phone.sendSms(phoneNumber, body, options, deferred.resolve);
    return deferred.promise;
  })
  .then(function(reqParams, response) {
    console.log('sent text, req params');
    console.log(reqParams);

    // here we split requests, because texting is only when plants are dry,
    // and there are no operations on userData. and we don't even block on
    // the texting anyways in the actual method. so this is hacky, but fine
    // for an MVP
    db.setUserLastTexted(username);

    callback(null, response);
  })
  .fail(function(err) {
    console.log("ERROR!!!:", err);
    callback(err);
  })
  .done();
}

