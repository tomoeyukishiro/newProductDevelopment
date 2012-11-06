var db = require('../db');
var texting = require('../texting');
var routes = require('../routes');
var util = require('../util');

exports.signup = function(request, response) {
  var username = request.param('username');

  if (!username) {
    console.log('RENDERING ERROR PAGE');
    response.render('signup', {
      error: "No Username Specified!"
    });
    return;
  }

  console.log('Received signup for username: ', username);

  var now = new Date().toString();

  db.makeUser(username, {
      createTime: now
    }, function(err) {
      console.log('in callback');
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

exports.water_plant = function(request, response) {
  // twilio stuff

  response.send('watering plant...');
};

exports.text_user = function(request, response) {
  var users = texting.userToPhone;

  var username = request.param('username');
  if (!username || !users[username]) {
    response.send('That username "' + username + '" is not valid!');
    return;
  }

  var dest = '/mobile_water_prompt';
  var link = util.request.getHostPath(request) + dest + '?username=' + username;
  var body = 'Hey ' + username + ', water ur plant: ' + link;

  texting.sendTextToUser(username, body, function(error, twilioResponse) {
    if (error) {
      response.send('there was an error!' + JSON.stringify(error));
      return;
    }

    response.send('Texted that person! I sent them: ' + body);
  });
};

