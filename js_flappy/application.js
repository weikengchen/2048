// Wait till the browser is ready to render the game (avoids glitches)
window.requestAnimationFrame(function () {
  var game = new GameManager(4, KeyboardInputManager, HTMLActuator, LocalScoreManager);
  var cnt = 0;
  setInterval(function() {
    if (cnt > 0) {
      --cnt;
      return;
    }
    var birdTop = parseFloat(game.actuator.birdobj.style.top);
    var blockATop = parseFloat(game.actuator.blockobja.style.top);
    var blockBTop = parseFloat(game.actuator.blockobjb.style.top);
    var blockCTop = parseFloat(game.actuator.blockobjc.style.top);
    var blockDTop = parseFloat(game.actuator.blockobjd.style.top);
    var blockALeft = parseFloat(game.actuator.blockobja.style.left);
    var type1 = blockATop < 180 ? (blockBTop < 180 ? 0 : 1) : 2;
    var type2 = blockCTop < 180 ? (blockDTop < 180 ? 0 : 1) : 2;
    if (blockALeft < -80) {
      type1 = type2;
    }
    var flag = false;
    if (type1 === 0) {
      if (birdTop > 340) {
        flag = true;
      }
    } else if (type1 === 1) {
      if (birdTop > 220) {
        flag = true;
      }
    } else {
      if (birdTop > 120) {
        flag = true;
      }
    }
    if (flag) {
      game.jump();
      cnt = 1;
    }
  }, 50);
});
