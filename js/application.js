function getSize() { 
  var reg = new RegExp("(^|&)size=([^&]*)(&|$)", "i");
  var r = location.search.substr(1).match(reg);
  if (r != null) {
    return parseInt(unescape(decodeURI(r[2])));
  }
  return 8; 
}

var game;
window.requestAnimationFrame(function () {
  var size = getSize();
  var container = document.getElementById('grid-container');
  var html = '';
  for (var i = 0; i < size; ++i) {
    html += '<div class="grid-row">';
    for (var j = 0; j < size; ++j) {
      html += '<div class="grid-cell"></div>';
    }
    html += '</div>';
  }
  container.innerHTML = html;
  game = new GameManager(size, KeyboardInputManager, HTMLActuator, LocalScoreManager);
});

var last = '';
var dir = 0;
var cnt = 0;

var mover = undefined;

function doMovementPattern(moveType) {
  if (typeof(mover) != 'undefined') {
    clearInterval(mover);
  }
  mover = setInterval(moveType, 50);
}

function stopMovement() {
  if (typeof(mover) != 'undefined') {
    clearInterval(mover);
    mover = undefined;
  }
}

function corner() {
  if (game == null || typeof(game) === "undefined") {
    return;
  }
  var item = document.getElementById('tile-container');
  if (item.innerHTML == last) {
    if (++cnt > 0) {
      dir = 1 - dir;
      cnt = 0;
    }
  }
  last = item.innerHTML;
  if (0 === dir) {
    game.move(0);
    setTimeout(function() {game.move(3)}, 20);
  } else {
    game.move(0);
    setTimeout(function() {game.move(1)}, 20);
  }
}

function swing() {
  if (game == null || typeof(game) === "undefined") {
    return;
  }
  var item = document.getElementById('tile-container');
  if (item.innerHTML == last) {
    if (++cnt > 0) {
      dir = 1 - dir;
      cnt = 0;
    }
  }
  last = item.innerHTML;
  if (0 === dir) {
    game.move(0);
    setTimeout(function() {game.move(2)}, 20);
  } else {
    game.move(1);
    setTimeout(function() {game.move(3)}, 20);
  }
}

function swirl() {
  dir = (dir + 1) % 4;
  game.move(dir);
}

function random() {
  game.move(Math.floor(Math.random() * 4));
}

function alwaysTwo() {
  game.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
      var tile = new Tile(this.grid.randomAvailableCell(), 2);
      this.grid.insertTile(tile);
    }
  };
  game.restart();
}

function fibonacci() {
  var fib = new Array();
  var a = 1, b = 1;
  fib.push(a);
  fib.push(b);
  while (a + b <= 2147483648) {
    var c = a + b;
    fib.push(c);
    a = b;
    b = c;
  }  
  game.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
      var tile = new Tile(this.grid.randomAvailableCell(), 1);
      this.grid.insertTile(tile);
    }
  };
  game.tileMatchesAvailable = function () {
    var self = this;
    var tile;
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x: x, y: y });
        if (tile) {
          for (var direction = 0; direction < 4; direction++) {
            var vector = self.getVector(direction);
            var cell   = { x: x + vector.x, y: y + vector.y };
            var other  = self.grid.cellContent(cell);
            if (other) {
              var sum = other.value + tile.value;
              for (var i = 0; i < fib.length; ++i) {
                if (sum === fib[i]) {
                  return true;
                }
              }
            }
          }
        }
      }
    }
    return false;
  };
  game.move = function (direction) {
    var self = this;
    if (this.over || this.won) return;
    var cell, tile;
    var vector     = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved      = false;
    this.prepareTiles();
    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);
        if (tile) {
          var positions = self.findFarthestPosition(cell, vector);
          var next      = self.grid.cellContent(positions.next);
          if (next && !next.mergedFrom) {
            var isMerged = false;
            for (var i = 0; i < fib.length; ++i) {
              if (tile.value + next.value === fib[i]) {
                var merged = new Tile(positions.next, tile.value + next.value);
                merged.mergedFrom = [tile, next];
                self.grid.insertTile(merged);
                self.grid.removeTile(tile);
                tile.updatePosition(positions.next);
                self.score += merged.value;
                if (merged.value === 5702887) self.won = true;
                isMerged = true;
                break;
              }
            }
            if (!isMerged) {
              self.moveTile(tile, positions.farthest);
            }
          } else {
            self.moveTile(tile, positions.farthest);
          }
          if (!self.positionsEqual(cell, tile)) {
            moved = true; 
          }
        }
      });
    });
    if (moved) {
      this.addRandomTile();
      if (!this.movesAvailable()) {
        this.over = true; 
      }
      this.actuate();
    }
  };
  game.inputManager.events["move"] = [];
  game.inputManager.on("move", game.move.bind(game));
  game.restart();
}

