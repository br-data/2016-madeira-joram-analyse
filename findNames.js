// Use a list of names to search the database and save results to another file
var fs = require('fs');
var request = require('request');

// Use command line arguments or predefined paths
var inputFile = process.argv[2] || './names.txt';
var outputFile = process.argv[3] || './names-result.csv';

// Returns exact matches only "John Doe"
var searchUrl = 'http://ddj.br.de/mammon-service/match/';

// Matches all terms of a query "John" AND "Doe"
// var searchUrl = 'http://ddj.br.de/mammon-service/custom/';

(function init() {

  loadFile(processNames);
})();

function loadFile(callback) {

  // Empty existing output file
  fs.truncate(outputFile, 0, function () {

    // Read input file and execute callback
    fs.readFile(inputFile, 'utf8', callback);
  });
}

function processNames(error, result) {

  if (error) { throw error; }

  // Names are sepeated by line breaks
  var names = result.toString().split('\n');
  var count = names.length;

  iterate(names);

  function iterate(remainingNames) {

    // Keep searching until the last name
    if (names.length > 0) {

      var name = remainingNames.pop();

      searchName(name, function (result) {

        // Only handle responses with at least one match
        if (result && result.hits.hits.length) {

          var hits = result.hits.hits.length;
          var line = name.replace('\n','') + ',' + hits + '\n'; // CSV syntax

          console.log('Found ' + hits + ' entries for ' + name);

          // Write result to output file
          fs.appendFile(outputFile, line, function (error) {

            if (error) { throw error; }
          });

          iterate(remainingNames);
        } else {

          iterate(remainingNames);
        }
      });
    } else {

      console.log('Finished processing ' + count + ' names');
      console.log('Saved file ' + outputFile);
    }
  }
}

// Query the search API and pass response to callback
function searchName(name, callback) {

  var url = encodeURI(searchUrl + name);

  request({

    url: url,
    json: true
  }, function (error, response, body) {

    if (!error && response.statusCode === 200) {

      callback(body);
    } else {

      // Ignore errors
      callback(undefined);
    }
  });
}
