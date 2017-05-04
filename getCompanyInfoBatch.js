// Use a list of NIFS and resolves them to companies entity, address etc.
var fs = require('fs');
var getCompanyInfo = require('./getCompanyInfo.js');

// Use command line arguments or predefined paths
var inputFile = process.argv[2] || './results/nuno-telleria.txt';
var outputFile = process.argv[3] || './results/nuno-telleria-resolved.txt';

(function init() {

  loadFile(processEntities);
})();

function loadFile(callback) {

  // Empty existing output file
  fs.truncate(outputFile, 0, function () {

    // Read input file and execute callback
    fs.readFile(inputFile, 'utf8', callback);
  });
}

function processEntities(error, result) {

  if (error) { throw error; }

  // entity are sepeated by line breaks
  var entity = result.toString().split('\n');
  var count = entity.length;

  iterate(entity);

  function iterate(remainingEntities) {

    // Keep searching until the last name
    if (entity.length > 0) {

      var name = remainingEntities.pop();

      getCompanyInfo.init(name, function (error, result) {

        if (error) { console.error(error); }

        if (result && result.length) {

          var line = '';

          result = result[0];

          line += name + '\t';
          line += (result.nif ? result.nif : '') + '\t';
          line += (result.title ? result.title : '') + '\t';
          line += (result.city ? result.city : '') + '\t';
          line += (result.years ? result.years.join(', ') : '') + '\t';
          line += (result.last_year ? result.last_year : 'false');
          line += '\n';

          console.log('Found ' + result.title);

          // Write result to output file
          fs.appendFile(outputFile, line, function (error) {

            if (error) { throw error; }
          });
        }

        iterate(remainingEntities);
      });
    } else {

      console.log('Finished processing ' + count + ' entities');
      console.log('Saved file ' + outputFile);
    }
  }
}
