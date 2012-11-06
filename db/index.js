var _ = require('underscore');
var redis = require('../myredis').redis;

/***** import globals *********
 * user_id // user id
 * users // list of users
 */
var USERS = 'users';
var USER_ID = 'user_id';

// now some functions

var makeUser = exports.makeUser = function(username, metadata, callback) {
  if (!username.length) {
    callback('empty username!');
  }
  var invalid = /^[a-zA-Z0-9.]+$/;
  if (!invalid.test(username)) {
    callback('bad username!');
  }

  // test if it exists
  redis.sismember(USERS, username, function(err, result) {
    if (err) {
      callback(err);
    }
    if (result) {
      callback('That username exists already!');
    }

    // now make it
    console.log('making user ', username);

    // first userid increment
    redis.incr(USER_ID, function(err, user_id) {
      var user_data = _.extend(
        {},
        metadata,
        {
          user_id: user_id
        }
      );

      redis.set(username, JSON.stringify(user_data));
      redis.sadd(USERS, username);

      callback();
    });
  });
};

var getUsers = exports.getUsers = function(callback) {
  redis.smembers(USERS, function(err, users) {
    callback(err, users);
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

var deleteUser = exports.deleteUser = function(username) {
  redis.del(username);
  redis.srem(USERS, username);
};


