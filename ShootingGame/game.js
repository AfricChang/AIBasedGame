/**
 * 打飞机游戏主要逻辑
 */
class ShootingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // 音频管理器
        this.audioManager = new AudioManager();
        
        // 游戏状态
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.score = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.bulletCount = 1;
        this.maxBullets = 3;
        this.bulletSpeedMultiplier = 1; // 弹道速度倍数
        this.maxBulletSpeedMultiplier = 2.5; // 最大弹道速度倍数限制
        
        // 僚机系统
        this.wingmen = []; // 僚机数组
        this.consecutiveBulletPowerUps = 0; // 连续获得弹道道具的计数
        this.maxWingmen = 2; // 最多2个僚机（左右各一个）
        
        // 游戏对象数组
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.obstacles = [];
        this.obstacles = []; // 障碍物数组
        
        // 游戏计时器
        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        this.obstacleSpawnTimer = 0; // 障碍物生成计时器
        
        // 输入处理
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.touch = { x: 0, y: 0, active: false };
        
        this.setupEventListeners();
        this.setupUI();
        this.loadHighScore();
        this.showScreen('startScreen');
    }
    
    /**
     * 设置画布尺寸
     */
    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        });
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 键盘事件
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.pauseGame();
                }
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // 鼠标事件
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            e.preventDefault();
            // 恢复音频上下文
            this.audioManager.resumeAudioContext();
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
        
        // 触摸事件
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.touch.x = touch.clientX - rect.left;
            this.touch.y = touch.clientY - rect.top;
            this.touch.active = true;
            // 恢复音频上下文
            this.audioManager.resumeAudioContext();
        });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.touch.x = touch.clientX - rect.left;
                this.touch.y = touch.clientY - rect.top;
            }
        });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touch.active = false;
        });
    }
    
    /**
     * 设置UI事件
     */
    setupUI() {
        document.getElementById('startBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('soundBtn').addEventListener('click', () => {
            const isEnabled = this.audioManager.toggleSound();
            document.getElementById('soundBtn').textContent = isEnabled ? '🔊' : '🔇';
        });
        
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('backToMenuBtn').addEventListener('click', () => {
            this.showScreen('startScreen');
        });
        
        document.getElementById('playAgainBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.showScreen('startScreen');
        });
    }
    
    /**
     * 显示指定屏幕
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    /**
     * 开始游戏
     */
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.health = this.maxHealth;
        this.bulletCount = 1;
        this.bulletSpeedMultiplier = 1; // 重置弹道速度倍数
        
        // 重置僚机系统
        this.wingmen = [];
        this.consecutiveBulletPowerUps = 0;
        
        // 清空游戏对象
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.obstacles = [];
        
        // 创建玩家
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100);
        
        // 重置计时器
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
        
        this.updateUI();
        this.showScreen('gameScreen');
        
        // 恢复音频上下文并开始背景音乐
        this.audioManager.resumeAudioContext();
        this.audioManager.playBackgroundMusic();
        
        if (!this.gameLoop) {
            this.gameLoop = this.update.bind(this);
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    /**
     * 暂停游戏
     */
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showScreen('pauseScreen');
        }
    }
    
    /**
     * 继续游戏
     */
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.showScreen('gameScreen');
        }
    }
    
    /**
     * 游戏结束
     */
    gameOver() {
        this.gameState = 'gameOver';
        this.saveHighScore();
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.getHighScore();
        this.showScreen('gameOverScreen');
        
        // 停止背景音乐并播放游戏结束音效
        this.audioManager.stopBackgroundMusic();
        this.audioManager.playGameOver();
    }
    
    /**
     * 更新UI显示
     */
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('currentHighScore').textContent = this.getHighScore();
        document.getElementById('bulletCount').textContent = this.bulletCount;
        
        const healthBar = document.getElementById('healthBar');
        const healthPercent = (this.health / this.maxHealth) * 100;
        healthBar.style.width = healthPercent + '%';
        
        if (healthPercent > 60) {
            healthBar.style.background = 'linear-gradient(90deg, #44ff44, #66ff66)';
        } else if (healthPercent > 30) {
            healthBar.style.background = 'linear-gradient(90deg, #ffff44, #ffff66)';
        } else {
            healthBar.style.background = 'linear-gradient(90deg, #ff4444, #ff6666)';
        }
    }
    
    /**
     * 保存最高分
     */
    saveHighScore() {
        const highScore = this.getHighScore();
        if (this.score > highScore) {
            localStorage.setItem('shootingGameHighScore', this.score.toString());
        }
    }
    
    /**
     * 获取最高分
     */
    getHighScore() {
        return parseInt(localStorage.getItem('shootingGameHighScore') || '0');
    }
    
    /**
     * 加载最高分
     */
    loadHighScore() {
        const highScore = this.getHighScore();
        document.getElementById('highScore').textContent = highScore;
        // 初始化游戏界面的最高分显示
        const currentHighScoreElement = document.getElementById('currentHighScore');
        if (currentHighScoreElement) {
            currentHighScoreElement.textContent = highScore;
        }
    }
    
    /**
     * 生成敌人
     */
    spawnEnemy() {
        const x = Math.random() * (this.canvas.width - 60);
        const speed = 2 + Math.random() * 3 + (this.score / 1000);
        
        // 根据分数决定敌机类型概率
        const scoreLevel = Math.floor(this.score / 500);
        const rand = Math.random();
        let enemyType = 'scout';
        
        if (scoreLevel >= 4 && rand < 0.05) {
            enemyType = 'boss'; // 5% Boss机（高分时）
        } else if (scoreLevel >= 3 && rand < 0.15) {
            enemyType = 'gunship'; // 10% 炮艇（中高分时）
        } else if (scoreLevel >= 2 && rand < 0.35) {
            enemyType = 'bomber'; // 20% 轰炸机（中分时）
        } else if (scoreLevel >= 1 && rand < 0.60) {
            enemyType = 'fighter'; // 25% 战斗机（低分时）
        } else {
            enemyType = 'scout'; // 40% 侦察机（默认）
        }
        
        this.enemies.push(new Enemy(x, -30, speed, enemyType));
    }
    
    /**
     * 生成道具
     */
    spawnPowerUp() {
        const x = Math.random() * (this.canvas.width - 30);
        const type = Math.random() < 0.7 ? 'bullet' : 'health';
        this.powerUps.push(new PowerUp(x, -20, type));
    }
    
    /**
     * 生成障碍物
     */
    spawnObstacle() {
        const x = Math.random() * (this.canvas.width - 60);
        const speed = 1 + Math.random() * 2 + (this.score / 2000); // 比敌机稍慢
        this.obstacles.push(new Obstacle(x, -40, speed));
    }
    
    /**
     * 创建粒子效果
     */
    createParticles(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    /**
     * 主游戏循环
     */
    update(currentTime) {
        if (this.gameState !== 'playing') {
            requestAnimationFrame(this.gameLoop);
            return;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // 更新玩家
        if (this.player) {
            this.updatePlayer();
        }
        
        // 生成敌人
        this.enemySpawnTimer += deltaTime;
        if (this.enemySpawnTimer > 1000 - (this.score / 10)) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // 生成道具
        this.powerUpSpawnTimer += deltaTime;
        if (this.powerUpSpawnTimer > 8000 + Math.random() * 5000) {
            this.spawnPowerUp();
            this.powerUpSpawnTimer = 0;
        }
        
        // 生成障碍物（防止挂机）
        this.obstacleSpawnTimer += deltaTime;
        if (this.obstacleSpawnTimer > 6000 + Math.random() * 4000) { // 6-10秒随机生成
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
        
        // 更新游戏对象
        this.updateBullets();
        this.updateEnemies();
        this.updatePowerUps();
        this.updateParticles();
        this.updateObstacles();
        this.updateWingmen();
        
        // 碰撞检测
        this.checkCollisions();
        
        // 渲染
        this.render();
        
        // 更新UI
        this.updateUI();
        
        // 检查游戏结束
        if (this.health <= 0) {
            this.gameOver();
        }
        
        requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * 更新玩家
     */
    updatePlayer() {
        // 获取目标位置
        let targetX = this.player.x;
        let targetY = this.player.y;
        
        if (this.touch.active) {
            targetX = this.touch.x;
            targetY = this.touch.y;
        } else if (this.mouse.down) {
            targetX = this.mouse.x;
            targetY = this.mouse.y;
        }
        
        // 键盘控制
        if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
            targetX = this.player.x - 8;
        }
        if (this.keys['ArrowRight'] || this.keys['KeyD']) {
            targetX = this.player.x + 8;
        }
        if (this.keys['ArrowUp'] || this.keys['KeyW']) {
            targetY = this.player.y - 8;
        }
        if (this.keys['ArrowDown'] || this.keys['KeyS']) {
            targetY = this.player.y + 8;
        }
        
        // 平滑移动
        this.player.x += (targetX - this.player.x) * 0.15;
        this.player.y += (targetY - this.player.y) * 0.15;
        
        // 边界检查
        this.player.x = Math.max(this.player.width / 2, Math.min(this.canvas.width - this.player.width / 2, this.player.x));
        this.player.y = Math.max(this.player.height / 2, Math.min(this.canvas.height - this.player.height / 2, this.player.y));
        
        // 自动射击
        this.player.update();
        if (this.player.canShoot()) {
            this.shootBullets();
        }
    }
    
    /**
     * 发射子弹
     */
    shootBullets() {
        // 当弹道满了时，增加弹道速度（有限制）
        if (this.bulletCount >= this.maxBullets && this.bulletSpeedMultiplier < this.maxBulletSpeedMultiplier) {
            this.bulletSpeedMultiplier = Math.min(this.bulletSpeedMultiplier + 0.1, this.maxBulletSpeedMultiplier);
        }
        
        const bulletSpacing = 20;
        const startX = this.player.x - (this.bulletCount - 1) * bulletSpacing / 2;
        
        for (let i = 0; i < this.bulletCount; i++) {
            const x = startX + i * bulletSpacing;
            this.bullets.push(new Bullet(x, this.player.y - this.player.height / 2, false, this.bulletSpeedMultiplier));
        }
        
        // 僚机也会射击
        this.wingmen.forEach(wingman => {
            if (wingman.canShoot()) {
                this.bullets.push(new Bullet(wingman.x, wingman.y - wingman.height / 2, false, this.bulletSpeedMultiplier));
            }
        });
        
        // 播放射击音效
        this.audioManager.playShoot();
    }
    
    /**
     * 更新子弹
     */
    updateBullets() {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            
            if (this.bullets[i].y < -10) {
                this.bullets.splice(i, 1);
            }
        }
    }
    
    /**
     * 更新敌人
     */
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const shootInfo = this.enemies[i].update();
            
            // 处理敌机射击
            if (shootInfo && shootInfo.shoot) {
                this.bullets.push(new Bullet(shootInfo.x, shootInfo.y, true));
                this.audioManager.playEnemyShoot();
            }
            
            if (this.enemies[i].y > this.canvas.height + 30) {
                this.enemies.splice(i, 1);
            }
        }
    }
    
    /**
     * 更新道具
     */
    updatePowerUps() {
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            this.powerUps[i].update();
            
            if (this.powerUps[i].y > this.canvas.height + 20) {
                this.powerUps.splice(i, 1);
            }
        }
    }
    
    /**
     * 更新粒子
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * 更新障碍物
     */
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].update();
            
            // 移除超出屏幕的障碍物
            if (this.obstacles[i].y > this.canvas.height + 50) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    /**
     * 碰撞检测
     */
    checkCollisions() {
        // 玩家子弹与敌人碰撞
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (!this.bullets[i].isEnemy) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    if (this.checkCollision(this.bullets[i], this.enemies[j])) {
                        this.createParticles(this.enemies[j].x, this.enemies[j].y, '#ff6600', 8);
                        this.bullets.splice(i, 1);
                        
                        // 处理多血量敌机
                        const isDead = this.enemies[j].takeDamage(1);
                        if (isDead) {
                            // 根据敌机类型给予不同分数
                            let scoreBonus = 10;
                            switch(this.enemies[j].type) {
                                case 'scout': scoreBonus = 10; break;
                                case 'fighter': scoreBonus = 20; break;
                                case 'bomber': scoreBonus = 30; break;
                                case 'gunship': scoreBonus = 40; break;
                                case 'boss': scoreBonus = 100; break;
                            }
                            this.score += scoreBonus;
                            this.enemies.splice(j, 1);
                            // 播放爆炸音效
                            this.audioManager.playExplosion();
                        } else {
                            // 播放击中音效
                            this.audioManager.playHit();
                        }
                        break;
                    }
                }
            }
        }
        
        // 敌机子弹与玩家碰撞
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (this.bullets[i].isEnemy && this.checkCollision(this.bullets[i], this.player)) {
                this.createParticles(this.player.x, this.player.y, '#ff0000', 6);
                this.bullets.splice(i, 1);
                
                if (this.bulletCount > 1) {
                    this.bulletCount--;
                } else {
                    this.health -= 15;
                }
                // 播放玩家受伤音效
                this.audioManager.playPlayerHurt();
            }
        }
        
        // 敌机子弹与障碍物碰撞
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (this.bullets[i].isEnemy) {
                for (let j = this.obstacles.length - 1; j >= 0; j--) {
                    if (this.checkCollision(this.bullets[i], this.obstacles[j])) {
                        // 创建撞击粒子效果
                        this.createParticles(this.bullets[i].x, this.bullets[i].y, '#ff4400', 5);
                        // 移除敌机子弹
                        this.bullets.splice(i, 1);
                        // 播放击中音效
                        this.audioManager.playHit();
                        break;
                    }
                }
            }
        }
        
        // 玩家与敌人碰撞
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.enemies[i])) {
                this.createParticles(this.enemies[i].x, this.enemies[i].y, '#ff0000', 10);
                
                // 根据敌机类型造成不同伤害
                let damage = 20;
                switch(this.enemies[i].type) {
                    case 'scout': damage = 15; break;
                    case 'fighter': damage = 20; break;
                    case 'bomber': damage = 30; break;
                    case 'gunship': damage = 25; break;
                    case 'boss': damage = 50; break;
                }
                
                this.enemies.splice(i, 1);
                
                if (this.bulletCount > 1) {
                    this.bulletCount--;
                } else {
                    this.health -= damage;
                }
                // 播放玩家受伤音效
                this.audioManager.playPlayerHurt();
            }
        }
        
        // 玩家与道具碰撞
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.powerUps[i])) {
                const powerUp = this.powerUps[i];
                this.createParticles(powerUp.x, powerUp.y, powerUp.type === 'bullet' ? '#00ff00' : '#ff00ff', 6);
                
                if (powerUp.type === 'bullet') {
                    // 只有在弹道未满时才增加弹道数量
                    if (this.bulletCount < this.maxBullets) {
                        this.bulletCount++;
                    }
                    
                    // 无论弹道是否已满，都计算连续获得的弹道道具
                    this.consecutiveBulletPowerUps++;
                    
                    // 检查是否可以解锁僚机：当前弹道>=3且连续获得3个弹道道具
                    if (this.bulletCount >= 3 && this.consecutiveBulletPowerUps >= 3 && this.wingmen.length < this.maxWingmen) {
                        this.unlockWingman();
                        this.consecutiveBulletPowerUps = 0; // 重置计数器，为下一个僚机重新计数
                    }
                } else if (powerUp.type === 'health') {
                    this.health = Math.min(this.maxHealth, this.health + 30);
                    this.consecutiveBulletPowerUps = 0; // 获得生命道具时重置弹道道具计数
                }
                
                this.powerUps.splice(i, 1);
                this.score += 5;
                // 播放道具收集音效
                this.audioManager.playPowerUp();
            }
        }
        
        // 子弹与障碍物碰撞
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (!this.bullets[i].isEnemy) {
                for (let j = this.obstacles.length - 1; j >= 0; j--) {
                    if (this.checkCollision(this.bullets[i], this.obstacles[j])) {
                        // 创建撞击粒子效果
                        this.createParticles(this.bullets[i].x, this.bullets[i].y, '#ffaa00', 5);
                        // 移除子弹
                        this.bullets.splice(i, 1);
                        // 播放击中音效
                        this.audioManager.playHit();
                        break;
                    }
                }
            }
        }
        
        // 玩家与障碍物碰撞
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.obstacles[i])) {
                this.createParticles(this.obstacles[i].x, this.obstacles[i].y, '#888888', 8);
                
                this.obstacles.splice(i, 1);
                
                // 障碍物造成较大伤害，强制玩家躲避
                if (this.bulletCount > 1) {
                    this.bulletCount--;
                } else {
                    this.health -= 25; // 比普通敌机伤害稍高
                }
                // 播放玩家受伤音效
                this.audioManager.playPlayerHurt();
            }
        }
    }
    
    /**
     * 检查两个对象是否碰撞
     */
    checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.width + obj2.width) / 2;
    }
    
    /**
     * 解锁僚机
     */
    unlockWingman() {
        if (this.wingmen.length < this.maxWingmen) {
            const side = this.wingmen.length === 0 ? 'left' : 'right';
            const wingman = new Wingman(this.player.x, this.player.y, side);
            this.wingmen.push(wingman);
            
            // 可以添加解锁音效或特效
            this.createParticles(this.player.x, this.player.y, '#0088ff', 15);
        }
    }
    
    /**
     * 更新僚机
     */
    updateWingmen() {
        this.wingmen.forEach(wingman => {
            wingman.update(this.player.x, this.player.y);
        });
    }
    
    /**
     * 渲染游戏
     */
    render() {
        // 清空画布
        this.ctx.fillStyle = 'rgba(0, 4, 40, 0.1)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制星空背景
        this.drawStars();
        
        // 绘制游戏对象
        if (this.player) {
            this.player.draw(this.ctx);
        }
        
        this.wingmen.forEach(wingman => wingman.draw(this.ctx));
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
        this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        this.particles.forEach(particle => particle.draw(this.ctx));
    }
    
    /**
     * 绘制星空背景
     */
    drawStars() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 73 + Date.now() * 0.01) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
    }
}

