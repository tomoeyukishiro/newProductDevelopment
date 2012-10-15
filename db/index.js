var _ = require('underscore');
var redis = require('../myredis').redis;

/***** import globals *********
 * user_id // user id
 * users // list of users
 */

// now some functions

function makeUser(username, metadata, callback) {
  if (!username.length) {
    callback('empty username!');
  }
  var invalid = /^[a-zA-Z0-9.]+$/;
  if (!invalid.test(username)) {
    callback('bad username!');
  }

  // test if it exists
  redis.sismember('users', username, function(err, result) {
    if (err) {
      callback(err);
    }
    if (result) {
      callback('That username exists already!');
    }

    // now make it
    console.log('making user ', username);

    // first userid increment
    redis.incr('user_id', function(err, user_id) {
      var user_data = _.extend(
        {},
        metadata,
        {
          user_id: user_id
        }
      );

      redis.set(username, JSON.stringify(user_data));
      redis.sadd('users', username);

      callback();
    });
  });
}

function getUsers(callback) {
  redis.smembers('users', function(err, users) {
    callback(err, users);
  });
}

function getUser(username, callback) {
  redis.get(username, function(err, value) {
    if (err) {
      callback(err, {});
    }
    callback(err, JSON.parse(value));
  });
}

exports.makeUser = makeUser;
exports.getUsers = getUsers;
exports.getUser = getUser;

