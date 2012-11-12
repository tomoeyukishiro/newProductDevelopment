var db = require('../db');
var mynow = require('../mynow');

exports.log = function(plant_username, value, callback) {
  // first log it for nowjs
  mynow.pushData(plant_username, value);

  var plantDataID = db.getPlantDataID(plant_username);

  // just go add this value onto that list
  db.redis.lpush(plantDataID, value, function(err, val) {
    if (val > 1000) {
      console.log('holy CRAP we have a lot of entries, clearing...');
      db.redis.del(plantDataID, function() { 
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

