var db = require('../db');
var mynow = require('../mynow');
var Q = require('q');

exports.log = function(plant_username, value, callback) {
  // first log it for nowjs
  mynow.pushData(plant_username, value);

  var plantDataID = db.getPlantDataID(plant_username);

  Q.ncall(db.redis.lpush, db.redis, plantDataID, value)
  .then(function(val) {
    if (val > 1000) {
      console.log('holy CRAP we have a lot of entries, clearing...');
      Q.ncall(db.redis.del, db.redis, plantDataID)
      .then(function() {
        db.redis.lpush(plantDataID, value);
      });
    }

    if (callback) {
      callback(err, val);
    }
  })
  .fail(function(err) {
    console.log('error while logging moisture!!');
    callback(err);
  })
  .done();
};

exports.getRecentPlantData = function(plant_username, callback) {
  var plantDataID = db.getPlantDataID(plant_username);

  db.redis.lrange(plantDataID, 0, 10, callback);
};

