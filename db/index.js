var _ = require('underscore');
var redis = require('../myredis').redis;
var Q = require('q');

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
  username: null,
  phoneNumber: null,
  limitTexts: false
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
  shouldWater: false, // boolean if we should water, based on the user confirming
  createTime: null,
  moistureThreshold: 700, // if its below this, we should water
  needsWater: false // this is based off of moisture level reading
};


// now some functions
var makeUser = exports.makeUser = function(name, metadata, callback) {
  var username = getUserID(name);
  if (!username || !username.length) {
    callback('empty username!');
  }
  console.log('making user', username, 'and metadata', metadata, 'user schema', USER_SCHEMA);

  if (!isValidUsername(username)) {
    callback('bad username!');
  }

  Q.ncall(redis.sismember, redis, USERS, username)
  .then(function(result) {
    if (result) {
      callback('That username already exists!');
      return;
    }
  })
  .then(function() {
    // now make it
    console.log('making user ', username);
    return Q.ncall(redis.incr, redis, USER_ID);
  })
  .then(function(userID) {
    var user_data = _.extend(
      {},
      USER_SCHEMA,
      metadata || {},
      {
        userID: userID,
        name: name,
        username: username,
        createTime: new Date().toString(),
        plants: []
      }
    );

    redis.set(username, JSON.stringify(user_data));
    redis.sadd(USERS, username);

    callback();
  })
  .fail(function(err) {
    callback(err);
  })
  .done();
};

var addPlantToUser = function(plant_username, owner_username, plant_data, callback) {
  console.log('adding plant', plant_username, 'to this owner', owner_username, plant_data);
  Q.ncall(getUser, this, owner_username)
  .then(function(user_data) {
    user_data.plants.push({
      username: plant_data.username,
      name: plant_data.name
    });
    storeUser(owner_username, user_data);
    callback();
  })
  .fail(function(err) {
    callback(err);
  })
  .done();
};

var removePlantFromUser = function(plant_username, owner_username) {
  Q.ncall(getUser, this, owner_username)
  .then(function(user_data) {
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
  })
  .fail(function(err) {
    console.log('error on removePlantFromUser', err);
  })
  .done();
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

  Q.ncall(redis.sismember, redis, PLANTS, plant_username)
  .then(function(result) {
    if (result) {
      // i need to stop! hmm...
      callback('plant username already exists, sorry');
      return;
    }
    return Q.ncall(isUser, this, owner_username);
  })
  .then(function(result) {
    console.log('after checking if its a user', arguments);
    if (!result) {
      callback('that person is not a user' + owner_username);
      return;
    }
    return Q.ncall(redis.incr, redis, PLANT_ID);
  })
  .then(function(plantID) {
    // now plant doesnt exist and user is valid, so go ahead and make plant
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
    return Q.ncall(addPlantToUser, this, plant_username, owner_username, plant_data);
  })
  .then(function() {
    console.log('added plant to user');
    callback();
  })
  .fail(function(err) {
    callback(err);
  })
  .done();
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
    var user_data = _.extend(
      {},
      USER_SCHEMA,
      JSON.parse(value)
    );
    callback(null, user_data);
  });
};

var getPlant = exports.getPlant = function(username, callback) {
  redis.get(username, function(err, value) {
    if (err) {
      callback(err, {});
    }
    callback(null, _.extend(
      {},
      PLANT_SCHEMA,
      JSON.parse(value)
    ));
  });
};

var getUserAndAllPlants = exports.getUserAndAllPlants = function(username, callback) {
  var plantDataMap = {};
  console.log('getting plants for user', username);

  Q.ncall(getUser, this, username)
  .then(function(userData) {
    var numPlantsToGet = userData.plants.length;
    // loop through the plants, actually kinda cool because
    // its parallel fetching!
    _.each(userData.plants, function(plantThing) {

      var plantUsername = plantThing.username;
      getPlant(plantUsername, function(err, plantData) {

        // poor mans clone operation, LOL
        plantDataMap[plantData.username] = JSON.parse(JSON.stringify(plantData));

        if (_.keys(plantDataMap).length == numPlantsToGet) {
          callback(err, userData, plantDataMap);
        }
      });
    });
  })
  .fail(function(err) {
    callback(err);
  })
  .done();
};

var setPlantShouldWater = exports.setPlantShouldWater = function(plant_username, value, callback) {
  setPlantGeneral(plant_username, 'shouldWater', value, callback);
};

var setPlantNeedsWater = exports.setPlantNeedsWater = function(plant_username, value, callback) {
  setPlantGeneral(plant_username, 'needsWater', value, callback);
};

var setPlantGeneral = exports.setPlantGeneral = function(plant_username, key, value, callback) {
  getPlant(plant_username, function(err, plant_data) {
    if (err) { callback(err); return; }

    console.log('setting this key', key, 'to value', value);
    plant_data[key] = value;
    console.log('plant data is now', plant_data);

    storePlant(plant_username, JSON.parse(JSON.stringify(plant_data)), function(err, val) {
      callback(err, val);  
    });
  });
};

var setPlantMulti = exports.setPlantMulti = function(plant_username, keys, values, callback) {
  getPlant(plant_username, function(err, plant_data) {
    if (err) { callback(err); return; }

    var newData = JSON.parse(JSON.stringify(plant_data));

    console.log('new data before', newData);
    _.each(keys, function(key, i) {
      console.log('setting key', key, 'to value', values[i]);
      newData[key] = values[i];
    });
    console.log('after', newData);

    storePlant(plant_username, JSON.parse(JSON.stringify(newData)), function(err, val) {
      callback(err, val); 
    });
  });
};

var storePlant = function(plant_username, data, callback) {
  console.log('setting plant to', plant_username, 'data to', data);
  redis.set(plant_username, JSON.stringify(data), function(err, val) {
    if (callback) {
      callback(err, val)
    }
  });
};

var storeUser = function(username, data, callback) {
  console.log('setting user', username, ' data to', data);
  redis.set(username, JSON.stringify(data), function(err, val) {
    if (callback) { callback(err, val); }
  });
};

var setUserLastTexted = exports.setUserLastTexted = function(username, callback) {
  setUserGeneral(username, 'lastTexted', new Date().toUTCString(), callback);
};

var setUserGeneral = exports.setUserGeneral = function(username, key, val, callback) {
  setUserMulti(username, [key], [val], callback);
};

var setUserMulti = exports.setUserMulti = function(username, keys, values, callback) {
  var callbackWrap = function(err, val) {
    console.log('inside callback wrap');
    if (callback) { callback(err, val); console.log('called back'); }
  };

  getUser(username, function(err, userData) {
    if (err) { callbackWrap(err); return; }
    userData = JSON.parse(JSON.stringify(userData));

    _.each(keys, function(key, i) {
      userData[key] = values[i];
    });

    storeUser(username, userData, callbackWrap);
  });
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