/**
 * 玩家类
 */
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.shootTimer = 0;
        this.shootDelay = 200;
    }
    
    update() {
        this.shootTimer += 16;
    }
    
    canShoot() {
        if (this.shootTimer >= this.shootDelay) {
            this.shootTimer = 0;
            return true;
        }
        return false;
    }
    
    draw(ctx) {
        // 保存当前状态
        ctx.save();
        
        // 飞机主体 - 使用渐变色
        const gradient = ctx.createLinearGradient(this.x - this.width/2, this.y - this.height/2, this.x + this.width/2, this.y + this.height/2);
        gradient.addColorStop(0, '#4a90e2');
        gradient.addColorStop(0.5, '#357abd');
        gradient.addColorStop(1, '#1e5f99');
        
        // 绘制飞机主体（椭圆形）
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width/2, this.height/2, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 飞机机头（三角形）
        ctx.fillStyle = '#2c5aa0';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height/2 - 8);
        ctx.lineTo(this.x - 8, this.y - this.height/2 + 5);
        ctx.lineTo(this.x + 8, this.y - this.height/2 + 5);
        ctx.closePath();
        ctx.fill();
        
        // 飞机机翼
        ctx.fillStyle = '#5ba3f5';
        ctx.beginPath();
        ctx.ellipse(this.x - 12, this.y + 5, 8, 15, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 12, this.y + 5, 8, 15, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 飞机尾翼
        ctx.fillStyle = '#3d7bc6';
        ctx.beginPath();
        ctx.ellipse(this.x - 6, this.y + this.height/2 - 3, 4, 8, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 6, this.y + this.height/2 - 3, 4, 8, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 驾驶舱窗口
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 5, 6, 8, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 飞机装饰线条
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.x - this.width/3, this.y - this.height/4);
        ctx.lineTo(this.x + this.width/3, this.y - this.height/4);
        ctx.stroke();
        
        // 恢复状态
        ctx.restore();
    }
}

