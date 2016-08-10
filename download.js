var fs = require('fs');
var url = require('url');
var path = require('path');

var Crawler = require('simplecrawler');

// Configuration
var baseUrl = 'http://www.gov-madeira.pt/joram/4serie/';
var dirName = './pdf/';

(function init() {

  downloadSite();
})();

function downloadSite() {

  var scraper = new Crawler(baseUrl);

  // Scraper configuration
  scraper.interval = 250;
  scraper.maxConcurrency = 5;
  scraper.depth = 2;

  scraper.on('fetchcomplete', function (queueItem, responseBuffer) {

    // Get filename
    var parsed = url.parse(queueItem.url);
    var fileName = path.basename(parsed.pathname);
    var filePath = path.join(__dirname, dirName, fileName);

    // Check if file is a PDF
    if (queueItem.stateData.contentType === 'application/pdf') {

      // Save file
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
