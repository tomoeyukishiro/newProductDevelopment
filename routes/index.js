var redis = require('../myredis');
var db = require('../db');
var _ = require('underscore');

exports.index = function(request, response) {
  response.render('index');
};

exports.about = function(request, response) {
  response.render('about');
};

exports.signup = function(request, response) {
  response.render('signup', {error: ''});
};

exports.listusers = function(request, response) {
  
  db.getAllUsers(function(err, users) {
    var additionalMessage = '';
    if (!users) {
      users = [];
      additionalMessage = 'uh oh!! error:' + String(err);
    }

    response.render('listusers', {
      users: users,
      additionalMessage: additionalMessage
    });
  });
};

exports.user = function(request, response) {
  var username = request.param('username');
  console.log('the username', username);

  db.getUser(username, function(err, data) {
    response.send(JSON.stringify({
        error: err,
        username: username,
        data: data
    }));
  });
};


/************ Mobile ***********/
exports.mobile_home = function(request, response) {
  response.render('mobile_home', {});
};

exports.mobile_water_prompt = function(request, response) {
  var data = {
    username: request.param('username') || 'enter_a_user'
  };

  response.render('mobile_water_prompt', data);
};

exports.mobile_water_after = function(request, response) {
  response.render('mobile_water_after', {});
};

