var express = require('express');

var app = express.createServer();
app.configure('development', function() {
  // errors
  app.use(express.logger());
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));

  // static
  app.use('/lib/', express.static(__dirname + '/lib'));
  app.use('/css/', express.static(__dirname + '/css'));

  // Views configuration!
  app.use(express.methodOverride());
  //app.use(express.bodyDecoder());
  app.use(app.router);

  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');
  //app.set('view options', {layout: false});
});


app.get('/', function(request, response) {
  response.render('index', {
    locals: {
      title: 'New Product Development!',
      time: new Date().toString()
    }
  });
});

var port = process.env.PORT || 3600;
app.listen(port, function() {
  console.log('Listening on ' + port);
});

