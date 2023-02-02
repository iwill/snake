/**
 * Usage:

Doc:
https://nodejs.org/api/all.html
https://nodejs.org/api/all.html#readline_readline_clearline_stream_dir

Demo:
https://nodejs.org/api/all.html#readline_example_tiny_cli
https://nodejs.org/api/all.html#readline_example_read_file_stream_line_by_line

node progress:
https://github.com/visionmedia/node-progress/blob/master/lib/node-progress.js

readline.cursorTo(stream, x, y)
readline.moveCursor(stream, dx, dy)
readline.clearLine(stream, direction) left: -1, right: 1, all: 0
readline.clearScreenDown(stream)
readline.createInterface(options)

rl.write(data[, key])
rl.pause()
rl.resume()
rl.close()

rl.setPrompt(prompt)
rl.question(query, callback)
replServer.displayPrompt([preserveCursor])

// config
var config = {
    width: 10,
    height: 10,
    speed: 1000,
    classes: ["red", "green", "blue"]
};

// canvas
var $snakeCancas = $("#snakeCancas");
for (var x = 0; x < config.width; x++) {
    for (var y = 0; y < config.height; y++) {
        var $div = $("<div />");
        $div.attr("id", "snakePoint_" + x + "_" + y).addClass("snake-point");
        $snakeCancas.append($div);
    }
}

// new game
var game = new snake.Game(config);

// customized drawing
game.draw = function(snake, food) {
    // clean
    for (var x = 0; x < config.width; x++) {
        for (var y = 0; y < config.height; y++) {
            var $div = $("#snakePoint_" + x + "_" + y, $snakeCancas);
            for (var i in classes) {
                var clazz = classes[i];
                $div.removeClass(clazz).removeClass("snake-win").removeClass("snake-die");
            }
        }
    }
    // draw snake
    for (var i in snake.foods) {
        var point = snake.foods[i];
        var $div = $("#snakePoint_" + point.x + "_" + point.y, $snakeCancas);
        $div.addClass(point.clazz);
    }
    // draw food
    if (food) {
        var $div = $("#snakePoint_" + food.x + "_" + food.y, $snakeCancas);
        $div.addClass(food.clazz);
    }
    // game over
    if (snake.win) {
        $snakeCancas.addClass("snake-win");
    }
    else if (snake.die) {
        $snakeCancas.addClass("snake-die");
    }
};

// ready ...
game.ready();

// go!
document.onkeydown = function(event) {
    game.go(snake.directions.[event.keyCode]);
};

// */

(function() {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype = {
        move: function(direction) {
            this.x += direction.x;
            this.y += direction.y;
        },
        eq: function(x, y) {
            return x == this.x && y == this.y;
        }
    };
    
    function Food(x, y, clazz) {
        Point.apply(this, arguments);
        this.clazz = clazz;
    };
    Food.prototype = new Point();
    
    function Map(width, height) {
        this.width = width;
        this.height = height;
    }
    Map.prototype = {
        has: function(x, y) {
            return x >= 0 && y >= 0 && x < this.width && y < this.height;
        }
    };
    
    function Snake(map, food) {
        this.map = map;
        this.foods = [food];
        this.die = false;
        this.win = false;
    }
    Snake.prototype = {
        has: function(x, y) {
            for (var i = 0; i < this.foods.length; i++) {
                var food = this.foods[i];
                if (food.eq(x, y)) {
                    return true;
                }
            }
            return false;
        },
        // return null if cannot move
        // return the food if eaten
        // return the head of snake if moved
        move: function(direction, food) {
            var curr = this.foods[0];
            var head = new Point(curr.x, curr.y);
            head.move(direction);
            if (this.has(head)
                || !this.map.has(head)) {
                return null;
            }
            if (head.eq(food.x, food,y)) {
                this.eat(food);
                return food;
            }
            for (var i = this.foods.length - 1; i >= 0; i--) {
                var food = this.foods[i];
                var prev = this.foods[i - 1] || head;
                food.x = prev.x;
                food.y = prev.y;
            }
            return this.foods[0];
        },
        eat: function(food) {
            this.foods.unshift(food);
        }
    };
    
    function Game(config) {
        this.map = new Map(Math.max(config.width, 2), Math.max(config.height, 2));
        this.speed = Math.max(config.speed, 1);
        this.classes = config.classes || [];
        this.intervalID = undefined;
    }
    Game.prototype = {
        _blank: function() {
            var blank = [];
            for (var x = 0; x < this.map.width; x++) {
                for (var y = 0; y < this.map.height; y++) {
                    if (!this.snake.has(x, y)) {
                        blank.push(new Point(x, y));
                    }
                }
            }
            return blank;
        },
        _cook: function() {
            var blank = this._blank();
            if (!blank.length) {
                return null;
            }
            var point = blank[Math.floor(blank.length * Math.random())];
            var clazz = this.classes[Math.floor(this.classes.length * Math.random())];
            return new Food(point.x, point.y, clazz);
        },
        _draw: function() {
            var draw = this.draw || function(snake, food) {
                console.log("snake: " + snake);
                console.log("food: " + food);
            };
            draw(this.snake, this.food);
        },
        ready: function() {
            this.snake = new Snake(this.map, this._cook());
            this.food = this._cook();
            this._draw();
        },
        go: function(direction) {
            this.direction = direction;
            this.resume();
        },
        pause: function() {
            clearInterval(this.intervalID);
            this.intervalID = undefined;
        },
        resume: function() {
            if (this.intervalID != undefined) {
                return;
            }
            this.intervalID = setInterval(function() {
                var head = this.snake.move(this.direction, this.food);
                if (!head) {
                    this.pause();
                    this.snake.die = true;
                }
                else if (this.food.eq(head.x, head.y)) {
                    this.food = this._cook();
                    if (!this.food) {
                        this.pause();
                        this.snake.win = true;
                    }
                }
                this._draw();
            }, this.speed);
            this._draw();
        },
        draw: undefined // function(snake, food) { ... }
    };
    
    // export
    this.snake = {
        Point:  Point,
        Food:   Food,
        Map:    Map,
        Snake:  Snake,
        Game:   Game,
        directions: {
            37: new Point(-1,  0), // keyCode: left
            38: new Point( 0, -1), // keyCode: up
            39: new Point( 1,  0), // keyCode: right
            40: new Point( 0,  1)  // keyCode: down
        }
    };
})();