function threes() {
  game.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
      var value = Math.random() < 0.7 ? (Math.random() < 0.5 ? 1 : 2) : 3;
      var tile = new Tile(this.grid.randomAvailableCell(), value);
      this.grid.insertTile(tile);
    }
  };
  game.tileMatchesAvailable = function () {
    var self = this;
    var tile;
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x: x, y: y });
        if (tile) {
          for (var direction = 0; direction < 4; direction++) {
            var vector = self.getVector(direction);
            var cell   = { x: x + vector.x, y: y + vector.y };
            var other  = self.grid.cellContent(cell);
            if (other) {
              if (((tile.value === 1 && other.value === 2) || 
                   (tile.value === 2 && other.value === 1) || 
                   (tile.value > 2 && other.value > 2 && tile.value === other.value))) {
                return true;
              }
            }
          }
        }
      }
    }
    return false;
  };
  game.move = function (direction) {
    var self = this;
    if (this.over || this.won) return;
    var cell, tile;
    var vector     = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved      = false;
    this.prepareTiles();
    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);
        if (tile) {
          var positions = self.findFarthestPosition(cell, vector);
          var next      = self.grid.cellContent(positions.next);
          if (next && !next.mergedFrom && ((tile.value === 1 && next.value === 2) || 
                                           (tile.value === 2 && next.value === 1) || 
                                           (tile.value > 2 && next.value > 2 && tile.value === next.value))) {
            var merged = new Tile(positions.next, tile.value + next.value);
            merged.mergedFrom = [tile, next];
            self.grid.insertTile(merged);
            self.grid.removeTile(tile);
            tile.updatePosition(positions.next);
            self.score += merged.value;
            if (merged.value === 1610612736) self.won = true;
          } else {
            self.moveTile(tile, positions.farthest);
          }
          if (!self.positionsEqual(cell, tile)) {
            moved = true; 
          }
        }
      });
    });
    if (moved) {
      this.addRandomTile();
      if (!this.movesAvailable()) {
        this.over = true; 
      }
      this.actuate();
    }
  };
  game.inputManager.events["move"] = [];
  game.inputManager.on("move", game.move.bind(game));
  game.restart();
}

