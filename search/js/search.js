var mammon = (function () {

  // var searchUrl = 'http://localhost:3003';
  var searchUrl = 'http://ddj.br.de/mammon-service';
  var $search, $button, $loading, $results, $sorting;
  var state = {
    query: undefined,
    sorting: undefined,
    mode: undefined,
    results: undefined
  };

  document.addEventListener('DOMContentLoaded', init, false);

  function init() {

    $search = document.getElementById('search');
    $button = document.getElementById('button');
    $loading = document.getElementById('loading');
    $sorting = document.getElementById('sorting');
    $results = document.getElementById('results');

    bindEvents();
    handleLocationChange();
  }

  function search(query, sorting, mode) {

    var urlString, queryString;

    state.query = query || $search.value;
    state.sorting = sorting || document.querySelector('input[name="sorting"]:checked').value;
    state.mode = mode || document.querySelector('input[name="mode"]:checked').value;

    urlString = encodeURI(searchUrl + '/' + state.mode + '/' + state.query);
    queryString = encodeURI('?m=' + state.mode + '&s=' + state.sorting + '&q=' + state.query);

    if (window.history) {

      window.history.pushState('', '', queryString);
    }

    $loading.style.visibility = 'visible';

    getJSON(urlString, function (results, error) {

      if (!error) {

        state.results = results;
        renderResults(results);
      } else {

        state.results = undefined;
        renderError(error);
      }
    });
  }

  function sortResults(docs) {

    state.sorting = document.querySelector('input[name="sorting"]:checked').value;

    if (state.sorting === 'date') {

      return docs.sort(function (a, b) {

        return new Date(b._source.date) - new Date(a._source.date);
      });
    } else if (state.sorting === 'relevance') {

      return docs.sort(function (a, b) {

        return new Date(b._score) - new Date(a._score);
      });
    }
  }

  function renderResults(results) {

    var docs = sortResults(results.hits.hits);
    var hitCount = 0;

    clearResults();

    var $count = createElement('div', $results, ['className', 'count']);

    for (var doc in docs) {

      var type = docs[doc]._type;
      var name = docs[doc]._source.name;
      var series = docs[doc]._source.series;
      var issue = docs[doc]._source.issue;
      var supplement = docs[doc]._source.issue;
      var date = new Date(docs[doc]._source.date).toLocaleDateString();
      var file = docs[doc]._source.file;
      var hits = docs[doc].highlight.body || docs[doc].highlight['body.folded'];

      var $docWrapper = createElement('div', $results, ['className', 'document']);

      var $download = createElement('div', $docWrapper, ['className', 'download']);
      createElement('a', $download, ['textContent', 'PDF'], ['className', 'pdf'],
        ['href', ('./pdf/' + file.replace('.txt', ''))], ['target', '_blank']);
      createElement('a', $download, ['textContent', 'Text'], ['className', 'text'],
        ['href', ('./text/' + file)], ['target', '_blank']);

      var $docHeader = createElement('div', $docWrapper, ['className', 'header ' + type]);
      createElement('strong', $docHeader, ['textContent', (date + ' ')], ['className', 'date']);
      createElement('span', $docHeader, ['textContent', (name + ' ' + series + ' ' + issue + ' ' +
        (supplement ? 'Supplement' : ''))], ['className', 'title']);

      hitCount += hits.length;

      for (var hit in hits) {

        createElement('p', $docWrapper, ['innerHTML', hits[hit]], ['className', 'hit']);
      }
    }

    createElement('p', $count,
      ['textContent', (hitCount + ' Treffer in ' + docs.length + ' Dokumenten (' + results.took + ' ms)')]);

    if (docs.length === 1000) {

      createElement('p', $count,
        ['textContent', ' Es werden nicht alle Suchergebnisse angezeigt']);
    }

    showResults();
  }

  function renderError(error) {

    clearResults();
    createElement('strong', $results, ['textContent', error.message], ['className', 'error']);
    showResults();
  }

  function clearResults() {

    $results.classList.remove('visible');
    emptyElement($results);
  }

  function showResults() {

    setTimeout(function () {

      $loading.style.visibility = 'hidden';
      $results.classList.add('visible');
    }, 750);
  }

  function bindEvents() {

    window.addEventListener('popstate', handleLocationChange, false);

    $button.addEventListener('click', handleSearch, false);
    $search.addEventListener('keypress', handleEnter, false);
    $sorting.addEventListener('change', handleSorting, false);
  }

  function handleLocationChange() {

    if (getQueryParameter('q')) {

      state.query = decodeURIComponent(getQueryParameter('q'));
      state.sorting = decodeURIComponent(getQueryParameter('s')) || 'date';
      state.mode = decodeURIComponent(getQueryParameter('m')) || 'match';

      $search.value = state.query;
      document.querySelector('input[name=' + state.sorting + ']:checked');
      document.querySelector('input[name=' + state.mode + ']:checked');

      search(state.query, state.sorting, state.mode);
    }
  }

  function handleSearch() {

    search();
  }

  function handleEnter(e) {

    var event = e || window.event;
    var charCode = event.which || event.keyCode;

    if (charCode == '13') {

      search();
      e.preventDefault();

      return false;
    }
  }

  function handleSorting(e) {

    if (state.results) {

      renderResults(state.results, e.target.value);
    }
  }

  function getQueryParameter(name) {

    var param = location.search.match(new RegExp(name + '=(.+?)(&|$)'));

    return param ? decodeURI(param[1]) : false;
  }

  function getJSON(url, callback) {

    var httpRequest = (window.XMLHttpRequest) ? new XMLHttpRequest() : new ActiveXObject('Microsoft.XMLHTTP');

    httpRequest.onreadystatechange = function () {

      if (httpRequest.readyState === 4 || httpRequest.readyState === 0) {

        if (httpRequest.status === 200) {

          try {

            callback(JSON.parse(httpRequest.responseText));
          } catch (error) {

            console.error(error);

            callback({}, {
              message: 'Fehler: unerwartete Antwort vom Server'
            });
          }
        } else {

          callback({}, {
            message: 'Fehler: falsche Anfrage oder Ressource nicht verfügbar'
          });
        }
      }
    };

    httpRequest.onerror = function (error) {

      console.error(error);

      callback({}, {
        message: 'Fehler: keine Antwort vom Server'
      });
    };

    httpRequest.open('GET', url);
    httpRequest.send();
  }

  function createElement(type, parent) {

    var element = document.createElement(type);

    for (var i = 2; i < arguments.length; i++) {

      // Check if object is an array
      if (Object.prototype.toString.call(arguments[i]) === '[object Array]') {

        element[arguments[i][0]] = arguments[i][1];
      }
    }

    if (parent && isElement(parent)) {

      parent.appendChild(element);

      return element;
    } else {

      return element;
    }
  }

  function emptyElement(element) {

    while (element.hasChildNodes()) {

      element.removeChild(element.lastChild);
    }
  }

  function isElement(o){

    return (
      typeof HTMLElement === 'object' ? o instanceof HTMLElement :
      o && typeof o === 'object' && o !== null && o.nodeType === 1 && typeof o.nodeName==='string'
    );
  }

  return {
    init: init,
    search: search
  };
})();
