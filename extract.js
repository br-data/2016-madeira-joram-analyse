var extract = (function () {

  // Extract text from PDF files, using OCR if necessary
  var fs = require('fs');
  var path = require('path');
  var dir = require('node-dir');
  var tika = require('tika');

  // Configuration
  var inputDir = './pdf/';
  var outputDir = './text/';

  // Tika and OCR options
  var options = {

    contentType: 'application/pdf',
    ocrLanguage: 'por',
    pdfEnableAutoSpace: true,
    pdfExtractInlineImages: true
  };

  var callback = function() { return; };

  // Execute script if not used as a module
  if (!module.parent) {

    init(
      process.argv[2],
      process.argv[3],
      process.argv[4],
      process.argv[5]
    );
  }

  function init(_inputDir, _outputDir, _language, _callback) {

    // Overwrite default configuration with arguments
    // from module or command line interface
    inputDir = _inputDir || inputDir;
    outputDir = _outputDir || outputDir;
    options.language = _language || options.language;
    callback = _callback || callback;

    // Create output folder if missing
    if (!fs.existsSync(outputDir)) {

      fs.mkdirSync(outputDir);
    }

    readFiles(processFiles);
  }

  function readFiles(callback) {

    // Get a list of all files
    dir.files(inputDir, function(error, files) {

      if (error) { throw error; }

      // Include PDF files only
      files = files.filter(function (file) {

        return file.search(/.*.pdf/) > -1;
      });

      callback(files);
    });
  }

  function processFiles(files) {

    var filesCount = files.length;

    console.log('Started file processing (' + (new Date().toLocaleString()) + ')');

    // Recursively process the files
    (function recurse() {

      if (files.length > 0) {

        console.log('Processing file ' + (filesCount - files.length + 1) + ' of ' + filesCount);

        extractText(files.pop(), recurse);
      } else {

        console.log('Finished processing ' + filesCount + ' files (' + (new Date().toLocaleString()) + ')');
      }
    })(files);
  }

  function extractText(filePath, callback) {

    // Extract text from PDF file
    tika.text(filePath, options, function (error, result) {

      if (error) { throw error; }

      var fileName = filePath.substr(filePath.lastIndexOf('/') + 1);

      // Save extracted content as text file
      saveFile(path.join(outputDir, fileName + '.txt'), result);
      callback();
    });
  }

  function saveFile(relativePath, string) {

    // Normalize file path
    relativePath = path.normalize(relativePath);

    try {

      console.log('Saved file', relativePath);

      // Save file
      return fs.writeFileSync(relativePath, string, 'utf8');
    } catch (error) {

      console.error(error);
    }
  }

  module.exports = {

    init: init
  };
}());
