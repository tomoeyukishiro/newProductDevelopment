exports.request = {};

exports.request.getUrl = function(request) {
  var fullUrl = request.protocol + '://' + request.headers.host + request.path; 
  return fullUrl;
};

exports.request.getHostPath = function(request) {
  var host = request.protocol + '://' + request.headers.host;
  return host;
};

