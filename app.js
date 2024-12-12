// Function to change the background image
function changeBackground(imagePath) {
    document.body.style.backgroundImage = `url('${imagePath}')`;
}

class Laser {
    constructor(game) {
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.height = this.game.height -50;
    }
    render(context) {
        this.x = this.game.player.x + this.game.player.width * 0.5 - this.width * 0.5;
        this.game.player.energy -= this.damage;

        context.save();
        context.fillStyle = 'gold';
        context.fillRect(this.x , this.y, this.width, this.height);
        context.fillStyle = 'white';
        context.fillRect(this.x + this.width * 0.2, this.y, this.width * 0.6 , this.height);
        context.restore();

        if(this.game.spriteUpdate) {
            this.game.waves.forEach(wave => {
                wave.enemies.forEach(enemy => {
                    if(this.game.checkCollision(enemy, this)){
                        enemy.hit(this.damage);
                    }
                })
            })
            this.game.bossArray.forEach(boss => {
                if (this.game.checkCollision(boss,this) && boss.y >= 0){
                    boss.hit(this.damage);
                }
            })
        }
    }
}
        

class SmallLaser extends Laser {
    constructor(game) {
        super(game);
        this.width = 5;
        this.damage = 0.3;
    }
    render(context){
        if(this.game.player.energy > 1 && !this.game.player.cooldown){
        super.render(context);
        this.game.player.frameX = 2;
        }
    }
}

class BigLaser extends Laser {
    constructor(game) {
        super(game);
        this.width = 25;
        this.damage = 0.7;
    }
    render(context){
        if(this.game.player.energy > 1 && !this.game.player.cooldown){
            super.render(context);
            this.game.player.frameX = 3;
        }
    }
}

class Player {
    constructor(game) {
        this.game = game;
        this.width = 140;
        this.height = 120;
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = this.game.height - this.height;
        this.speed = 5;
        this.lives = 3;
        this.maxLives = 10;
        this.image = document.getElementById('player');
        this.jets_image = document.getElementById('player_jets')
        this.frameX = 0;
        this.jetsFrame = 1;
        this.smallLaser = new SmallLaser(this.game);
        this.bigLaser = new BigLaser(this.game);
        this.energy = 50;
        this.maxEnergy = 100;
        this.cooldown = false;
    }
    draw(context) {
        //sprite frames
        if (this.game.keys.indexOf('1') > -1){                                               //context.fillRect(this.x, this.y, this.width, this.height);
            this.frameX = 1;
        } else if (this.game.keys.indexOf('2') > -1){                                               //context.fillRect(this.x, this.y, this.width, this.height);
            this.smallLaser.render(context);
        } else if (this.game.keys.indexOf('3') > -1){                                               //context.fillRect(this.x, this.y, this.width, this.height);
            this.bigLaser.render(context);
        } else {
            this.frameX = 0;
        }
        context.drawImage(this.jets_image,this.jetsFrame * this.width, 0 , this.width, this.height , this.x , this.y , this.width , this.height);
        context.drawImage(this.image,this.frameX * this.width, 0 , this.width, this.height , this.x , this.y , this.width , this.height);
    }
    update() {
        //energy
        if (this.energy < this.maxEnergy) this.energy += 0.05;
        if (this.energy < 1) this.cooldown = true;
        else if (this.energy > this.maxEnergy * 0.2) this.cooldown = false;
        // levizjet horizontal
        if (this.game.keys.indexOf('ArrowLeft') > -1) {
            this.x -= this.speed;
            this.jetsFrame = 0;
        } else if (this.game.keys.indexOf('ArrowRight') > -1) {
            this.x += this.speed;
            this.jetsFrame = 2;
        } else {
            this.jetsFrame = 1;
        }
        // kufijt horizontal
        if (this.x < -this.width * 0.5) this.x = -this.width * 0.5;
        else if (this.x > this.game.width - this.width) this.x = this.game.width - this.width;
    }
    shoot() {
        const projectile = this.game.getProjectile();
        if (projectile) projectile.start(this.x + this.width * 0.5, this.y);
    }
    restart () {
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = this.game.height - this.height;
        this.lives = 3;
    }
}

