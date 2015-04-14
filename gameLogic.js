(function(){
  'use strict';
  angular.module('myApp', []).factory('gameLogic', function() {

  var sprites = {
    ship: { sx: 0, sy: 0, w: 37, h: 42, frames: 1 },
    missile: { sx: 0, sy: 30, w: 2, h: 10, frames: 1 },
    enemy_purple: { sx: 37, sy: 0, w: 42, h: 43, frames: 1 },
    enemy_bee: { sx: 79, sy: 0, w: 37, h: 43, frames: 1 },
    enemy_ship: { sx: 116, sy: 0, w: 42, h: 43, frames: 1 },
    enemy_circle: { sx: 158, sy: 0, w: 32, h: 33, frames: 1 },
    explosion: { sx: 0, sy: 64, w: 64, h: 64, frames: 12 },
    enemy_missile: { sx: 9, sy: 42, w: 3, h: 20, frame: 1, }
  };

  var enemies = {
    straight: { x: 0,   y: -50, sprite: 'enemy_ship', health: 10, 
                E: 100 },
    ltr:      { x: 0,   y: -100, sprite: 'enemy_purple', health: 10, 
                B: 75, C: 1, E: 100, missiles: 2  },
    circle:   { x: 250,   y: -50, sprite: 'enemy_circle', health: 10, 
                A: 0,  B: -100, C: 1, E: 20, F: 100, G: 1, H: Math.PI/2 },
    wiggle:   { x: 100, y: -50, sprite: 'enemy_bee', health: 20, 
                B: 50, C: 4, E: 100, firePercentage: 0.001, missiles: 2 },
    step:     { x: 0,   y: -50, sprite: 'enemy_circle', health: 10,
                B: 150, C: 1.2, E: 75 }
  };

  var level1 = [
   // Start,   End, Gap,  Type,   Override
    [ 0,      4000,  500, 'step' ],
    [ 6000,   13000, 800, 'ltr' ],
    [ 10000,  16000, 400, 'circle' ],
    [ 17800,  20000, 500, 'straight', { x: 50 } ],
    [ 18200,  20000, 500, 'straight', { x: 90 } ],
    [ 18200,  20000, 500, 'straight', { x: 10 } ],
    [ 22000,  25000, 400, 'wiggle', { x: 150 }],
    [ 22000,  25000, 400, 'wiggle', { x: 100 }]
  ];

  var Level = function(levelData,callback) {
    this.levelData = [];
    for(var i =0; i<levelData.length; i++) {
      this.levelData.push(Object.create(levelData[i]));
    }
    this.t = 0;
    this.callback = callback;
  };

  // the sheet mapping sprites given sprite name
  var SpriteSheet = new function() {
    this.map = { }; 

    this.load = function(spriteData) { 
      this.map = spriteData;
      this.image = new Image();
      // this.image.onload = callback;
      this.image.src = 'imgs/sprites.png';
    };

    this.draw = function(ctx,sprite,x,y,frame) {
      var s = this.map[sprite];
      if(!frame) frame = 0;
      ctx.drawImage(this.image,
                       s.sx + frame * s.w, 
                       s.sy, 
                       s.w, s.h, 
                       Math.floor(x), Math.floor(y),
                       s.w, s.h);
    };

    return this;
  };  // end of SpriteSheet

  // get the Sprite from SpriteSheet
  var Sprite = function() { };

  Sprite.prototype.setup = function(sprite,props) {
    this.sprite = sprite;
    this.merge(props);
    this.frame = this.frame || 0;
    this.w =  SpriteSheet.map[sprite].w;
    this.h =  SpriteSheet.map[sprite].h;
  };

  Sprite.prototype.merge = function(props) {
    if(props) {
      for (var prop in props) {
        this[prop] = props[prop];
      }
    }
  };

  Sprite.prototype.draw = function(ctx) {
    SpriteSheet.draw(ctx,this.sprite,this.x,this.y,this.frame);
  };

  Sprite.prototype.hit = function(damage) {
    this.board.remove(this);
  };  // end of Sprite

  // player Ship
  var PlayerShip = function() { 
    this.setup('ship', { vx: 0, reloadTime: 0.25, maxVel: 200 });

    this.reload = this.reloadTime;
    this.x = Game.width/2 - this.w / 2;
    this.y = Game.height - Game.playerOffset - this.h;

    this.step = function(dt) {
      if(Game.keys['left']) { this.vx = -this.maxVel; }
      else if(Game.keys['right']) { this.vx = this.maxVel; }
      else { this.vx = 0; }

      this.x += this.vx * dt;

      if(this.x < 0) { this.x = 0; }
      else if(this.x > Game.width - this.w) { 
        this.x = Game.width - this.w;
      }

      this.reload-=dt;
      if(Game.keys['fire'] && this.reload < 0) {
        Game.keys['fire'] = false;
        this.reload = this.reloadTime;

        this.board.add(new PlayerMissile(this.x,this.y+this.h/2));
        this.board.add(new PlayerMissile(this.x+this.w,this.y+this.h/2));
      }
    };
  };

  PlayerShip.prototype = new Sprite();
  PlayerShip.prototype.type = OBJECT_PLAYER;

  PlayerShip.prototype.hit = function(damage) {
    if(this.board.remove(this)) {
      loseGame();
    }
  };  // end of playerShip

  // player's missle
  var PlayerMissile = function(x,y) {
    this.setup('missile',{ vy: -700, damage: 10 });
    this.x = x - this.w/2;
    this.y = y - this.h; 
  };

  PlayerMissile.prototype = new Sprite();
  PlayerMissile.prototype.type = OBJECT_PLAYER_PROJECTILE;

  PlayerMissile.prototype.step = function(dt)  {
    this.y += this.vy * dt;
    var collision = this.board.collide(this,OBJECT_ENEMY);
    if(collision) {
      collision.hit(this.damage);
      this.board.remove(this);
    } else if(this.y < -this.h) { 
        this.board.remove(this); 
    }
  };  // end of playerMissle


  function initialize() {
    SpriteSheet.load(sprites);

  }

  return {
    initialize: initialize,

  }
});

}());