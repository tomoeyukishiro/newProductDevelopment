var url = process.env.REDISTOGO_URL ||
  'redis://petermcottle:36aa6d00c86319b03eb2e2f79cc7573f@drum.redistogo.com:9958/';

exports.redis = require('redis-url').connect(url);