function mergeAny() {
  game.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
      var value = Math.random() < 0.5 ? 1 : 2;
      var tile = new Tile(this.grid.randomAvailableCell(), value);
      this.grid.insertTile(tile);
    }
  };
  game.tileMatchesAvailable = function () {
    var self = this;
    var tile;
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x: x, y: y });
        if (tile) {
          for (var direction = 0; direction < 4; direction++) {
            var vector = self.getVector(direction);
            var cell   = { x: x + vector.x, y: y + vector.y };
            var other  = self.grid.cellContent(cell);
            if (other) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };
  game.move = function (direction) {
    var self = this;
    if (this.over || this.won) return;
    var cell, tile;
    var vector     = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved      = false;
    this.prepareTiles();
    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);
        if (tile) {
          var positions = self.findFarthestPosition(cell, vector);
          var next      = self.grid.cellContent(positions.next);
          if (next && !next.mergedFrom) {
            var merged = new Tile(positions.next, tile.value + next.value);
            merged.mergedFrom = [tile, next];
            self.grid.insertTile(merged);
            self.grid.removeTile(tile);
            tile.updatePosition(positions.next);
            self.score += merged.value;
          } else {
            self.moveTile(tile, positions.farthest);
          }
          if (!self.positionsEqual(cell, tile)) {
            moved = true; 
          }
        }
      });
    });
    if (moved) {
      this.addRandomTile();
      if (!this.movesAvailable()) {
        this.over = true; 
      }
      this.actuate();
    }
  };
  game.inputManager.events["move"] = [];
  game.inputManager.on("move", game.move.bind(game));
  game.restart();
}

function powerTwo() {
  var index = 0;
  game.addRandomTile = function () {
    if (this.grid.cellsAvailable()) {
      var value = index === 0 ? 1 : index;
      if (index == 0) {
        index = 1;
      } else {
        index <<= 1;
        if (index > 65536) {
          index = 0;
        }
      }
      var tile = new Tile(this.grid.randomAvailableCell(), value);
      this.grid.insertTile(tile);
    }
  };
  game.tileMatchesAvailable = function () {
    var self = this;
    var tile;
    for (var x = 0; x < this.size; x++) {
      for (var y = 0; y < this.size; y++) {
        tile = this.grid.cellContent({ x: x, y: y });
        if (tile) {
          for (var direction = 0; direction < 4; direction++) {
            var vector = self.getVector(direction);
            var cell   = { x: x + vector.x, y: y + vector.y };
            var other  = self.grid.cellContent(cell);
            if (other && tile.value === other.value) {
              return true;
            }
          }
        }
      }
    }
    return false;
  };
  game.move = function (direction) {
    var self = this;
    if (this.over || this.won) return;
    var cell, tile;
    var vector     = this.getVector(direction);
    var traversals = this.buildTraversals(vector);
    var moved      = false;
    this.prepareTiles();
    traversals.x.forEach(function (x) {
      traversals.y.forEach(function (y) {
        cell = { x: x, y: y };
        tile = self.grid.cellContent(cell);
        if (tile) {
          var positions = self.findFarthestPosition(cell, vector);
          var next      = self.grid.cellContent(positions.next);
          if (next && !next.mergedFrom && tile.value === next.value) {
            var merged = new Tile(positions.next, tile.value + next.value);
            merged.mergedFrom = [tile, next];
            self.grid.insertTile(merged);
            self.grid.removeTile(tile);
            tile.updatePosition(positions.next);
            self.score += merged.value;
          } else {
            self.moveTile(tile, positions.farthest);
          }
          if (!self.positionsEqual(cell, tile)) {
            moved = true; 
          }
        }
      });
    });
    if (moved) {
      this.addRandomTile();
      if (!this.movesAvailable()) {
        this.over = true; 
      }
      this.actuate();
    }
  };
  game.inputManager.events["move"] = [];
  game.inputManager.on("move", game.move.bind(game));
  game.restart();
}

function timeRush(sec) {
  stopMovement();
  var autos = document.getElementsByName('automove');
  for (var i in autos) {
    autos[i].disabled = 'disabled';
  }
  game.restart();
  var cnt = sec;
  function countDown() {
    if (game.over) {
      cnt = 0;
    }
    var item = document.getElementById('game-intro');
    item.innerText = "Remaining Time: " + cnt;
    if (cnt == 0) {
      game.over = true;
      game.actuate();
      item.innerText = sec + "s time rush result: " + game.score;
      var autos = document.getElementsByName('automove');
      for (var i in autos) {
        autos[i].disabled = '';
      }
    } else {
      setTimeout(function() {
        --cnt;
        countDown();
      }, 1000);
    }
  }
  countDown();
}