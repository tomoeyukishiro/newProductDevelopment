var redis = require('../myredis');
var db = require('../db');

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
  
  db.getUsers(function(err, users) {
    if (!users) {
      users = ['uh oh!! error:' + String(err)];
    }

    response.render('listusers', {
      users: users,
      additionalMessage: ''
    });
  });
};

