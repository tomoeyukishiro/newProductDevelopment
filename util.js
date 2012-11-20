var Q = require('q');

exports.request = {};

exports.request.getUrl = function(request) {
  var fullUrl = request.protocol + '://' + request.headers.host + request.path; 
  return fullUrl;
};

exports.request.getHostPath = function(request) {
  var host = request.protocol + '://' + request.headers.host;
  return host;
};

exports.promiseDelay = function(ms) {
  return function() {
    ms = ms || 300;
    var deferred = Q.defer();
    setTimeout(deferred.resolve, ms);

    return deferred.promise;
  };
};

exports.errorPage = function(response) {
  return function(err) {
    response.render('signup', {error: err});
  };
};

