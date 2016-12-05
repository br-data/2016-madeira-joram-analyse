document.addEventListener('DOMContentLoaded', init, false);

function init() {

  $help = document.getElementById('help');
  $helpButton = document.getElementById('help-button');

  search.init();
  modal.init();

  $helpButton.addEventListener('click', function () {

    modal.open($help);
  });
}