/**
 * 子弹类
 */
class Bullet {
    constructor(x, y, isEnemy = false, speedMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.baseSpeed = 3; // 降低初始弹道速度
        this.speed = this.baseSpeed * speedMultiplier;
        this.isEnemy = isEnemy;
        
        if (isEnemy) {
            this.speed = -8; // 敌机子弹向下，大幅提高速度确保始终比敌机快
        }
    }
    
    update() {
        if (this.isEnemy) {
            this.y -= this.speed; // 向下移动
        } else {
            this.y -= this.speed; // 向上移动
        }
    }
    
    draw(ctx) {
        if (this.isEnemy) {
            ctx.fillStyle = '#ff4444'; // 红色敌机子弹
        } else {
            ctx.fillStyle = '#ffff00'; // 黄色玩家子弹
        }
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
    }
}

/**
 * 敌人基类
 */
class Enemy {
    constructor(x, y, speed, type = 'basic') {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.type = type;
        this.shootTimer = 0;
        this.shootDelay = 1000 + Math.random() * 2000; // 随机射击间隔
        
        // 根据类型设置属性
        this.setTypeProperties();
    }
    
    /**
     * 根据敌机类型设置属性
     */
    setTypeProperties() {
        switch(this.type) {
            case 'scout': // 侦察机 - 最弱但最快
                this.width = 25;
                this.height = 25;
                this.health = 1;
                this.maxHealth = 1;
                this.speed *= 1.5;
                break;
            case 'fighter': // 战斗机 - 中等强度
                this.width = 30;
                this.height = 30;
                this.health = 2;
                this.maxHealth = 2;
                break;
            case 'bomber': // 轰炸机 - 较强但较慢
                this.width = 40;
                this.height = 35;
                this.health = 3;
                this.maxHealth = 3;
                this.speed *= 0.7;
                break;
            case 'gunship': // 炮艇 - 会射击的敌机
                this.width = 35;
                this.height = 32;
                this.health = 4;
                this.maxHealth = 4;
                this.speed *= 0.8;
                this.canShoot = true;
                break;
            case 'boss': // Boss机 - 最强
                this.width = 50;
                this.height = 45;
                this.health = 8;
                this.maxHealth = 8;
                this.speed *= 0.5;
                break;
            default: // basic
                this.width = 30;
                this.height = 30;
                this.health = 1;
                this.maxHealth = 1;
        }
    }
    
