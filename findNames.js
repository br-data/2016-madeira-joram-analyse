var fs = require('fs');
var request = require('request');

var inputFile = './names.txt';
var outputFile = './names-results.csv';

var searchUrl = 'http://localhost:3003/custom/';

(function init() {

  loadFile(processNames);
})();

function loadFile(callback) {

  fs.readFile(inputFile, 'utf8', callback);
}

function processNames(error, result) {

  if (error) { throw error; }

  var names = result.toString().split('\n');
  var count = names.length;

  iterate(names);

  function iterate(remainingNames) {

    if (names.length > 0) {

      var name = remainingNames.pop();

      if (name !== '') {

        searchName(name, function (result) {

          var hits = result.hits.hits.length;
          var line = name + ',' + hits + '\n';

          console.log('Found ' + hits + ' entries for ' + name);

          fs.appendFile(outputFile, line, function (error) {

            if (error) { throw error; }

            iterate(remainingNames);
          });
        });
      } else {

        iterate(remainingNames);
      }
    } else {

      console.log('Finished processing ' + count + ' names');
    }
  }
}

function searchName(name, callback) {

  var url = encodeURI(searchUrl + name);

  request({

    url: url,
    json: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {

      callback(body);
    }
  });
}
