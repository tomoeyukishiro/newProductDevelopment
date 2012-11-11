var db = require('../db');
var texting = require('../texting');
var routes = require('../routes');
var util = require('../util');

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
  // queue stuff...
  var plant_username = request.param('plant_username');
  if (!plant_username) {
    console.log('WARNING assuming plant username of plant-jack');
    plant_username = 'plant-jack';
  }

  // need to set the field
  db.setPlantShouldWater(plant_username, true, function(err) {
    if (err) { response.send(String(err)); return; }

    response.send('Set plant water boolean for ' + plant_username);
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
  // TODO

  // then compare against threshold
  db.getPlant(plant_username, function(err, plantData) {
    console.log('comparing moisture level of', moisture_level, 'to thres', plantData.moistureThreshold);
    if (Number(moisture_level) < Number(plantData.moistureThreshold)) {
      console.log('Its too dry!');
      // only text if we haven't texted before, inferred by the 'needs water' thing
      if (!plantData.needsWater) {
        sendWaterTextToUser(plantData.owner, request);
        db.setPlantNeedsWater(plant_username, true, function() {});
      }
    }

    // here we return the boolean if it should water or not
    if (plantData.shouldWater) {
      db.setPlantShouldWater(plant_username, false, function(err) {
        if (err) { response.send(String(err)); return; }
        // also say it doesnt need water anymore
        db.setPlantNeedsWater(plant_username, false, function() {});

        // now we send a true to make arduino water
        response.send('true');
      });
      return;
    }
    // otherwise its easy, just send false
    response.send('false');
  });
};

function getWaterPathForUser(request, username) {
  var dest = '/mp';
  var fullPath = util.request.getHostPath(request) + dest;
  var link = fullPath + '?u=' + username;

  var shortenMap = {
    //'http://radiant-atoll-9524.herokuapp.com/mobile_water_prompt?username=peter': 'http://bit.ly/PV0iGH',
    //'http://radiant-atoll-9524.herokuapp.com/mobile_water_prompt?username=jill': 'http://bit.ly/VRk3fg'
  };
  if (shortenMap[link]) {
    link = shortenMap[link];
  }
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

