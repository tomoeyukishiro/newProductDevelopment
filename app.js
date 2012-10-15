var express = require('express');
var routes = require('./routes');

// connect to our DB
var url = process.env.REDISTOGO_URL ||
  'redis://petermcottle:36aa6d00c86319b03eb2e2f79cc7573f@drum.redistogo.com:9958/';
var redis = require('redis-url').connect(url);

var app = express.createServer();

app.configure('development', function() {
  app.use(express.logger());
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));

  app.use('/lib/', express.static(__dirname + '/lib'));
  app.use('/css/', express.static(__dirname + '/css'));

  app.use(app.router);

  // Views configuration!
  app.use(express.methodOverride());
  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
});


app.get('/', routes.index);
app.get('/about', routes.about);

var port = process.env.PORT || 3600;
app.listen(port, function() {
  console.log('Listening on ' + port);
});

