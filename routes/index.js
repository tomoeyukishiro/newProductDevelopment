var redis = require('../myredis');
var db = require('../db');
var _ = require('underscore');
var moisturelogging = require('../moisturelogging');
var Q = require('q');
var util = require('../util');

var generalFail = util.errorPage;

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
  
  Q.ninvoke(db, 'getAllUsers')
  .then(function(users) {
    response.render('listusers', {
      users: users,
      additionalMessage: ''
    });
  })
  .fail(generalFail(response))
  .done();
};

exports.listplants = function(request, response) {
  Q.ninvoke(db, 'getAllPlants')
  .then(function(plants) {
    response.render('listplants', {
      plants: plants
    });
  })
  .fail(generalFail(response))
  .done();
};

exports.user = function(request, response, username) {
  var username = request.param('username') || username;
  var data = null;
  console.log('the username', username);

  Q.ninvoke(db, 'getUser', username)
  .then(function(_data) {
    data = _data;
  })
  //.then(util.promiseDelay(300))
  .then(function() {
    response.render('showuser', {
      username: username,
      name: data.name,
      data: data,
      dataString: JSON.stringify(data)
    });
  })
  .fail(generalFail(response))
  .done();
};

exports.make_plant_for_user = function(request, response) {
  var username = request.param('username');

  Q.ncall(db.getUser, db, username)
  .then(function(data) {
    response.render('make_plant_for_user', {
      username: username,
      name: data.name,
      data: data,
      dataString: JSON.stringify(data)
    });
  })
  .fail(generalFail(response))
  .done();
};

exports.plant = function(request, response) {
  var plant_username = request.param('plantname');

  Q.ncall(db.getPlant, db, plant_username)
  .then(function(data) {
    response.render('showplant', {
      username: plant_username,
      name: data.name,
      dataString: JSON.stringify(data),
      data: data
    });
  })
  //.fail(generalFail(response))
  .done();
};

exports.data_view = function(request, response) {

  var plant_username = request.param('plantname');

  Q.ncall(moistureLogging.getRecentPlantData, moistureLogging, plant_username)
  .then(function(recentData) {
    response.render('data_view', {
      plant_username: plant_username,
      recentData: JSON.stringify(recentData)
    });
  })
  .fail(generalFail(response))
  .done();
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

