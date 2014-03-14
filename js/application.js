// Wait till the browser is ready to render the game (avoids glitches)
var game;
window.requestAnimationFrame(function () {
  game = new GameManager(8, KeyboardInputManager, HTMLActuator, LocalScoreManager);
});

last = '';
dir = 0;
cnt = 0;

function auto() {
  if (game == null || typeof(game) === "undefined") {
    return;
  }
  var item = document.getElementById('tile-container');
  if (item.innerHTML == last) {
    if (++cnt > 1) {
      dir = 1 - dir;
      cnt = 0;
    }
  }
  last = item.innerHTML;
  if (0 === dir) {
    game.move(0);
    setTimeout(function() {
      game.move(3);
      auto();
    }, 100);
  } else {
    game.move(0);
    setTimeout(function() {
      game.move(1);
      auto();
    }, 100);
  }
}

function swirl(dir) {
  game.move(dir);
  setTimeout(function() {
    swirl((dir + 1) % 4);
  }, 100);
}