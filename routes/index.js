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

exports.listplants = function(request, response) {
  db.getAllPlants(function(err, plants) {
    if (err) {
      plants = [];
    }
    response.render('listplants', {
      plants: plants
    });
  });
};

exports.user = function(request, response, username) {
  var username = request.param('username') || username;
  console.log('the username', username);

  db.getUser(username, function(err, data) {
    response.render('showuser', {
      error: err,
      username: username,
      name: data.name,
      data: data,
      dataString: JSON.stringify(data)
    });
  });
};

exports.plant = function(request, response) {
  var plant_username = request.param('plantname');
  console.log('the plantname', plant_username);

  db.getPlant(plant_username, function(err, data) {
    response.render('showplant', {
      error: err,
      username: plant_username,
      name: data.name,
      dataString: JSON.stringify(data),
      data: data
    });
  });
};


/************ Mobile ***********/
exports.mobile_home = function(request, response) {
  response.render('mobile_home', {});
};

exports.mobile_water_prompt = function(request, response) {
  var username = request.param('u');
  if (!username) {
    resposne.render('signup', {
      error: 'No username there!'
    });
  }
  db.getUserAndAllPlants(username, function(err, userData, plantDataMap) {
    console.log('rendering', arguments);
    var plantDatas = [];
    _.each(plantDataMap, function(plantData, key) {
      plantDatas.push(plantData);
    });

    var data = {
      username: username,
      userData: userData,
      userDataString: JSON.stringify(userData),
      plantDataMapString: JSON.stringify(plantDataMap),
      plantDatasString: JSON.stringify(plantDatas),
      plantDatas: plantDatas
    };

    response.render('mobile_water_prompt', data);
  });
};

exports.mobile_water_after = function(request, response) {
  response.render('mobile_water_after', {});
};

