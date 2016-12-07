// Search persons and related entities
var findRelated = (function() {

  'use strict';

  var fs = require('fs');
  var path = require('path');

  // Configuration
  var inputDir = './text';
  var outputDir = './results';

  var fileList;
  var nipcData, nifData;

  var callback = function() { return; };

  // Execute script if not used as a module
  if (!module.parent) {

    init(process.argv[2], process.argv[3], process.argv[4]);
  }

  function init(_inputDir, _outputDir, _callback) {

    // Overwrite default configuration with arguments
    // from module or command line interface
    inputDir = _inputDir || inputDir;
    outputDir = _outputDir || outputDir;
    callback = _callback || callback;

    // Reset results
    fileList = [];
    nipcData = [];
    nifData = [];

    // Create output folder if missing
    if (!fs.existsSync(outputDir)) {

      fs.mkdirSync(outputDir);
    }

    loadFiles(_callback);
  }

  function loadFiles() {

    // Get file list
    fileList = fs.readdirSync(inputDir);

    // Include only .txt files, exclude files from 2000 to 2005
    fileList = fileList.filter(function (file) {

      return file.indexOf('.txt') > -1;
        // file.indexOf('2000') < 0 &&
        // file.indexOf('2001') < 0 &&
        // file.indexOf('2002') < 0 &&
        // file.indexOf('2003') < 0 &&
        // file.indexOf('2004') < 0 &&
        // file.indexOf('2005') < 0;
    });

    processFiles(fileList.length);
  }

  // Recursively go through the file list
  function processFiles(fileNumber) {

    if (fileNumber > 0) {

      var fileName = fileList[fileNumber - 1];

      // Read file content
      fs.readFile(path.join(inputDir, fileName), 'utf8', function (error, body) {

        if (error) { throw error; }

        processBody(fileName, body.toString(), function () {

          // Recursion
          processFiles(--fileNumber);
        });
      });
    } else {

      // Get unique NIFs
      var uniqueNifs = getUnique(nifData);

      // Get unique NIPCs
      var uniqueNipcs = getUnique(nipcData);

      console.log('Completed search for ' + fileList.length + ' documents');
      console.log('Found ' + uniqueNifs.length + ' unique NIFs ' + nifData.length);
      console.log('Found ' + uniqueNipcs.length + ' unique NIPCs ' + nipcData.length);

      // saveFile(
      //   path.join(outputDir, (dashcase(searchString) + '.txt')),
      //   uniqueNipcs.join('\n')
      // );

      callback();
    }
  }

  function processBody(fileName, body, callback) {


    // Find all NIFs starting with 1 or 2 (persons)
    var nifRegexp = new RegExp('\\s[12][\\d|\\s]{7,9}\\d\\s', 'g');

    // Find all NIPCs starting with 5, 6, 7, 8 or 9 (businesses)
    var nipcRegexp = new RegExp('\\s[5678][\\d|\\s]{7,9}\\d\\s', 'g');

    // Remove line breaks
    body = body.replace(/\n|\r/g,' ');

    // Save result
    nifData.push.apply(nifData, findString(body, nifRegexp));
    nipcData.push.apply(nipcData, findString(body, nipcRegexp));

    callback();
  }

  function findString(body, regex) {

    var search, result = [];

    while ((search = regex.exec(body))) {

      var match = search[0].replace(/\s/g,'').trim();

      // Check for correct nif length
      if (match.length === 9) {

        result.push(match);
      }
    }

    return result;
  }

  // Returns a sorted array with unique values
  function getUnique(arr) {

    var result = [];

    arr.sort();

    for (var i = 0; i < arr.length; ++i) {

      if (i === 0 || arr[i] != arr[i - 1]) {

        result.push(arr[i]);
      }
    }

    return result;
  }

  function saveFile(relativePath, string) {

    // Normalize file path
    relativePath = path.normalize(relativePath);

    try {

      console.log('Saved file', relativePath);

      return fs.writeFileSync(relativePath, string, 'utf8');
    } catch (error) {

      console.error(error);
    }
  }

  module.exports = {

    init: init
  };
}());
