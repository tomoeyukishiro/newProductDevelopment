var express = require('express');

var app = express(express.logger());

app.get('/', function(request, response) {
  response.send('Hello World!');
});

var port = process.env.PORT || 3600;

app.listen(port, function() {
  console.log('Listening on ' + port);
});

