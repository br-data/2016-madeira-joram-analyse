// Search persons and related entities
var fs = require('fs');
var path = require('path');

// Configuration
var dirName = './text/',
  entity = 'Rosa Maria de Canha Ornelas Fraz[ã|a]o Afonso',
  nameCount = 0,
  nipcCount = 0,
  result = [];

(function init() {

  loadFiles();
})();

function loadFiles() {

  var files, fileCount;

  // Get file list
  files = fs.readdirSync(dirName);

  // Include only .txt files, exclude files from 2000 to 2005
  files = files.filter(function (file) {

    return file.indexOf('.txt') > -1 &&
      file.indexOf('2000') < 0 &&
      file.indexOf('2001') < 0 &&
      file.indexOf('2002') < 0 &&
      file.indexOf('2003') < 0 &&
      file.indexOf('2004') < 0 &&
      file.indexOf('2005') < 0;
  });

  fileCount = files.length;

  // Recursively go through the file list
  (function recurse (fileNumber) {

    if (fileNumber > 0) {

      var fileName = files[fileNumber - 1];

      // Read file content
      fs.readFile(dirName + fileName, 'utf8', function (error, body) {

        if (error) { throw error; }

        findRelated(fileName, body.toString(), function () {

          recurse(--fileNumber);
        });
      });
    } else {

      saveFile('unipcs.txt', getUnique(result).join('\n'));

      console.log('Found ' + nameCount + ' matches');
      console.log('Found ' + getUnique(result).length + ' unique NIPCs');
      console.log('Finished processing ' + fileCount + ' documents');
    }
  })(fileCount);
}

function findRelated(fileName, body, callback) {

  var nameRegexp, nameResults, nameIndices = [];
  var nipcRegexp, nipcResults, nipcIndices = [];
  var nipcs = [];

  // Remove line breaks
  body = body.replace(/\n|\r/g,' ');

  // Find all occurrences of the name
  nameRegexp = new RegExp(entity, 'gi');

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

function saveFile(relativePath, string) {

  // Normalize file path
  relativePath = path.normalize(relativePath);

  try {

    console.log('Saved file', relativePath);

    // Save file
    return fs.writeFileSync(relativePath, string, 'utf8');
  } catch (error) {

    console.log(error);
  }
}
