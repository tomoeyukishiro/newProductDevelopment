var db = require('../db');

exports.log = function(plant_username, value, callback) {
  var plantDataID = db.getPlantDataID(plant_username);

  // just go add this value onto that list
  db.redis.lpush(plantDataID, value, function(err, val) {
    if (val > 1000) {
      console.log('holy CRAP we have a lot of entries, clearing...');
      db.redis.set(plantDataID, null, function() { 
        db.redis.lpush(plantDataID, value);
      });
    }

    if (callback) {
      callback(err, val);
    }
  });
};

exports.getRecentPlantData = function(plant_username, callback) {
  var plantDataID = db.getPlantDataID(plant_username);

  db.redis.lrange(plantDataID, 0, 10, callback);
};

