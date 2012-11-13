var app = require('../app.js');

var nowjs = require('now');
var everyone = nowjs.initialize(app.app, {
  socketio: {
    transports: ['xhr-polling', 'jsonp-polling']
  }
});

nowjs.on('connect', function() {
  console.log('someone joined via nowjs!');
});

exports.pushData = function(plant_username, value) {
  if (everyone && everyone.now && everyone.now.receiveData) {
    // make sure someone is connected
    everyone.now.receiveData(plant_username, value);
  }
};

