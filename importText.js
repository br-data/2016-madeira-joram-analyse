// Import JSON files to MongoDB
var fs = require('fs');
var crypto = require('crypto');
var elastic = require('elasticsearch');

var md5 = crypto.createHash('md5');

var filePath = './texts/';
var client = new elastic.Client({

  host: 'localhost:9200'
});


(function init() {

  loadFiles();
})();

function loadFiles() {

  var files = [];

  fs.readdirSync(filePath).forEach(function (file) {

    var body = fs.readFileSync(filePath + file, 'utf8');

    saveToElastic(file, body);
  });
}

function saveToElastic(file, body) {

  var date = file.match(/\d{4}-\d{2}-\d{2}/);
  date = date ? new Date(date[0]) : null;

  var issue = file.match(/\b\d{3}\b/);
  issue = issue ? parseInt(issue) : null;

  var supplement = file.match(/Supl/);
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
      file: file,
      body: body
    }
  }, function (error, response) {

    if (error) throw error;

    console.log('Inserted document ' + file + ' to ElasticSearch');
  });
}