class Projectile {
    constructor() {
        this.width = 5;
        this.height = 40;
        this.x = 0;
        this.y = 0;
        this.speed = 20;
        this.free = true; // Set to true initially
    }
    draw(context) {
        if (!this.free) { // Draw only when active
            context.save();
            context.fillStyle = 'gold';
            context.fillRect(this.x, this.y, this.width, this.height);
            context.restore();
        }
    }
    update() {
        if (!this.free) { // Move only when active
            this.y -= this.speed;
            if (this.y < 0) this.reset();
        }
    }
    start(x, y) {
        this.x = x - this.width * 0.5;
        this.y = y;
        this.free = false; // Set to false when "fired"
    }
    reset() {
        this.free = true; // Set to true to make it available again
    }
}

class Enemy {
    constructor(game, positionX, positionY) {
        this.game = game;
        this.width = this.game.enemySize;
        this.height = this.game.enemySize;
        this.positionX = positionX;
        this.positionY = positionY;
        this.x = 0;
        this.y = 0;
        this.markedForDeletion = false;
    }
    draw(context) {
        //context.strokeRect(this.x, this.y, this.width, this.height);
        context.drawImage(this.image, this.frameX * this.width, this.frameY * this.height, this.width, this.height, this.x, this.y, this.width, this.height)
    }
    update(x, y) {
        this.x = x + this.positionX;
        this.y = y + this.positionY;
        // check collision enemies - projectiles
        this.game.projectilePool.forEach(projectile => {
            if (!projectile.free && this.game.checkCollision(this, projectile) && this.lives > 0) {
                this.hit(1);
                projectile.reset();
            }
        });
        if (this.lives < 1) {
            if (this.game.spriteUpdate) this.frameX ++;
            if (this.frameX > this.maxFrame) {
                this.markedForDeletion = true;
                if(!this.game.gameOver) this.game.score+= this.maxLives;
            }
        }
        // CHECK COLLISION ENEMY - PLAYER
            if (this.game.checkCollision(this, this.game.player) && this.lives > 0) {
                this.lives = 0
                this.game.player.lives--;
            }
        // Condition for game over
        if (this.y + this.height > this.game.height  || this.game.player.lives < 1) {
            this.game.gameOver = true;
        }
    }
    hit(damage) {
        this.lives -= damage;
    }
}

class Beetlemorph extends Enemy {
    constructor(game, positionX, positionY) {
        super(game, positionX, positionY);
        this.image = document.getElementById('beetlemorph');
        this.frameX = 0;
        this.maxFrame = 2;
        this.frameY = Math.floor(Math.random() * 4);
        this.lives = 1;
        this.maxLives = this.lives;
    }
}

class Rhinomorph extends Enemy {
    constructor(game, positionX, positionY) {
        super(game, positionX, positionY);
        this.image = document.getElementById('rhinomorph');
        this.frameX = 0;
        this.maxFrame = 5;
        this.frameY = Math.floor(Math.random() * 4);
        this.lives = 4;
        this.maxLives = this.lives;
    }
    hit(damage) {
        this.lives -= damage;
        this.frameX = this.maxLives - Math.floor(this.lives);
    }
}

