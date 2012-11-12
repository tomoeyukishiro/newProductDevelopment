var db = require('../db');
var texting = require('../texting');
var routes = require('../routes');
var util = require('../util');
var moistureLogging = require('../moisturelogging');

exports.signup = function(request, response) {
  var name = request.param('name');
  var phone = request.param('phone');

  // quick phone validation
  phone = phone.replace(/[(\- )]/g, '');
  if (phone.slice(0,1) !== '1') {
    phone = '1' + phone;
  }

  if (!name) {
    response.render('signup', {
      error: "No name Specified!"
    });
    return;
  }
  if (!phone) {
    response.render('signup', {
      error: 'No phone (or invalid phone) specified!'
    });
    return;
  }
  if (!texting.validPhones[phone]) {
    response.render('signup', {
      error: 'That phone number is not validated! Ask Peter to validate your phone with twilio'
    });
    return;
  }

  console.log('Received signup for name: ', name);
  var metadata = {
    phoneNumber: phone
  };
  db.makeUser(name, metadata, function(err) {
      if (err) {
        console.log('err on signup', err);
        response.render('signup', {
          error: String(err)
        });
        return;
      }

      // ok now just render success
      routes.listusers(request, response);
  });
};

exports.delete_user = function(request, response) {
  var username = request.param('username');
  if (!username) {
    // TODO different parent
    response.render('signup', {
      error: 'No username for delete!'
    });
    return;
  }

  db.deleteUser(username, function(err) {
    if (err) {
      response.render('signup', {
        error: String(err)
      });
      return;
    }
    routes.listusers(request, response);
  });
};

exports.delete_plant = function(request, response) {
  var plant_username = request.param('plant_username');
  if (!plant_username) {
    response.render('signup', {
      error: 'Bad plant usnerame' + String(plant_username)
    });
    return;
  }

  db.deletePlant(plant_username, function(err) {
    if (err) {
      response.render('signup', {
        error: String(err)
      });
      return;
    }
    routes.listplants(request, response);
  });
};

exports.make_plant = function(request, response) {
  var owner = request.param('owner');
  var plant_name = request.param('name');

  if (!owner || !plant_name) {
    response.render('signup', {
      error: 'no owner or plant anme specified!'
    });
    return;
  }

  db.makePlant(plant_name, owner, function(err) {
    if (err) {
      response.render('signup', {
        error: String(err)
      });
      return;
    }
    routes.user(request, response, owner);
  });
};

exports.water_plant = function(request, response) {
  var plant_username = request.param('plant_username');

  // need to set the field
  db.setPlantShouldWater(plant_username, true, function(err) {
    if (err) { response.send(String(err)); return; }

    response.send('Set plant water boolean for ' + plant_username);
  });
};

exports.toggle_text_limiting = function(request, response) {
  var username = request.param('username');
  var value = request.param('value');
  if (!username || value === null) {
    response.render('signup', {
      error: 'no username or value specified!'
    });
    return;
  }
  // wtf boolean string conversion... :(
  value = (value == 'false') ? false : true;

  db.setUserGeneral(username, 'limitTexts', value, function(err, val) {
    if (err) { response.send('error: ' + String(err)); return; }
    
    response.send('success');
  });
};

exports.check_and_record = function(request, response) {
  var plant_username = request.param('plant_username');
  if (!plant_username) {
    console.log('WARNING: assuming plant username of plant-jack');
    plant_username = 'plant-jack';
  }

  var moisture_level = request.param('moisture');
  if (!moisture_level) {
    response.render('signup', {
      error: 'no moisture key given!'
    });
    return;
  }

  // do two things -- first add this data point
  moistureLogging.log(plant_username, Number(moisture_level));

  // then compare against threshold
  db.getPlant(plant_username, function(err, plantData) {
    if (err || !plantData) {
      resposne.send(String(err) + String(plantData) + 'one of those is bad');
      return;
    }

    var needToSet = false;
    var toSend = false;
    var needsWater = plantData.needsWater;
    var shouldWater = plantData.shouldWater;

    console.log('comparing moisture level of', moisture_level, 'to thres', plantData.moistureThreshold);
    if (Number(moisture_level) < Number(plantData.moistureThreshold)) {
      console.log('Its too dry!');
      // only text if we haven't texted before, inferred by the 'needs water' thing
      if (!plantData.needsWater) {
        console.log('needs water is falsey, so lets go send a text and set needsWater to true');
        sendWaterTextToUser(plantData.owner, request);

        needsWater = true;
        needToSet = true;
      }
    } else {
      console.log('plant ' + plant_username + ' has plenty of water');
      needsWater = false;
      if (needsWater !== plantData.needsWater) { 
        needToSet = true;
      }
    }

    // here we return the boolean if it should water or not
    if (plantData.shouldWater) {
      shouldWater = false;
      toSend = true;
      needToSet = true;
    }
    
    // easiest case
    if (!needToSet) {
      response.send(String(toSend));
      return;
    }
    // ok do a multi set
    db.setPlantMulti(plant_username, ['needsWater', 'shouldWater'], [needsWater, shouldWater], function(err, val) {
      if (err) { response.send(String(err)); return; }

      response.send(String(toSend));
    });
  });
};

function getWaterPathForUser(request, username) {
  var dest = '/mp';
  var fullPath = util.request.getHostPath(request) + dest;
  var link = fullPath + '?u=' + username;

  return link;
}

var sendWaterTextToUser = function(username, request, response) {
  var link = getWaterPathForUser(request, username);
  var body = 'Hey ' + username + ', water ur plant: ' + link;
  console.log('texting user', username, 'the body', body);

  texting.sendTextToUser(username, body, function(error, twilioResponse) {
    if (!response) {
      // sometimes we want to just dump this
      return;
    }

    if (error) {
      response.send('there was an error!' + JSON.stringify(error));
      return;
    }

    response.send('Texted that person! I sent them: ' + body);
  });
};

