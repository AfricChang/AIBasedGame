/**
 * 打飞机游戏主要逻辑
 */


const SOUND_ON_ICON = '&#128266;';
const SOUND_OFF_ICON = '&#128263;';

class ShootingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // 音频管理器
        this.audioManager = new AudioManager();
        
        // 游戏状态
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.gameMode = 'endless'; // endless, level
        this.currentLevel = 1;
        this.levelProgress = 0;
        this.levelTarget = 1000; // 每关需要的分数
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
        this.totalBulletPowerUps = 0; // 总共获得的弹道道具数量
        this.missiles = []; // 导弹数组
        this.unlockedMissiles = 0; // 已解锁的导弹数量
        this.maxMissiles = 2; // 最多解锁2个导弹
        this.missileTimer = 0; // 导弹发射计时器
        this.missileInterval = 3000; // 导弹发射间隔（3秒）
        this.currentMissileIndex = 0; // 当前发射的导弹索引（用于交替发射）
        
        // 血量包系统
        this.healthPacksCollected = 0; // 收集的血量包数量
        this.autoHealUnlocked = false; // 是否解锁自动恢复血量
        this.autoHealTimer = 0; // 自动恢复血量计时器
        this.autoHealInterval = 5000; // 自动恢复间隔（5秒）
        this.autoHealPercent = 0.1; // 自动恢复百分比（10%）
        this.shield = false; // 保护罩状态
        this.shieldTimer = 0; // 保护罩计时器
        this.shieldDuration = 5000; // 保护罩持续时间（5秒）
        
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
        // 游戏模式选择
        document.getElementById('endlessModeBtn').addEventListener('click', () => {
            this.selectGameMode('endless');
            this.startGame();
        });
        
        document.getElementById('levelModeBtn').addEventListener('click', () => {
            alert('\u5173\u5361\u6a21\u5f0f\u6b63\u5728\u5f00\u53d1\u4e2d\uff0c\u656c\u8bf7\u671f\u5f85\uff01');
        });
        
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        document.getElementById('soundBtn').addEventListener('click', () => {
            const isEnabled = this.audioManager.toggleSound();
            document.getElementById('soundBtn').innerHTML = isEnabled ? SOUND_ON_ICON : SOUND_OFF_ICON;
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
     * 选择游戏模式
     */
    selectGameMode(mode) {
        this.gameMode = mode;
        
        // 更新按钮状态
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        if (mode === 'endless') {
            document.getElementById('endlessModeBtn').classList.add('selected');
        } else {
            document.getElementById('levelModeBtn').classList.add('selected');
        }
    }
    
    /**
     * 检查关卡进度
     */
    checkLevelProgress() {
        // 关卡模式暂未实现
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
        this.totalBulletPowerUps = 0;
        this.missiles = [];
        this.unlockedMissiles = 0;
        this.missileTimer = 0;
        this.currentMissileIndex = 0; // 重置导弹发射索引
        
        // 重置血量包系统
        this.healthPacksCollected = 0;
        this.autoHealUnlocked = false;
        this.autoHealTimer = 0;
        this.shield = false;
        this.shieldTimer = 0;
        
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
        document.getElementById('totalBulletCount').textContent = this.totalBulletPowerUps;
        document.getElementById('missileCount').textContent = this.unlockedMissiles;
        document.getElementById('healthPackCount').textContent = this.healthPacksCollected;
        
        // 显示或隐藏自动恢复状态
        const autoHealStatus = document.getElementById('autoHealStatus');
        if (this.autoHealUnlocked) {
            autoHealStatus.style.display = 'block';
        } else {
            autoHealStatus.style.display = 'none';
        }
        
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
        
        // 更新游戏模式信息
        const gameModeInfo = document.getElementById('gameModeInfo');
        const levelInfo = document.getElementById('levelInfo');
        
        gameModeInfo.textContent = '模式: 无尽';
        levelInfo.style.display = 'none';
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
        let speed = 2 + Math.random() * 3;
        
        // 根据分数调整难度
        speed += (this.score / 1000);
        const difficultyLevel = Math.floor(this.score / 500);
        
        const rand = Math.random();
        let enemyType = 'scout';
        
        if (difficultyLevel >= 4 && rand < 0.05) {
            enemyType = 'boss'; // 5% Boss机（高难度时）
        } else if (difficultyLevel >= 3 && rand < 0.15) {
            enemyType = 'gunship'; // 10% 炮艇（中高难度时）
        } else if (difficultyLevel >= 2 && rand < 0.35) {
            enemyType = 'bomber'; // 20% 轰炸机（中难度时）
        } else if (difficultyLevel >= 1 && rand < 0.60) {
            enemyType = 'fighter'; // 25% 战斗机（低难度时）
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
        const spawnInterval = Math.max(300, 1000 - (this.score / 10));
        
        if (this.enemySpawnTimer > spawnInterval) {
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
        this.updateMissiles();
        
        // 更新导弹发射计时器
        if (this.unlockedMissiles > 0 && this.wingmen.length > 0) {
            this.missileTimer += deltaTime;
            // 根据解锁的导弹数量调整发射间隔
            const interval = this.unlockedMissiles === 2 ? 1000 : this.missileInterval; // 两个导弹时1秒间隔
            if (this.missileTimer >= interval) {
                this.launchMissile();
                this.missileTimer = 0;
            }
        }
        
        // 更新自动恢复血量计时器
        if (this.autoHealUnlocked && this.health < this.maxHealth) {
            this.autoHealTimer += deltaTime;
            if (this.autoHealTimer >= this.autoHealInterval) {
                // 按百分比恢复血量
                const healAmount = Math.ceil(this.maxHealth * this.autoHealPercent);
                this.health = Math.min(this.maxHealth, this.health + healAmount);
                this.autoHealTimer = 0;
                // 创建恢复血量的特效
                for (let i = 0; i < 3; i++) {
                    this.particles.push(new Particle(
                        this.player.x + (Math.random() - 0.5) * 40,
                        this.player.y + (Math.random() - 0.5) * 40,
                        '#00FF88'
                    ));
                }
            }
        }
        
        // 更新保护罩计时器
        if (this.shield) {
            this.shieldTimer += deltaTime;
            if (this.shieldTimer >= this.shieldDuration) {
                this.shield = false;
                this.shieldTimer = 0;
            }
        }
        
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
            // 触摸控制时，飞机位置相对手指位置向上偏移60像素，向左偏移20像素
            targetX = this.touch.x - 20;
            targetY = this.touch.y - 60;
        } else if (this.mouse.down) {
            // 鼠标控制时，飞机位置相对鼠标位置向上偏移40像素，向左偏移15像素
            targetX = this.mouse.x - 15;
            targetY = this.mouse.y - 40;
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
                            this.checkLevelProgress(); // 检查关卡进度
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
                
                if (!this.shield) { // 保护罩状态下免疫伤害
                    if (this.bulletCount > 1) {
                        this.bulletCount--;
                    } else {
                        this.health -= 15;
                    }
                    // 播放玩家受伤音效
                    this.audioManager.playPlayerHurt();
                } else {
                    // 保护罩吸收伤害的特效
                    this.createParticles(this.player.x, this.player.y, '#00FFFF', 8);
                }
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
                
                if (!this.shield) { // 保护罩状态下免疫伤害
                    if (this.bulletCount > 1) {
                        this.bulletCount--;
                    } else {
                        this.health -= damage;
                    }
                    // 播放玩家受伤音效
                    this.audioManager.playPlayerHurt();
                } else {
                    // 保护罩吸收伤害的特效
                    this.createParticles(this.player.x, this.player.y, '#00FFFF', 8);
                }
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
                    this.totalBulletPowerUps++; // 增加总弹道道具计数
                    
                    // 检查是否可以解锁僚机：收集5个和10个弹道包分别解锁僚机
                    if ((this.totalBulletPowerUps === 5 || this.totalBulletPowerUps === 10) && this.wingmen.length < this.maxWingmen) {
                        this.unlockWingman();
                    }
                    
                    // 检查是否可以解锁导弹：12个和24个弹道道具各解锁一个导弹
                    if ((this.totalBulletPowerUps === 12 || this.totalBulletPowerUps === 24) && this.unlockedMissiles < this.maxMissiles) {
                        this.unlockedMissiles++;
                        // 创建解锁导弹的特效
                        for (let i = 0; i < 20; i++) {
                            this.particles.push(new Particle(
                                this.canvas.width / 2 + (Math.random() - 0.5) * 100,
                                this.canvas.height / 2 + (Math.random() - 0.5) * 100,
                                '#FFD700'
                            ));
                        }
                    }
                } else if (powerUp.type === 'health') {
                    this.healthPacksCollected++; // 增加血量包收集计数
                    
                    // 检查是否解锁自动恢复血量功能
                    if (this.healthPacksCollected >= 10 && !this.autoHealUnlocked) {
                        this.autoHealUnlocked = true;
                        // 创建解锁自动恢复的特效
                        for (let i = 0; i < 15; i++) {
                            this.particles.push(new Particle(
                                this.canvas.width / 2 + (Math.random() - 0.5) * 100,
                                this.canvas.height / 2 + (Math.random() - 0.5) * 100,
                                '#00FF00'
                            ));
                        }
                    }
                    
                    // 如果满血状态，激活保护罩
                    if (this.health >= this.maxHealth) {
                        this.shield = true;
                        this.shieldTimer = 0;
                        // 创建保护罩激活特效
                        for (let i = 0; i < 10; i++) {
                            this.particles.push(new Particle(
                                this.player.x + (Math.random() - 0.5) * 60,
                                this.player.y + (Math.random() - 0.5) * 60,
                                '#00FFFF'
                            ));
                        }
                    } else {
                        // 不是满血状态，正常恢复血量
                        this.health = Math.min(this.maxHealth, this.health + 30);
                    }
                    
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
                if (!this.shield) { // 保护罩状态下免疫伤害
                    if (this.bulletCount > 1) {
                        this.bulletCount--;
                    } else {
                        this.health -= 25; // 比普通敌机伤害稍高
                    }
                    // 播放玩家受伤音效
                    this.audioManager.playPlayerHurt();
                } else {
                    // 保护罩吸收伤害的特效
                    this.createParticles(this.player.x, this.player.y, '#00FFFF', 8);
                }
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
     * 发射导弹
     */
    launchMissile() {
        if (this.wingmen.length > 0) {
            // 如果有两个导弹，交替从不同僚机发射；否则随机选择
            let wingman;
            if (this.unlockedMissiles === 2 && this.wingmen.length >= 2) {
                wingman = this.wingmen[this.currentMissileIndex % this.wingmen.length];
                this.currentMissileIndex++; // 下次从另一个僚机发射
            } else {
                wingman = this.wingmen[Math.floor(Math.random() * this.wingmen.length)];
            }
            
            // 寻找最近的敌机作为目标
            let target = null;
            let minDistance = Infinity;
            
            this.enemies.forEach(enemy => {
                const distance = Math.sqrt(
                    Math.pow(enemy.x - wingman.x, 2) + Math.pow(enemy.y - wingman.y, 2)
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    target = enemy;
                }
            });
            
            // 如果找到目标，发射导弹
            if (target) {
                const missile = new Missile(wingman.x, wingman.y, target);
                this.missiles.push(missile);
                
                // 创建发射特效
                this.createParticles(wingman.x, wingman.y, '#ff6600', 8);
            }
        }
    }
    
    /**
     * 更新导弹
     */
    updateMissiles() {
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            missile.update();
            
            // 检查导弹是否到达目标或超出边界
            if (missile.hasReachedTarget() || missile.y < 0 || missile.y > this.canvas.height ||
                missile.x < 0 || missile.x > this.canvas.width) {
                
                // 导弹爆炸
                this.explodeMissile(missile.x, missile.y);
                this.missiles.splice(i, 1);
            }
        }
    }
    
    /**
     * 导弹爆炸效果
     */
    explodeMissile(x, y) {
        const explosionRadius = 120; // 爆炸半径
        
        // 创建爆炸粒子效果
        this.createParticles(x, y, '#ff4400', 35);
        this.createParticles(x, y, '#ffaa00', 25);
        this.createParticles(x, y, '#ffffff', 20);
        this.createParticles(x, y, '#ff0000', 15);
        
        // 摧毁爆炸范围内的敌机
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const distance = Math.sqrt(
                Math.pow(enemy.x - x, 2) + Math.pow(enemy.y - y, 2)
            );
            
            if (distance <= explosionRadius) {
                this.createParticles(enemy.x, enemy.y, '#ff0000', 8);
                this.enemies.splice(i, 1);
                this.score += 10;
            }
        }
        
        // 摧毁爆炸范围内的障碍物
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            const distance = Math.sqrt(
                Math.pow(obstacle.x - x, 2) + Math.pow(obstacle.y - y, 2)
            );
            
            if (distance <= explosionRadius) {
                this.createParticles(obstacle.x, obstacle.y, '#888888', 12);
                this.obstacles.splice(i, 1);
                this.score += 5;
            }
        }
    }
    
    /**
     * 渲染游戏
     */
    render() {
        GameAssets.drawBackground(this.ctx, this.canvas.width, this.canvas.height);
        
        // 绘制星空背景
        GameAssets.drawStars(this.ctx, this.canvas.width, this.canvas.height);
        
        // 绘制游戏对象
        if (this.player) {
            this.player.draw(this.ctx);
            
            // 绘制保护罩
            if (this.shield) {
                GameAssets.drawShield(this.ctx, this.player);
            }
        }
        
        this.wingmen.forEach(wingman => wingman.draw(this.ctx));
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.missiles.forEach(missile => missile.draw(this.ctx));
        this.enemies.forEach(enemy => enemy.draw(this.ctx));
        this.powerUps.forEach(powerUp => powerUp.draw(this.ctx));
        this.obstacles.forEach(obstacle => obstacle.draw(this.ctx));
        this.particles.forEach(particle => particle.draw(this.ctx));
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
        GameAssets.drawPlayer(ctx, this);
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
        GameAssets.drawBullet(ctx, this);
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
        GameAssets.drawEnemy(ctx, this);
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
        GameAssets.drawPowerUp(ctx, this);
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
        GameAssets.drawObstacle(ctx, this);
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
        GameAssets.drawParticle(ctx, this);
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
        GameAssets.drawWingman(ctx, this);
    }
}

/**
 * 导弹类
 */
class Missile {
    constructor(x, y, target) {
        this.x = x;
        this.y = y;
        this.target = target; // 目标敌机
        this.targetX = target.x; // 记录目标初始位置
        this.targetY = target.y;
        this.speed = 8;
        this.width = 10;
        this.height = 30;
        this.trail = []; // 尾迹效果
        this.maxTrailLength = 8;
        
        // 计算朝向目标的方向
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.velocityX = (dx / distance) * this.speed;
        this.velocityY = (dy / distance) * this.speed;
    }
    
    /**
     * 更新导弹位置
     */
    update() {
        // 添加当前位置到尾迹
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // 如果目标还存在，更新追踪方向
        if (this.target && this.target.x !== undefined) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // 轻微调整方向以追踪目标
                const targetVelX = (dx / distance) * this.speed;
                const targetVelY = (dy / distance) * this.speed;
                
                // 平滑转向
                this.velocityX += (targetVelX - this.velocityX) * 0.1;
                this.velocityY += (targetVelY - this.velocityY) * 0.1;
            }
        }
        
        // 更新位置
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
    
    /**
     * 检查是否到达目标
     */
    hasReachedTarget() {
        if (!this.target || this.target.x === undefined) {
            return false;
        }
        
        const distance = Math.sqrt(
            Math.pow(this.target.x - this.x, 2) + Math.pow(this.target.y - this.y, 2)
        );
        
        return distance < 30; // 接近目标30像素时引爆
    }
    
    /**
     * 绘制导弹
     */
    draw(ctx) {
        GameAssets.drawMissile(ctx, this);
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