class Boss {
    constructor(game, bossLives) {
        this.game = game;
        this.width = 200; 
        this.height = 200;
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = -this.height;
        this.speedX = Math.random() < 0.5 ? -1 : 1;
        this.speedY = 0;
        this.lives = bossLives;
        this.maxLives = this.lives;
        this.markedForDeletion = false;
        this.image = document.getElementById('boss');
        this.frameX = 1;
        this.frameY = Math.floor(Math.random() * 4);
        this.maxFrame = 11;
    }
    draw(context) {
        context.drawImage(this.image, this.frameX * this.width , this.frameY * this.height, this.width, this.height, this.x, this. y, this.width, this.height);
        if (this.lives >= 1 ){
            context.save();
            context.textAlign = 'center';
            context.shadowOffsetX = 4;
            context.shadowOffsetY = 4;
            context.shadowColor = 'black'
            context.fillText(Math.floor(this.lives), this.x + this.width * 0.5, this.y + 50)
            context.restore();
        }
    }
    update() {
        this.speedY = 0;
        if(this.game.spriteUpdate && this.lives >= 1 ) this.frameX = 0;
        if (this.y < 0) this.y += 3;
        if(this.x < 0 || this.x > this.game.width - this.width && this.lives >= 1) {
            this.speedX *= -1; 
            this.speedY = this.height * 0.5;
        }
        this.x += this.speedX;
        this.y += this.speedY;
        //goditjet boss / projectiles
        this.game.projectilePool.forEach(projectile => {
            if(this.game.checkCollision(this, projectile) && !projectile.free && this.lives >= 1 && this.y >= 0) {
                this.hit(1);
                projectile.reset();
            }
        })
        //detektimi i goditjes boss / player
        if(this.game.checkCollision(this, this.game.player) && this.lives >= 1) {
            this.game.gameOver = true;
            this.lives = 0;
        }  
        //boss destroy
        if (this.lives < 1 && this.game.spriteUpdate) {
            this.frameX++;
            if(this.frameX > this.maxFrame) {
                this.markedForDeletion = true;
                this.game.score += this.maxLives;
                this.game.bossLives += 5;
                if (!this.game.gameOver) this.game.newWave()
            }
        }
        //lose condition 
        if ( this.y + this.height > this.game.height) this.game.gameOver = true;
    }
    hit(damage) {
        this.lives -= damage;
        if ( this.lives >= 1) this.frameX = 1;
    }
}