    update() {
        this.y += this.speed;
        
        // 射击逻辑（仅限炮艇类型）
        if (this.canShoot) {
            this.shootTimer += 16;
            if (this.shootTimer >= this.shootDelay) {
                this.shootTimer = 0;
                return { shoot: true, x: this.x, y: this.y + this.height/2 };
            }
        }
        return null;
    }
    
    /**
     * 受到伤害
     */
    takeDamage(damage = 1) {
        this.health -= damage;
        return this.health <= 0;
    }
    
    draw(ctx) {
        ctx.save();
        
        switch(this.type) {
            case 'scout':
                this.drawScout(ctx);
                break;
            case 'fighter':
                this.drawFighter(ctx);
                break;
            case 'bomber':
                this.drawBomber(ctx);
                break;
            case 'gunship':
                this.drawGunship(ctx);
                break;
            case 'boss':
                this.drawBoss(ctx);
                break;
            default:
                this.drawBasic(ctx);
        }
        
        // 绘制血量条（多血量敌机）
        if (this.maxHealth > 1) {
            this.drawHealthBar(ctx);
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制侦察机 - 小型三角形，绿色
     */
    drawScout(ctx) {
        const gradient = ctx.createLinearGradient(this.x - this.width/2, this.y - this.height/2, this.x + this.width/2, this.y + this.height/2);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(1, '#00cc66');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.height/2);
        ctx.lineTo(this.x - this.width/2, this.y + this.height/2);
        ctx.lineTo(this.x + this.width/2, this.y + this.height/2);
        ctx.closePath();
        ctx.fill();
        
        // 引擎光（减小尾焰效果）
        ctx.fillStyle = '#88ffaa';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height/3, 2, 3, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    /**
     * 绘制战斗机 - 经典红色战机
     */
    drawFighter(ctx) {
        const gradient = ctx.createLinearGradient(this.x - this.width/2, this.y - this.height/2, this.x + this.width/2, this.y + this.height/2);
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(1, '#cc0000');
        
        // 主体
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width/2, this.height/2, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 机翼
        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.ellipse(this.x - 10, this.y + 5, 6, 12, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(this.x + 10, this.y + 5, 6, 12, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 驾驶舱
        ctx.fillStyle = '#ffaaaa';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 3, 4, 6, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    /**
     * 绘制轰炸机 - 大型橙色飞机
     */
    drawBomber(ctx) {
        const gradient = ctx.createLinearGradient(this.x - this.width/2, this.y - this.height/2, this.x + this.width/2, this.y + this.height/2);
        gradient.addColorStop(0, '#ff8800');
        gradient.addColorStop(1, '#cc6600');
        
        // 主体
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // 机翼
        ctx.fillStyle = '#ffaa44';
        ctx.fillRect(this.x - this.width/2 - 5, this.y, this.width + 10, 8);
        
        // 引擎（减小尾焰效果）
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(this.x - 6, this.y + this.height/2 - 1, 2, 4);
        ctx.fillRect(this.x + 4, this.y + this.height/2 - 1, 2, 4);
        
        // 驾驶舱
        ctx.fillStyle = '#ffcc88';
        ctx.fillRect(this.x - 6, this.y - this.height/2, 12, 10);
    }
    
    /**
     * 绘制炮艇 - 紫色，带武器
     */
    drawGunship(ctx) {
        const gradient = ctx.createLinearGradient(this.x - this.width/2, this.y - this.height/2, this.x + this.width/2, this.y + this.height/2);
        gradient.addColorStop(0, '#8844ff');
        gradient.addColorStop(1, '#6622cc');
        
        // 主体
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.width/2, this.height/2, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 武器系统
        ctx.fillStyle = '#aa66ff';
        ctx.fillRect(this.x - 3, this.y + this.height/2, 6, 8);
        
        // 侧翼武器
        ctx.fillStyle = '#9955ee';
        ctx.fillRect(this.x - 12, this.y + 3, 4, 10);
        ctx.fillRect(this.x + 8, this.y + 3, 4, 10);
        
        // 驾驶舱
        ctx.fillStyle = '#ccaaff';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 5, 5, 7, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    /**
     * 绘制Boss机 - 大型黑色战机
     */
    drawBoss(ctx) {
        const gradient = ctx.createLinearGradient(this.x - this.width/2, this.y - this.height/2, this.x + this.width/2, this.y + this.height/2);
        gradient.addColorStop(0, '#444444');
        gradient.addColorStop(0.5, '#222222');
        gradient.addColorStop(1, '#000000');
        
        // 主体
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        
        // 大型机翼
        ctx.fillStyle = '#666666';
        ctx.fillRect(this.x - this.width/2 - 8, this.y - 5, this.width + 16, 12);
        
        // 多个引擎（减小尾焰效果）
        ctx.fillStyle = '#ff4444';
        for (let i = -1; i <= 1; i++) {
            ctx.fillRect(this.x + i * 8 - 1, this.y + this.height/2 - 1, 2, 3);
        }
        
        // 装甲板
        ctx.fillStyle = '#888888';
        ctx.fillRect(this.x - this.width/3, this.y - this.height/3, this.width * 2/3, this.height * 2/3);
        
        // 驾驶舱
        ctx.fillStyle = '#ff8888';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y - 8, 8, 10, 0, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    /**
     * 绘制基础敌机
     */
    drawBasic(ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        ctx.fillStyle = '#aa0000';
        ctx.fillRect(this.x - 3, this.y - this.height / 2, 6, 15);
        ctx.fillRect(this.x - 12, this.y, 24, 3);
    }
    
    /**
     * 绘制血量条
     */
    drawHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        // 背景
        ctx.fillStyle = '#333333';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 8, barWidth, barHeight);
        
        // 血量
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 8, barWidth * healthPercent, barHeight);
    }
}

/**
 * 道具类
 */
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 2;
        this.type = type; // 'bullet' or 'health'
    }
    
    update() {
        this.y += this.speed;
    }
    
    draw(ctx) {
        if (this.type === 'bullet') {
            ctx.fillStyle = '#0088ff';
        } else {
            ctx.fillStyle = '#ff0088';
        }
        
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // 绘制道具标识
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        if (this.type === 'bullet') {
            ctx.fillText('B', this.x, this.y + 4);
        } else {
            ctx.fillText('H', this.x, this.y + 4);
        }
    }
}

/**
 * 障碍物类 - 不能被子弹摧毁的障碍物
 */
class Obstacle {
    constructor(x, y, speed) {
        this.x = x;
        this.y = y;
        this.width = 50;
        this.height = 30;
        this.speed = speed;
        this.rotation = 0;
    }
    
    update() {
        this.y += this.speed;
        this.rotation += 0.02; // 缓慢旋转增加视觉效果
    }
    
    draw(ctx) {
        ctx.save();
        
        // 移动到障碍物中心
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 绘制主体 - 灰色金属质感
        const gradient = ctx.createLinearGradient(-this.width/2, -this.height/2, this.width/2, this.height/2);
        gradient.addColorStop(0, '#666666');
        gradient.addColorStop(0.5, '#888888');
        gradient.addColorStop(1, '#444444');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // 绘制边框
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // 绘制警告标识
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, 5);
        
        // 绘制装饰线条
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-this.width/3, -this.height/3);
        ctx.lineTo(this.width/3, -this.height/3);
        ctx.moveTo(-this.width/3, this.height/3);
        ctx.lineTo(this.width/3, this.height/3);
        ctx.stroke();
        
        ctx.restore();
    }
}

