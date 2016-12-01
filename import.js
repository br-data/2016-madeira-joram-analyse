// Import text files to Elasticsearch
var fs = require('fs');
var elastic = require('elasticsearch');

// Configuration
var dirName = process.argv[2] || './text/';
var client = new elastic.Client({ host: 'localhost:9200' });
var index = 'joram';
var type = 'doc';

var fileCount = 0;
var fileList = [];

(function init() {

  loadFiles();
})();

function loadFiles() {

  // Get file list
  fileList = fs.readdirSync(dirName);

  // Include only .txt files
  fileList = fileList.filter(function (file) {

    return file.indexOf('.txt') > -1;
  });

  // Save file count
  fileCount = fileList.length;

  processFiles(fileCount);
}

function processFiles (fileNumber) {

  if (fileNumber > 0) {

    var fileName = fileList[fileNumber - 1];

    // Read file content
    fs.readFile(dirName + fileName, 'utf8', function (error, body) {

      if (error) { throw error; }

      saveToElastic(fileName, body, function () {

        // Recursion
        processFiles(--fileNumber);
      });
    });

  } else {

    console.log('Finished processing ' + fileCount + ' documents');
  }
}

// Saves file content and meta data to ElasticSearch
function saveToElastic(fileName, body, callback) {

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
      body: body
    }
  }, function (error) {

    if (error) throw error;

    console.log('Inserted document ' + fileName + ' to ElasticSearch');
    callback();
  });
}
