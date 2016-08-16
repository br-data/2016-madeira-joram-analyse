var express = require('express');
var router = express.Router();

var port = process.env.PORT || 3005;

var elastic = require('elasticsearch');

var client = new elastic.Client({
  host: 'localhost:9200'
});

var index = 'joram';

var app = express();

router.get('/', function(req, res) {

  res.json({ message: 'Express is running' });
});

router.get('/search/:input', function (req, res) {

  var query = req.params.input;

  client.search({
    index: index,
    size: 1000,
    body: {
      query: {
        match: {
          body: query
        }
      },
      highlight : {
        fields : {
          body : {}
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