/**
 * 粒子类
 */
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 6;
        this.vy = (Math.random() - 0.5) * 6;
        this.life = 30;
        this.maxLife = 30;
        this.color = color;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.fillStyle = this.color + Math.floor(alpha * 255).toString(16).padStart(2, '0');
        ctx.fillRect(this.x - 2, this.y - 2, 4, 4);
    }
}

/**
 * 僚机类
 */
class Wingman {
    constructor(x, y, side) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        this.side = side; // 'left' or 'right'
        this.shootTimer = 0;
        this.shootInterval = 300; // 射击间隔（毫秒）
        this.offsetX = side === 'left' ? -60 : 60; // 相对于玩家的偏移
        this.offsetY = 20;
    }
    
    /**
     * 更新僚机位置（跟随玩家）
     */
    update(playerX, playerY) {
        this.x = playerX + this.offsetX;
        this.y = playerY + this.offsetY;
        this.shootTimer += 16; // 假设60FPS，每帧约16ms
    }
    
    /**
     * 检查是否可以射击
     */
    canShoot() {
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            return true;
        }
        return false;
    }
    
    /**
     * 绘制僚机
     */
    draw(ctx) {
        // 绘制僚机主体（蓝色，区别于玩家）
        ctx.fillStyle = '#0088ff';
        ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        
        // 绘制僚机标识
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('W', this.x, this.y + 4);
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    const game = new ShootingGame();
});

// 防止页面滚动和缩放
document.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
    e.preventDefault();
});

document.addEventListener('gesturechange', (e) => {
    e.preventDefault();
});

document.addEventListener('gestureend', (e) => {
    e.preventDefault();
});