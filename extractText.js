var fs = require('fs');
var path = require('path');
var dir = require('node-dir');
var tika = require('tika');

var inputFolder = './pdfs/';
var outputFolder = './texts/';

var options = {

  contentType: 'application/pdf',
  ocrLanguage: 'por',
  pdfExtractInlineImages: true,
  pdfExtractUniqueInlineImagesOnly: true,
};

(function init() {

  readFiles(processFiles);
})();

function readFiles(callback) {

  dir.files(inputFolder, function(err, files) {

    if (err) throw err;

    files = files.filter(function (file) {

      return file.search(/.*.pdf/) > -1;
    });

    callback(files);
  });
}

function processFiles(files) {

  var filesCount = files.length;

  (function recurse() {

    if (files.length > 0) {

      console.log('Processing file ' + files.length + ' of ' + filesCount);

      extractText(files.pop(), recurse);
    } else {

      console.log('Finished processing ' + filesCount + ' files');
    }
  })(files);
}

function extractText(filePath, callback) {

  tika.text(filePath, options, function (err, text) {

    if (err) throw err;

    var fileName = filePath.substr(filePath.lastIndexOf('/') + 1);

    saveFile(outputFolder + fileName + '.txt', text);
    callback();
  });
}

function saveFile(relativePath, string) {

  relativePath = path.normalize(relativePath);

  console.log('Saved file', relativePath);

  try {

    return fs.writeFileSync(relativePath, string, 'utf8');
  } catch (error) {

    console.log(error);
  }
}