class Wave {
    constructor(game) {
        this.game = game;
        this.width = this.game.columns * this.game.enemySize;
        this.height = this.game.rows * this.game.enemySize;
        this.x = this.game.width * 0.5 - this.width * 0.5;
        this.y = -this.height;
        this.speedX = Math.random() < 0.5 ? -1 : 1; //operatori ternary
        this.speedY = 0;
        this.enemies = [];
        this.nextWaveTrigger = false;
        this.markedForDeletion = false;
        this.create();
    }
    render(context) {
        if (this.y < 0) this.y += 5;
        this.speedY = 0;
        if (this.x < 0 || this.x > this.game.width - this.width) {
            this.speedX *= -1;
            this.speedY = this.game.enemySize;
        }
        this.x += this.speedX;
        this.y += this.speedY;
        this.enemies.forEach(enemy => {
            enemy.update(this.x, this.y);
            enemy.draw(context);
        });
        this.enemies = this.enemies.filter(object => !object.markedForDeletion);
        if (this.enemies.length <= 0) this.markedForDeletion = true;
    }
    create() {
        for (let y = 0; y < this.game.rows; y++) {
            for (let x = 0; x < this.game.columns; x++) {
                let enemyX = x * this.game.enemySize;
                let enemyY = y * this.game.enemySize;
                if (Math.random() < 0.3) {
                    this.enemies.push(new Rhinomorph(this.game, enemyX, enemyY));
                } else {
                    this.enemies.push(new Beetlemorph(this.game, enemyX, enemyY));
                }
                
            }
        }
    }
}

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.keys = [];
        this.player = new Player(this);
        
        this.projectilePool = [];
        this.numberOfProjectiles = 15;
        this.createProjectiles();
        this.fired = false;

        this.columns = 1;
        this.rows = 1;
        this.enemySize = 80;

        this.waves = [];
        this.waveCount = 1;

        this.spriteUpdate = false;
        this.spriteTimer = 0;
        this.spriteInterval = 150;

        this.score =0;
        this.gameOver = false;

        this.bossArray = [];
        this.bossLives = 10;
        this.restart ();

        // Event listeners
        window.addEventListener('keydown', e => {
            if (e.key === '1' && !this.fired) this.player.shoot();
            this.fired = true;
            if (this.keys.indexOf(e.key) === -1) this.keys.push(e.key);
            if (e.key === 'r' && this.gameOver) this.restart();
        });
        window.addEventListener('keyup', e => {
            this.fired = false;
            const index = this.keys.indexOf(e.key);
            if (index > -1) this.keys.splice(index, 1);
        });
    }
    render(context, deltaTime) {
        // sprite timing
        if (this.spriteTimer > this.spriteInterval) {
            this.spriteUpdate = true;
            this.spriteTimer = 0;
        }else {
            this.spriteUpdate = false;
            this.spriteTimer += deltaTime;
        }

        this.drawStatusText(context);
        this.projectilePool.forEach(projectile => {
            projectile.update();
            projectile.draw(context);
        })
        this.player.draw(context);
        this.player.update();
        this.bossArray.forEach(boss => {
            boss.draw(context);
            boss.update();
        })
        this.bossArray = this.bossArray.filter(object => !object.markedForDeletion);
        this.waves.forEach(wave => {
            wave.render(context);
            if(wave.enemies.length < 1 && !wave.nextWaveTrigger && !this.gameOver) {
                this.newWave();
                wave.nextWaveTrigger = true;
            }
        });
    }
    //krijimi i projectile object pool
    createProjectiles() {
        for (let i = 0; i < this.numberOfProjectiles; i++) {
            this.projectilePool.push(new Projectile());
        }
    }
    //get free projectile bject from the pool
    getProjectile() {
        for (let i = 0; i < this.projectilePool.length; i++) {
            if (this.projectilePool[i].free) return this.projectilePool[i];
        }
        return null; // maybe unnecessary
    }
    // Collision detection between two rectangles
    checkCollision(a, b) {
        return (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
        );
    }
    drawStatusText(context) {
        context.save();
        context.shadowOffsetX = 2;
        context.shadowOffsetY = 2;
        context.shadowColor = 'black';
        context.font = '30px Impact';
        context.fillText('Rezultati: ' + this.score, 20, 40);
        context.fillText('Faza: ' + this.waveCount, 20, 80);
        for (let i = 0; i < this.player.maxLives; i++){
            context.strokeRect(20 + 20 * i , 100, 10, 15);
        }
        for (let i = 0; i < this.player.lives; i++){
            context.fillRect(20 + 20 * i , 100, 10, 15);
        }
        // energy 
        context.save();
        this.player.cooldown ? context.fillStyle = 'red' : context.fillStyle = 'gold';
        for (let i = 0; i < this.player.energy; i++) {
            context.fillRect(20+ 2 * i, 130, 2, 15);
        }
        context.restore();
        if (this.gameOver) {
            context.textAlign = 'center'; 
            context.font = '90px Impact';
            context.fillText('Loja ka mbaruar', this.width * 0.5, this.height * 0.5);
            context.font = '20px Impact';
            context.fillText('Shtyp R per te rifilluar!', this.width * 0.5, this.height * 0.5 + 30);

        }
        context.restore();
    }
    newWave() {
        this.waveCount++;
        if (this.player.lives < this.player.maxLives)this.player.lives++;
        if (this.waveCount % 2 === 0) {
            this.bossArray.push(new Boss(this, this.bossLives));
        }else {
            if (Math.random() < 0.5 && this.columns * this.enemySize < this.width * 0.8) { //deri ne 80%
                this.columns++;
            }else if(this.rows * this.enemySize < this.height * 0.6) {
                this.rows++;
            }
            this.waves.push(new Wave(this));
        }
        
        this.waves = this.waves.filter(object => !object.markedForDeletion);
    }
    restart() {
        this.player.restart();
        this.columns = 2;
        this.rows = 2;
        this.waves = [];
        this.bossArray = [];
        this.bossLives = 10;
       // this.waves.push(new Wave(this));
        this.bossArray.push(new Boss(this, this.bossLives));
        this.waveCount = 1;
        this.score = 0;
        this.gameOver = false;
    }
}

window.addEventListener('load', function() {
    const canvas = document.getElementById('canvas1');
    const ctx = canvas.getContext('2d');
    canvas.width = 600;
    canvas.height = 800;
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    ctx.font = '30px Impact';

    const game = new Game(canvas);

    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.render(ctx, deltaTime);
        window.requestAnimationFrame(animate);
    }
    animate(0);
});