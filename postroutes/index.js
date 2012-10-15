var db = require('../db');
var routes = require('../routes');

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

