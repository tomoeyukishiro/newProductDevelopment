var _ = require('underscore');
var redis = require('../myredis').redis;
// make available for low level stuff
exports.redis = redis;

/***** import globals *********
 * user_id // user id
 * users // list of users
 */
var VALID_USERNAME_REGEX = /^[a-zA-Z0-9.\-_]+$/;
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

var isValidUsername = exports.isValidUsername = function(username) {
  return VALID_USERNAME_REGEX.test(username) &&
    username !== USERS &&
    username !== PLANTS &&
    username !== USER_ID &&
    username !== PLANT_ID;
};

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
  id: null,
  createTime: null,
  name: null,
  username: null
};

/* Plants is in the form of
  [{
    plantID: ~~
    plantName: ~~
  }, {}, ...
  ]
*/

var PLANT_SCHEMA = {
  name: null,  // display name
  username: null, // key for redis
  owner: null, // username of owner
  id: null,    // number for uniqueness
  shouldWater: false, // boolean if we should water,
  createTime: null
};


// now some functions
var makeUser = exports.makeUser = function(name, metadata, callback) {
  var username = getUserID(name);
  if (!username || !username.length) {
    callback('empty username!');
  }
  console.log('name is', name, 'username', username);

  if (!isValidUsername(username)) {
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
          username: username,
          createTime: new Date().toString()
        }
      );

      redis.set(username, JSON.stringify(user_data));
      redis.sadd(USERS, username);

      callback();
    });
  });
};

var addPlantToUser = function(plant_username, owner_username, plant_data, callback) {
  getUser(owner_username, function(err, user_data) {
    if (err) {
      callback(err);
      return;
    }

    user_data.plants.push({
      username: plant_data.username,
      name: plant_data.name
    });
    storeUser(owner_username, user_data);
    callback();
  });
};

var removePlantFromUser = function(plant_username, owner_username) {
  getUser(owner_username, function(err, user_data) {
    if (!user_data) {
      console.log('no user data for username', owner_username);
      return;
    }
    var newPlants = [];
    _.each(user_data.plants, function(plant) {
      if (plant.username !== plant_username) {
        newPlants.push(plant);
      }
    });
    user_data.plants = newPlants;
    storeUser(owner_username, user_data);
  });
};

var makePlant = exports.makePlant = function(plant_name, owner_username, callback) {
  var plant_username = getPlantID(plant_name);
  var owner_username = getUserID(owner_username); // just in case

  if (!plant_username || !plant_username.length) {
    callback('empty plant name!');
    return;
  }
  console.log('plant name', plant_name, 'plant usnermae', plant_username);

  if (!isValidUsername(plant_username)) {
    callback('bad plant username, i got' + plant_username);
    return;
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
    isUser(owner_username, function(err, result) {
      console.log('after checking if its a user', arguments);
      if (!result) {
        callback('that person is not a user' + owner_username);
        return;
      }
      // now plant doesnt exist and user is valid, so go ahead and make plant
      redis.incr(PLANT_ID, function(err, plantID) {
        var plant_data = _.extend(
          {},
          PLANT_SCHEMA,
          {
            id: plantID,
            name: plant_name,
            username: plant_username,
            owner: owner_username
          }
        );
        redis.set(plant_username, JSON.stringify(plant_data));
        redis.sadd(PLANTS, plant_username);
        console.log('making this plant', plant_data);
        // now add it to that owner
        addPlantToUser(plant_username, owner_username, plant_data, function(err) {
          console.log('added plant to user', err);
          callback(err);
        });
      });
    });
  });
};

var getAllUsers = exports.getAllUsers = function(callback) {
  redis.smembers(USERS, function(err, users) {
    callback(err, users);
  });
};

var getAllPlants = exports.getAllPlants = function(callback) {
  redis.smembers(PLANTS, function(err, plants) {
    callback(err, plants);
  });
};

var isUser = exports.isUser = function(nameOrUsername, callback) {
  var username = getUserID(nameOrUsername);
  console.log('checking if this user is a user', username);
  redis.sismember(USERS, username, function(err, result) {
    console.log('results', arguments);
    callback(err, result);
  });
};

var printUser = exports.printUser = function(username) {
  var username = getUserID(username);
  printGeneral(username, 'User');
};

var printGeneral = function(key, type) {
  redis.get(key, function(err, val) {
    if (err) {
      console.log('error!: ', err);
      return;
    }
    console.log(type, key);
    console.log(val);
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

var getPlant = exports.getPlant = function(username, callback) {
  redis.get(username, function(err, value) {
    if (err) {
      callback(err, {});
    }
    callback(err, JSON.parse(value));
  });
};

var storeUser = function(username, data) {
  console.log('setting user', username, ' data to', data);
  redis.set(username, JSON.stringify(data));
};

var deletePlant = exports.deletePlant = function(plant_username, callback) {
  console.log('deleting plant', plant_username);

  getPlant(plant_username, function(err, plant_data) {
    var owner = plant_data.owner;
    removePlantFromUser(plant_username, owner);

    deletePlantEntry(plant_username);
    callback();
  });
};

var deletePlantEntry = function(plant_username) {
  redis.del(plant_username);
  redis.srem(PLANTS, plant_username);
};

var deleteUser = exports.deleteUser = function(username, callback) {
  console.log('deleting user', username);

  // need to delete all plants also
  getUser(username, function(err, data) {
    _.each(data.plants, function(plantObj) {
      var plant_username = plantObj.username;
      if (!plant_username) {
        // uh oh
        return;
      }

      deletePlantEntry(plant_username);

      redis.del(plant_username);
      redis.srem(PLANTS, plant_username);
    });

    redis.del(username);
    redis.srem(USERS, username);

    callback();
  });
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


