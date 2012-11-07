var _ = require('underscore');
var redis = require('../myredis').redis;
// make available for low level stuff
exports.redis = redis;

/***** import globals *********
 * user_id // user id
 * users // list of users
 */
var VALID_USERNAME_REGEX = /^[a-zA-_Z0-9.]+$/;

var USERS = 'users';
var USER_ID = 'user_id';
var getUserID = exports.getUserID = function(name) {
  var userID = name.toLowerCase().replace(' ', '_');
  return userID;
};

var PLANTS = 'plants';
var PLANT_ID = 'plant_id';
var PLANT_ID_PREPEND = 'plant-';
var PLANT_DATA_PREPEND = 'data-of-';

var getPlantID = exports.getPlantID = function(name) {
  return PLANT_ID_PREPEND + name.toLowerCase().replace(' ', '_');
};

var getPlantDataID = exports.getPlantDataID = function(plantID) {
  return PLANT_DATA_PREPEND + plantID;
};

var getPlantDataName = function(name) {
  return getPlantDataID(getPlantID(name));
};

var USER_SCHEMA = {
  lastTexted: null,
  lastWatered: null,
  plants: [],
  userID: null,
  createTime: null,
  name: null
};

var PLANT_SCHEMA = {
  name: null,  // display name
  owner: null, // username of owner
  id: null,    // actual id. this is prepended by PLANT_ID_PREPEND
  shouldWater: false // boolean if we should water,
  plantID: null,
  createTime: null
};


// now some functions
var makeUser = exports.makeUser = function(name, metadata, callback) {
  var username = getUserID(name);
  if (!username || !username.length) {
    callback('empty username!');
  }
  console.log('name is', name, 'username', username);

  if (!VALID_USERNAME_REGEX.test(username)) {
    callback('bad username!');
  }

  // test if it exists
  redis.sismember(USERS, username, function(err, result) {
    if (err) {
      callback(err);
      return;
    }
    if (result) {
      callback('That username exists already!');
      return;
    }

    // now make it
    console.log('making user ', username);

    // first userid increment
    redis.incr(USER_ID, function(err, userID) {
      var user_data = _.extend(
        USER_SCHEMA,
        metadata || {},
        {
          userID: userID,
          name: name,
          createTime: new Date().toString()
        }
      );

      redis.set(username, JSON.stringify(user_data));
      redis.sadd(USERS, username);

      callback();
    });
  });
};

var makePlant = exports.makePlant = function(plant_name, owner_username, callback) {
  var plant_username = getPlantID(plant_name);
  var owner_username = getUserID(owner_username); // just in case

  if (!plant_username || !plant_username.length) {
    callback('empty plant name!');
  }
  console.log('plant name', name, 'plant usnermae', plant_username);

  if (!VALID_USERNAME_REGEX.test(plant_username)) {
    callback('bad plant username');
  }

  redis.sismember(PLANTS, plant_username, function(err, result) {
    if (err) {
      callback(err);
      return;
    }
    if (result) {
      callback('plant username already exists, sorry');
      return;
    }
    // check if user
    isUser(owner_username, function(isUser) {
      if (!isUser) {
        callback('that person is not a user');
        return;
      }
      // now plant doesnt exist and user is valid, so go ahead and make plant
      redis.incr(PLANT_ID, function(err, plantID) {
        var plant_data = _.extend(
          {},
          PLANT_SCHEMA,
          {
            plantID: plantID,
          }
        );

    });
  });

};

var getUsers = exports.getAllUsers = function(callback) {
  redis.smembers(USERS, function(err, users) {
    callback(err, users);
  });
};

var isUser = exports.isUser = function(nameOrUsername, callback) {
  var username = getUserID(nameOrUsername);
  redis.sismember(USERS, function(err, result) {
    if (result) {
      callback(true);
    }
    callback(false);
  });
};

var getUser = exports.getUser = function(username, callback) {
  redis.get(username, function(err, value) {
    if (err) {
      callback(err, {});
    }
    callback(err, JSON.parse(value));
  });
};

var deleteUser = exports.deleteUser = function(username, callback) {
  console.log('deleting user', username);

  redis.del(username);
  redis.srem(USERS, username);

  callback();
};

var deleteAllUsers = exports.deleteAllUsers = function(callback) {
  redis.smembers(USERS, _.bind(function(err, usernames) {
    if (err) {
      console.log('error!' + String(err));
      return;
    }

    _.each(usernames, function(username) {
      this.deleteUser(username)
    }, this);
    if (callback) {
      callback(null, usernames);
    }
  }, this));
};


