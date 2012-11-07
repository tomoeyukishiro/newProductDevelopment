var express = require('express');

// connect to our DB
var url = process.env.REDISTOGO_URL ||
  'redis://petermcottle:36aa6d00c86319b03eb2e2f79cc7573f@drum.redistogo.com:9958/';
var redis = require('redis-url').connect(url);

var app = exports.app = express.createServer();
exports.port = process.env.PORT || 3600;

app.configure('development', function() {
  app.use(express.logger());
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));

  app.use('/lib/', express.static(__dirname + '/lib'));
  app.use('/css/', express.static(__dirname + '/css'));

  app.use(express.bodyParser());
  app.use(app.router);

  // Views configuration!
  app.use(express.methodOverride());
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
});


/*********** Routing ***************/
var routes = require('./routes');
var postRoutes = require('./postroutes');
// require routes after starting up server so node-twilio doesn't make a new express server on a random port.

app.get('/', routes.index);
app.get('/about', routes.about);
app.get('/signup', routes.signup);
app.get('/listusers', routes.listusers);
app.get('/user/:username', routes.user);

// post methods
app.post('/signup', postRoutes.signup);
app.post('/water_plant', postRoutes.water_plant);
app.post('/text_user', postRoutes.text_user);
app.post('/delete_user', postRoutes.delete_user);

// mobile stuff
app.get('/mobile_home', routes.mobile_home);
app.get('/mobile_water_prompt', routes.mobile_water_prompt);
app.get('/mobile_water_after', routes.mobile_water_after);

var port = process.env.PORT || 3600;
app.listen(port, function() {
  console.log('Listening on ' + port);
});

