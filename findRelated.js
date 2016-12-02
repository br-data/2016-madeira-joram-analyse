// Search persons and related entities
var findRelated = (function() {

  'use strict';

  var fs = require('fs');
  var path = require('path');

  // Configuration
  var inputDir = './text';
  var searchString = 'Roberto Luiz Homem';
  var outputDir = './results';

  var nameCount, nipcCount;
  var fileList, result;

  var callback = function() { return; };

  // Execute script if not used as a module
  if (!module.parent) {

    init(process.argv[2], process.argv[3], process.argv[4]);
  }

  function init(_inputDir, _searchString, _outputDir, _callback) {

    // Overwrite default configuration with arguments
    // from module or command line interface
    inputDir = _inputDir || inputDir;
    searchString = _searchString || searchString;
    outputDir = _outputDir || outputDir;
    callback = _callback || callback;

    // Reset results
    nameCount = 0;
    nipcCount = 0;
    fileList = [];
    result = [];

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

      return file.indexOf('.txt') > -1 &&
        file.indexOf('2000') < 0 &&
        file.indexOf('2001') < 0 &&
        file.indexOf('2002') < 0 &&
        file.indexOf('2003') < 0 &&
        file.indexOf('2004') < 0 &&
        file.indexOf('2005') < 0;
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

        findRelated(fileName, body.toString(), function () {

          // Recursion
          processFiles(--fileNumber);
        });
      });
    } else {

      // Get unique NIPCs
      var uniqueNipcs = getUnique(result);

      console.log('Completed search for ' + searchString);
      console.log('Found ' + nameCount + ' matches');
      console.log('Found ' + getUnique(result).length + ' unique NIPCs');

      saveFile(
        path.join(outputDir, (dashcase(searchString) + '.txt')),
        uniqueNipcs.join('\n')
      );

      callback();
    }
  }

  function findRelated(fileName, body, callback) {

    var nameRegexp, nameResults, nameIndices = [];
    var nipcRegexp, nipcResults, nipcIndices = [];
    var nipcs = [];

    // Remove line breaks
    body = body.replace(/\n|\r/g,' ');

    // Find all occurrences of the searchString
    nameRegexp = new RegExp(searchString, 'gi');

    while ((nameResults = nameRegexp.exec(body))) {

      nameIndices.push(nameResults.index);
    }

    // Find all NIPCs starting with 5, 6, 7 or 8 (businesses)
    nipcRegexp = new RegExp('\\s[5678][\\d|\\s]{7,9}\\d\\s', 'g');

    while ((nipcResults = nipcRegexp.exec(body))) {

      var nipc = nipcResults[0].replace(/\s/g,'').trim();

      // Check for correct NIPC length
      if (nipc.length === 9) {

        nipcIndices.push({

          result: nipc,
          index: nipcResults.index
        });
      }
    }

    // Do nothing if there are more names than NIPCs
    if (nipcIndices.length > nameIndices.length) {

      nipcs = nameIndices.map(function (nameIndex) {

        return getClosest(nipcIndices, nameIndex);
      });
    }

    // Update counter
    nameCount += nameIndices.length;
    nipcCount += nipcIndices.length;

    // Save result
    result.push.apply(result, nipcs);

    callback();
  }

  function getClosest(arr, closestTo){

    var result;

    for (var i = 0; i < arr.length; i++) {

      if (arr[i].index < closestTo) {

        result = arr[i].result;
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

  function dashcase(string) {

    return string.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .substring(0, 32);
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
