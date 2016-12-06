// Get company information from Racius API
var getCompanyInfo = (function() {

  'use strict';

  var request = require('request');

  // Configuration
  var serviceUrl = 'https://www.racius.com/app/searchsolr/autocomplete/?q=';

  // Execute script if not used as a module
  if (!module.parent) {

    init(process.argv[2]);
  }

  function init(searchString, callback) {

    callback = callback || function (error, response) {

      if (error) { return console.error(error); }

      return console.log(response);
    };

    getData(searchString, callback);
  }

  function getData(searchString, callback) {

    if (!searchString) {

      return callback(new Error('No search string provided'));
    }

    request(serviceUrl + searchString, function (error, response, body) {

      if (!error && response.statusCode == 200) {

        return callback(null, JSON.parse(body));
      } else {

        return callback(error);
      }
    });
  }

  module.exports = {

    init: init
  };
}());
