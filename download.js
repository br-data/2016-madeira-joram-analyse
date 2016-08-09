var fs = require('fs');
var url = require('url');
var path = require('path');

var Crawler = require('simplecrawler');

var baseUrl = 'http://www.gov-madeira.pt/joram/4serie/';
var dirName = './download/';

(function init() {

  downloadSite();
})();

function downloadSite(callback) {

  var scraper = new Crawler(baseUrl);

  scraper.interval = 250;
  scraper.maxConcurrency = 5;
  scraper.depth = 2;

  scraper.on('fetchcomplete', function (queueItem, responseBuffer) {

    var parsed = url.parse(queueItem.url);
    var fileName = path.basename(parsed.pathname);
    var filePath = path.join(__dirname, dirName, fileName);

    if (queueItem.stateData.contentType === 'application/pdf') {

      fs.writeFile(filePath, responseBuffer, function (error) {

        if (error) throw error;

        console.log('Saved', filePath);
      });
    }
  });

  scraper.on('crawlstart', function () {

    console.log('Connected to ' + baseUrl);
  });

  scraper.on('complete', function () {

    console.log('Finished downloading');
  });

  scraper.start();
}
