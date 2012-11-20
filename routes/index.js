var redis = require('../myredis');
var db = require('../db');
var _ = require('underscore');
var moisturelogging = require('../moisturelogging');
var Q = require('q');
var util = require('../util');

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
  var data = null;
  console.log('the username', username);

  var deferred = Q.ncall(db.getUser, db, username)
  .then(function(_data) {
    data = _data;
  })
  //.then(util.promiseDelay(1000))
  .then(function() {
    response.render('showuser', {
      username: username,
      name: data.name,
      data: data,
      dataString: JSON.stringify(data)
    });
  }).fail(function(err) {
    console.log('failed for reason', err);
  });
};

exports.make_plant_for_user = function(request, response) {
  var username = request.param('username');

  db.getUser(username, function(err, data) {
    response.render('make_plant_for_user', {
      error: String(err),
      username: username,
      name: data.name,
      data: data,
      dataString: JSON.stringify(data)
    });
  });
};

exports.plant = function(request, response) {
  var plant_username = request.param('plantname');

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

exports.data_view = function(request, response) {
  var plant_username = request.param('plantname');

  moisturelogging.getRecentPlantData(plant_username, function(err, recentData) { 
    response.render('data_view', {
      plant_username: plant_username,
      recentData: JSON.stringify(recentData)
    });
  });
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

