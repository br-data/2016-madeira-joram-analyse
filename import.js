// Import text files to Elasticsearch
var fs = require('fs');
var elastic = require('elasticsearch');

// Configuration
var dirName = './text/';
var client = new elastic.Client({ host: 'localhost:9200' });
var index = 'joram';
var type = 'doc';

(function init() {

  loadFiles();
})();

function loadFiles() {

  // Get file list
  var files = fs.readdirSync(dirName);
  var fileCount = files.length;

  // Recursively go through the file list
  (function recurse (fileNumber) {

    if (fileNumber > 0) {

      var fileName = files[fileNumber];

      // Read file content
      fs.readFile(dirName + fileName, 'utf8', function (fileContent) {

        saveToElastic(fileName, fileContent, function () {

          recurse(--fileNumber);
        });
      });

    } else {

      console.log('Finished processing ' + fileCount + ' documents');
    }
  })(fileCount);
}

// Saves file content and meta data to ElasticSearch
function saveToElastic(fileName, fileContent, callback) {

  // Get date from filename, if possible
  var date = fileName.match(/\d{4}-\d{1,2}-\d{1,2}/);
  date = date ? new Date(date[0]) : null;

  // Get issue number from filename, if possible
  var issue = fileName.match(/\b\d{3}\b/);
  issue = issue ? parseInt(issue) : null;

  // Get supplement from filename, if possible
  var supplement = fileName.match(/Supl/);
  supplement = supplement ? true : false;

  client.create({
    index: index,
    type: type,
    body: {
      name: 'JORAM',
      series: 'IV',
      issue: issue,
      supplement: supplement,
      date: date,
      file: fileName,
      body: fileContent
    }
  }, function (error) {

    if (error) throw error;

    console.log('Inserted document ' + fileName + ' to ElasticSearch');
    callback();
  });
}
