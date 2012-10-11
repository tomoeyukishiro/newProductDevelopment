var express = require('express');
var mustache = require('./lib/mustache.js');
var tmpl = require('./lib/tmpl.js');

var tmpl = {
    compile: function (source, options) {
        if (typeof source == 'string') {
            return function(options) {
                options.locals = options.locals || {};
                options.partials = options.partials || {};
                if (options.body) // for express.js > v1.0
                    locals.body = options.body;
                return mustache.to_html(
                    source, options.locals, options.partials);
            };
        } else {
            return source;
        }
    },
    render: function (template, options) {
        template = this.compile(template, options);
        return template(options);
    }
};

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
  app.set('view options', {layout: false});
  app.register('.html', tmpl);
});


app.get('/', function(request, response) {
  response.render('index.html', {
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

