var express = require('express');
var router = express.Router();
var elastic = require('elasticsearch');

var port = process.env.PORT || 3003;

var client = new elastic.Client({
  host: 'localhost:9200'
});

var index = 'joram';

var app = express();

router.get('/', function(req, res) {

  res.json({

    name: 'Mammon service',
    description: 'Elasticsearch client API',
    version: '0.0.1'
  });
});

router.get('/match/:input', function (req, res) {

  var query = req.params.input;

  client.search({
    index: index,
    size: 1000,
    body: {
      query: {
        multi_match: {
          query: query,
          type: 'phrase',
          fields: ['body', 'body.folded']
        }
      },
      highlight: {
        fields: {
          body: {}
        }
      }
    }
  }, function (error, result) {

    res.json(result);
  });
});

router.get('/custom/:input', function (req, res) {

  var query = req.params.input;

  client.search({
    index: index,
    size: 1000,
    body: {
      query: {
        simple_query_string: {
          query: query,
          fields: ['body','body.folded'],
          default_operator: 'and',
          analyze_wildcard: true
        }
      },
      highlight: {
        fields: {
          body: {}
        }
      }
    }
  }, function (error, result) {

    res.json(result);
  });
});

router.get('/fuzzy/:input', function (req, res) {

  var query = req.params.input;

  client.search({
    index: index,
    size: 1000,
    body: {
      query: {
        fuzzy: {
          body: query
        }
      },
      highlight: {
        fields: {
          body: {}
        }
      }
    }
  }, function (error, result) {

    res.json(result);
  });
});

router.get('/regexp/:input', function (req, res) {

  var query = req.params.input;

  client.search({
    index: index,
    size: 1000,
    body: {
      query: {
        regexp: {
          body: query
        }
      },
      highlight: {
        fields: {
          body: {}
        }
      }
    }
  }, function (error, result) {

    res.json(result);
  });
});

// Allow Cross-origin request
app.use(function (req, res, next) {

  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

  // intercept OPTIONS method
  if ('OPTIONS' == req.method) {

    res.send(200);
  } else {

    next();
  }
});

app.use('/', router);

app.listen(port);

console.log('Server is running on port ' + port);
