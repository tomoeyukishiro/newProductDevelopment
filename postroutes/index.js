var db = require('../db');
var texting = require('../texting');
var routes = require('../routes');
var util = require('../util');

exports.signup = function(request, response) {
  var name = request.param('name');
  if (!name) {
    console.log('RENDERING ERROR PAGE');
    response.render('signup', {
      error: "No name Specified!"
    });
    return;
  }

  console.log('Received signup for name: ', name);

  var metadata = {};
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

  response.send('watering plant...');
};

function getWaterPathForUser(request, username) {
  var dest = '/mobile_water_prompt';
  var fullPath = util.request.getHostPath(request) + dest;
  var link = fullPath + '?username=' + username;

  var shortenMap = {
    'http://radiant-atoll-9524.herokuapp.com/mobile_water_prompt?username=peter': 'http://bit.ly/PV0iGH',
    'http://radiant-atoll-9524.herokuapp.com/mobile_water_prompt?username=jill': 'http://bit.ly/VRk3fg'
  };
  if (shortenMap[link]) {
    link = shortenMap[link];
  }
  return link;
}

exports.text_user = function(request, response) {
  var users = texting.userToPhone;

  var username = request.param('username');
  if (!username || !users[username]) {
    response.send('That username "' + username + '" is not valid!');
    return;
  }

  var link = getWaterPathForUser(request, username);
  var body = 'Hey ' + username + ', water ur plant: ' + link;

  texting.sendTextToUser(username, body, function(error, twilioResponse) {
    if (error) {
      response.send('there was an error!' + JSON.stringify(error));
      return;
    }

    response.send('Texted that person! I sent them: ' + body);
  });
};

