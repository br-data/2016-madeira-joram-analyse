// Rest interface for simple Elasticsearch queries
var express = require('express');
var router = express.Router();
var elastic = require('elasticsearch');

var port = process.env.PORT || 3003;

// ESC cluster address
var client = new elastic.Client({
  host: 'localhost:9200'
});

// ESC index name
var index = 'joram';

var app = express();

// Standard route
router.get('/', function(req, res) {

  res.json({

    name: 'Mammon service',
    description: 'Elasticsearch client API',
    version: '0.0.1'
  });
});

// Search route /match
// Full text search, finds only exact matches "John Doe"
// https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-multi-match-query.html
router.get('/match/:query', function (req, res) {

  var query = req.params.query;

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
          body: {},
          'body.folded': {}
        }
      }
    }
  }, function (error, result) {

    res.json(result);
  });
});

// Search route /custom
// Full text search, finds all terms of a query: "John" AND "Doe"
// Supports wildcards and simple search operators
// https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-simple-query-string-query.html
router.get('/custom/:query', function (req, res) {

  var query = req.params.query;

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
          body: {},
          'body.folded': {}
        }
      }
    }
  }, function (error, result) {

    res.json(result);
  });
});

// Search route /fuzzy
// Fuzzy term search, finds all terms of a query: "Jhon"
// https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-fuzzy-query.html
router.get('/fuzzy/:query', function (req, res) {

  var query = req.params.query;

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

// Search route /regexp
// Fuzzy term search, finds all terms of a query: "J.h*"
// https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-regexp-query.html
router.get('/regexp/:query', function (req, res) {

  var query = req.params.query;

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

  // Intercept OPTIONS method
  if ('OPTIONS' == req.method) {

    res.send(200);
  } else {

    next();
  }
});

app.use('/', router);

app.listen(port);

console.log('Server is running on port ' + port);
