var fs = require('fs');
var findRelated = require('./findRelated.js');

// Configuration
var inputFile = process.argv[2] || './gerentes.txt';

var nameCount = 0;
var nameList = [];

(function init() {

  loadFile();
})();

function loadFile() {

  // Read input file and execute callback
  fs.readFile(inputFile, 'utf8', function (error, result) {

    if (error) { throw error; }

    nameList = result.toString().split('\n');
    nameCount = nameList.length;

    processNames(nameCount);
  });
}

function processNames(nameIndex) {

  if (nameIndex > 0) {

    // Get current name
    var name = nameList[nameIndex - 1];

    findRelated.init('./text', name, './result', function () {

      // Recursion
      processNames(--nameIndex);
    });
  } else {

    console.log('Finished processing', nameCount, 'names');
  }
}

