// Import text files to Elasticsearch
var fs = require('fs');
var elastic = require('elasticsearch');

// Configuration
var dirName = './text/';
var client = new elastic.Client({

  host: 'localhost:9200'
});

(function init() {

  loadFiles();
})();

function loadFiles() {

  // Get all filenames in the directory
  fs.readdirSync(dirName).forEach(function (fileName) {

    // Get file content
    var fileContent = fs.readFileSync(dirName + fileName, 'utf8');

    saveToElastic(fileName, fileContent);
  });
}

function saveToElastic(fileName, fileContent) {

  // Get date from filename, if possible
  var date = fileName.match(/\d{4}-\d{2}-\d{2}/);
  date = date ? new Date(date[0]) : null;

  // Get issue number from filename, if possible
  var issue = fileName.match(/\b\d{3}\b/);
  issue = issue ? parseInt(issue) : null;

  // Get supplement from filename, if possible
  var supplement = fileName.match(/Supl/);
  supplement = supplement ? true : false;

  client.create({
    index: 'joram',
    type: 'doc',
    body: {
      name: 'Jornal Oficial da Região Autónoma da Madeira',
      series: 'IV',
      issue: issue,
      supplement: supplement,
      date: date,
      file: fileName,
      body: fileContent
    }
  }, function (error) {

    if (error) throw error;

    console.log('Inserted document ' + file + ' to ElasticSearch');
  });
}
