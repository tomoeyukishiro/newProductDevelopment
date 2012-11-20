var Q = require('q');

var doSomething = function() {
  var response = Q.defer();
  setTimeout(function() {
    if (Math.random() > 0.5) {
      response.resolve('I won!');
    } else {
      response.reject('NOOOOooo');
    }
  }, Math.random() * 2000);
  setTimeout(function() {
    response.resolve('no I won :O');
  }, Math.random() * 2000);
  return response.promise;
};

var val = null;

doSomething().then(function(_val) {
  val = _val;

  console.log('the val was:', val);
  if (val == 'I won!') {
    console.log('doing another!!!!');
    var response = Q.defer();
    setTimeout(function() {
      response.resolve('dunzo');
    }, 500);
    return response.promise;
  } else {
    console.log('not doing another');
  }
}, function(realError) {
  console.log('real error', realError);
  console.log('val was', val);
}).then(function(val2) {
  console.log('val was', val);
  if (val2) {
    console.log('second one worked:', val2);
    throw new Error('second');
  }
}).fail(function(reason) {
  console.log('failed for reason: ', reason);
  console.log('val was', val);
});

