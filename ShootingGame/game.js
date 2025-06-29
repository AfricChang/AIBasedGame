/**
 * ��ɻ���Ϸ��Ҫ�߼�
 */


const SOUND_ON_ICON = '&#128266;';
const SOUND_OFF_ICON = '&#128263;';

class ShootingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();
        
        // ��Ƶ������
        this.audioManager = new AudioManager();
        
        // ��Ϸ״̬
        this.gameState = 'menu'; // menu, playing, paused, gameOver
        this.gameMode = 'endless'; // endless, level
        this.currentLevel = 1;
        this.levelProgress = 0;
        this.levelTarget = 1000; // ÿ����Ҫ�ķ���
        this.score = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.bulletCount = 1;
        this.maxBullets = 3;
        this.bulletSpeedMultiplier = 1; // �����ٶȱ���
        this.maxBulletSpeedMultiplier = 2.5; // ��󵯵��ٶȱ�������
        
        // �Ż�ϵͳ
        this.wingmen = []; // �Ż�����
        this.consecutiveBulletPowerUps = 0; // ������õ������ߵļ���
        this.maxWingmen = 2; // ���2���Ż������Ҹ�һ����
        this.totalBulletPowerUps = 0; // �ܹ���õĵ�����������
        this.missiles = []; // ��������
        this.unlockedMissiles = 0; // �ѽ����ĵ�������
        this.maxMissiles = 2; // ������2������
        this.missileTimer = 0; // ���������ʱ��
        this.missileInterval = 3000; // ������������3�룩
        this.currentMissileIndex = 0; // ��ǰ����ĵ������������ڽ��淢�䣩
        
        // Ѫ����ϵͳ
        this.healthPacksCollected = 0; // �ռ���Ѫ��������
        this.autoHealUnlocked = false; // �Ƿ�����Զ��ָ�Ѫ��
        this.autoHealTimer = 0; // �Զ��ָ�Ѫ����ʱ��
        this.autoHealInterval = 5000; // �Զ��ָ������5�룩
        this.autoHealPercent = 0.1; // �Զ��ָ��ٷֱȣ�10%��
        this.shield = false; // ������״̬
        this.shieldTimer = 0; // �����ּ�ʱ��
        this.shieldDuration = 5000; // �����ֳ���ʱ�䣨5�룩
        
        // ��Ϸ��������
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.obstacles = [];
        this.obstacles = []; // �ϰ�������
        
        // ��Ϸ��ʱ��
        this.lastTime = 0;
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        this.obstacleSpawnTimer = 0; // �ϰ������ɼ�ʱ��
        
        // ���봦��
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.touch = { x: 0, y: 0, active: false };
        
        this.setupEventListeners();
        this.setupUI();
        this.loadHighScore();
        this.showScreen('startScreen');
    }
    
    /**
     * ���û����ߴ�
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
     * �����¼�������
     */
    setupEventListeners() {
        // �����¼�
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
        
        // ����¼�
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.mouse.down = true;
            e.preventDefault();
            // �ָ���Ƶ������
            this.audioManager.resumeAudioContext();
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
        
        // �����¼�
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            this.touch.x = touch.clientX - rect.left;
            this.touch.y = touch.clientY - rect.top;
            this.touch.active = true;
            // �ָ���Ƶ������
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
     * ����UI�¼�
     */
    setupUI() {
        // ��Ϸģʽѡ��
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
     * ��ʾָ����Ļ
     */
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');
    }
    
    /**
     * ѡ����Ϸģʽ
     */
    selectGameMode(mode) {
        this.gameMode = mode;
        
        // ���°�ť״̬
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
     * ���ؿ�����
     */
    checkLevelProgress() {
        // �ؿ�ģʽ��δʵ��
    }
    

    
    /**
     * ��ʼ��Ϸ
     */
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.health = this.maxHealth;
        this.bulletCount = 1;
        this.bulletSpeedMultiplier = 1; // ���õ����ٶȱ���
        

        
        // �����Ż�ϵͳ
        this.wingmen = [];
        this.consecutiveBulletPowerUps = 0;
        this.totalBulletPowerUps = 0;
        this.missiles = [];
        this.unlockedMissiles = 0;
        this.missileTimer = 0;
        this.currentMissileIndex = 0; // ���õ�����������
        
        // ����Ѫ����ϵͳ
        this.healthPacksCollected = 0;
        this.autoHealUnlocked = false;
        this.autoHealTimer = 0;
        this.shield = false;
        this.shieldTimer = 0;
        
        // �����Ϸ����
        this.bullets = [];
        this.enemies = [];
        this.powerUps = [];
        this.particles = [];
        this.obstacles = [];
        
        // �������
        this.player = new Player(this.canvas.width / 2, this.canvas.height - 100);
        
        // ���ü�ʱ��
        this.enemySpawnTimer = 0;
        this.powerUpSpawnTimer = 0;
        this.obstacleSpawnTimer = 0;
        
        this.updateUI();
        this.showScreen('gameScreen');
        
        // �ָ���Ƶ�����Ĳ���ʼ��������
        this.audioManager.resumeAudioContext();
        this.audioManager.playBackgroundMusic();
        
        if (!this.gameLoop) {
            this.gameLoop = this.update.bind(this);
            requestAnimationFrame(this.gameLoop);
        }
    }
    
    /**
     * ��ͣ��Ϸ
     */
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.showScreen('pauseScreen');
        }
    }
    
    /**
     * ������Ϸ
     */
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.showScreen('gameScreen');
        }
    }
    
    /**
     * ��Ϸ����
     */
    gameOver() {
        this.gameState = 'gameOver';
        this.saveHighScore();
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('highScore').textContent = this.getHighScore();
        this.showScreen('gameOverScreen');
        
        // ֹͣ�������ֲ�������Ϸ������Ч
        this.audioManager.stopBackgroundMusic();
        this.audioManager.playGameOver();
    }
    
    /**
     * ����UI��ʾ
     */
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('currentHighScore').textContent = this.getHighScore();
        document.getElementById('bulletCount').textContent = this.bulletCount;
        document.getElementById('totalBulletCount').textContent = this.totalBulletPowerUps;
        document.getElementById('missileCount').textContent = this.unlockedMissiles;
        document.getElementById('healthPackCount').textContent = this.healthPacksCollected;
        
        // ��ʾ�������Զ��ָ�״̬
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
        
        // ������Ϸģʽ��Ϣ
        const gameModeInfo = document.getElementById('gameModeInfo');
        const levelInfo = document.getElementById('levelInfo');
        
        gameModeInfo.textContent = 'ģʽ: �޾�';
        levelInfo.style.display = 'none';
    }
    
    /**
     * ������߷�
     */
    saveHighScore() {
        const highScore = this.getHighScore();
        if (this.score > highScore) {
            localStorage.setItem('shootingGameHighScore', this.score.toString());
        }
    }
    
    /**
     * ��ȡ��߷�
     */
    getHighScore() {
        return parseInt(localStorage.getItem('shootingGameHighScore') || '0');
    }
    
    /**
     * ������߷�
     */
    loadHighScore() {
        const highScore = this.getHighScore();
        document.getElementById('highScore').textContent = highScore;
        // ��ʼ����Ϸ�������߷���ʾ
        const currentHighScoreElement = document.getElementById('currentHighScore');
        if (currentHighScoreElement) {
            currentHighScoreElement.textContent = highScore;
        }
    }
    
    /**
     * ���ɵ���
     */
    spawnEnemy() {
        const x = Math.random() * (this.canvas.width - 60);
        let speed = 2 + Math.random() * 3;
        
        // ���ݷ��������Ѷ�
        speed += (this.score / 1000);
        const difficultyLevel = Math.floor(this.score / 500);
        
        const rand = Math.random();
        let enemyType = 'scout';
        
        if (difficultyLevel >= 4 && rand < 0.05) {
            enemyType = 'boss'; // 5% Boss�������Ѷ�ʱ��
        } else if (difficultyLevel >= 3 && rand < 0.15) {
            enemyType = 'gunship'; // 10% ��ͧ���и��Ѷ�ʱ��
        } else if (difficultyLevel >= 2 && rand < 0.35) {
            enemyType = 'bomber'; // 20% ��ը�������Ѷ�ʱ��
        } else if (difficultyLevel >= 1 && rand < 0.60) {
            enemyType = 'fighter'; // 25% ս���������Ѷ�ʱ��
        } else {
            enemyType = 'scout'; // 40% ������Ĭ�ϣ�
        }
        
        this.enemies.push(new Enemy(x, -30, speed, enemyType));
    }
    
    /**
     * ���ɵ���
     */
    spawnPowerUp() {
        const x = Math.random() * (this.canvas.width - 30);
        const type = Math.random() < 0.7 ? 'bullet' : 'health';
        this.powerUps.push(new PowerUp(x, -20, type));
    }
    
    /**
     * �����ϰ���
     */
    spawnObstacle() {
        const x = Math.random() * (this.canvas.width - 60);
        const speed = 1 + Math.random() * 2 + (this.score / 2000); // �ȵл�����
        this.obstacles.push(new Obstacle(x, -40, speed));
    }
    
    /**
     * ��������Ч��
     */
    createParticles(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color));
        }
    }
    
    /**
     * ����Ϸѭ��
     */
    update(currentTime) {
        if (this.gameState !== 'playing') {
            requestAnimationFrame(this.gameLoop);
            return;
        }
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // �������
        if (this.player) {
            this.updatePlayer();
        }
        
        // ���ɵ���
        this.enemySpawnTimer += deltaTime;
        const spawnInterval = Math.max(300, 1000 - (this.score / 10));
        
        if (this.enemySpawnTimer > spawnInterval) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // ���ɵ���
        this.powerUpSpawnTimer += deltaTime;
        if (this.powerUpSpawnTimer > 8000 + Math.random() * 5000) {
            this.spawnPowerUp();
            this.powerUpSpawnTimer = 0;
        }
        
        // �����ϰ����ֹ�һ���
        this.obstacleSpawnTimer += deltaTime;
        if (this.obstacleSpawnTimer > 6000 + Math.random() * 4000) { // 6-10���������
            this.spawnObstacle();
            this.obstacleSpawnTimer = 0;
        }
        
        // ������Ϸ����
        this.updateBullets();
        this.updateEnemies();
        this.updatePowerUps();
        this.updateParticles();
        this.updateObstacles();
        this.updateWingmen();
        this.updateMissiles();
        
        // ���µ��������ʱ��
        if (this.unlockedMissiles > 0 && this.wingmen.length > 0) {
            this.missileTimer += deltaTime;
            // ���ݽ����ĵ�����������������
            const interval = this.unlockedMissiles === 2 ? 1000 : this.missileInterval; // ��������ʱ1����
            if (this.missileTimer >= interval) {
                this.launchMissile();
                this.missileTimer = 0;
            }
        }
        
        // �����Զ��ָ�Ѫ����ʱ��
        if (this.autoHealUnlocked && this.health < this.maxHealth) {
            this.autoHealTimer += deltaTime;
            if (this.autoHealTimer >= this.autoHealInterval) {
                // ���ٷֱȻָ�Ѫ��
                const healAmount = Math.ceil(this.maxHealth * this.autoHealPercent);
                this.health = Math.min(this.maxHealth, this.health + healAmount);
                this.autoHealTimer = 0;
                // �����ָ�Ѫ������Ч
                for (let i = 0; i < 3; i++) {
                    this.particles.push(new Particle(
                        this.player.x + (Math.random() - 0.5) * 40,
                        this.player.y + (Math.random() - 0.5) * 40,
                        '#00FF88'
                    ));
                }
            }
        }
        
        // ���±����ּ�ʱ��
        if (this.shield) {
            this.shieldTimer += deltaTime;
            if (this.shieldTimer >= this.shieldDuration) {
                this.shield = false;
                this.shieldTimer = 0;
            }
        }
        
        // ��ײ���
        this.checkCollisions();
        
        // ��Ⱦ
        this.render();
        
        // ����UI
        this.updateUI();
        
        // �����Ϸ����
        if (this.health <= 0) {
            this.gameOver();
        }
        
        requestAnimationFrame(this.gameLoop);
    }
    
    /**
     * �������
     */
    updatePlayer() {
        // ��ȡĿ��λ��
        let targetX = this.player.x;
        let targetY = this.player.y;
        
        if (this.touch.active) {
            // ��������ʱ���ɻ�λ�������ָλ������ƫ��60���أ�����ƫ��20����
            targetX = this.touch.x - 20;
            targetY = this.touch.y - 60;
        } else if (this.mouse.down) {
            // ������ʱ���ɻ�λ��������λ������ƫ��40���أ�����ƫ��15����
            targetX = this.mouse.x - 15;
            targetY = this.mouse.y - 40;
        }
        
        // ���̿���
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
        
        // ƽ���ƶ�
        this.player.x += (targetX - this.player.x) * 0.15;
        this.player.y += (targetY - this.player.y) * 0.15;
        
        // �߽���
        this.player.x = Math.max(this.player.width / 2, Math.min(this.canvas.width - this.player.width / 2, this.player.x));
        this.player.y = Math.max(this.player.height / 2, Math.min(this.canvas.height - this.player.height / 2, this.player.y));
        
        // �Զ����
        this.player.update();
        if (this.player.canShoot()) {
            this.shootBullets();
        }
    }
    
    /**
     * �����ӵ�
     */
    shootBullets() {
        // ����������ʱ�����ӵ����ٶȣ������ƣ�
        if (this.bulletCount >= this.maxBullets && this.bulletSpeedMultiplier < this.maxBulletSpeedMultiplier) {
            this.bulletSpeedMultiplier = Math.min(this.bulletSpeedMultiplier + 0.1, this.maxBulletSpeedMultiplier);
        }
        
        const bulletSpacing = 20;
        const startX = this.player.x - (this.bulletCount - 1) * bulletSpacing / 2;
        
        for (let i = 0; i < this.bulletCount; i++) {
            const x = startX + i * bulletSpacing;
            this.bullets.push(new Bullet(x, this.player.y - this.player.height / 2, false, this.bulletSpeedMultiplier));
        }
        
        // �Ż�Ҳ�����
        this.wingmen.forEach(wingman => {
            if (wingman.canShoot()) {
                this.bullets.push(new Bullet(wingman.x, wingman.y - wingman.height / 2, false, this.bulletSpeedMultiplier));
            }
        });
        
        // ���������Ч
        this.audioManager.playShoot();
    }
    
    /**
     * �����ӵ�
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
     * ���µ���
     */
    updateEnemies() {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const shootInfo = this.enemies[i].update();
            
            // ����л����
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
     * ���µ���
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
     * ��������
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
     * �����ϰ���
     */
    updateObstacles() {
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            this.obstacles[i].update();
            
            // �Ƴ�������Ļ���ϰ���
            if (this.obstacles[i].y > this.canvas.height + 50) {
                this.obstacles.splice(i, 1);
            }
        }
    }
    
    /**
     * ��ײ���
     */
    checkCollisions() {
        // ����ӵ��������ײ
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (!this.bullets[i].isEnemy) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    if (this.checkCollision(this.bullets[i], this.enemies[j])) {
                        this.createParticles(this.enemies[j].x, this.enemies[j].y, '#ff6600', 8);
                        this.bullets.splice(i, 1);
                        
                        // �����Ѫ���л�
                        const isDead = this.enemies[j].takeDamage(1);
                        if (isDead) {
                            // ���ݵл����͸��費ͬ����
                            let scoreBonus = 10;
                            switch(this.enemies[j].type) {
                                case 'scout': scoreBonus = 10; break;
                                case 'fighter': scoreBonus = 20; break;
                                case 'bomber': scoreBonus = 30; break;
                                case 'gunship': scoreBonus = 40; break;
                                case 'boss': scoreBonus = 100; break;
                            }
                            this.score += scoreBonus;
                            this.checkLevelProgress(); // ���ؿ�����
                            this.enemies.splice(j, 1);
                            // ���ű�ը��Ч
                            this.audioManager.playExplosion();
                        } else {
                            // ���Ż�����Ч
                            this.audioManager.playHit();
                        }
                        break;
                    }
                }
            }
        }
        
        // �л��ӵ��������ײ
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (this.bullets[i].isEnemy && this.checkCollision(this.bullets[i], this.player)) {
                this.createParticles(this.player.x, this.player.y, '#ff0000', 6);
                this.bullets.splice(i, 1);
                
                if (!this.shield) { // ������״̬�������˺�
                    if (this.bulletCount > 1) {
                        this.bulletCount--;
                    } else {
                        this.health -= 15;
                    }
                    // �������������Ч
                    this.audioManager.playPlayerHurt();
                } else {
                    // �����������˺�����Ч
                    this.createParticles(this.player.x, this.player.y, '#00FFFF', 8);
                }
            }
        }
        
        // �л��ӵ����ϰ�����ײ
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (this.bullets[i].isEnemy) {
                for (let j = this.obstacles.length - 1; j >= 0; j--) {
                    if (this.checkCollision(this.bullets[i], this.obstacles[j])) {
                        // ����ײ������Ч��
                        this.createParticles(this.bullets[i].x, this.bullets[i].y, '#ff4400', 5);
                        // �Ƴ��л��ӵ�
                        this.bullets.splice(i, 1);
                        // ���Ż�����Ч
                        this.audioManager.playHit();
                        break;
                    }
                }
            }
        }
        
        // ����������ײ
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.enemies[i])) {
                this.createParticles(this.enemies[i].x, this.enemies[i].y, '#ff0000', 10);
                
                // ���ݵл�������ɲ�ͬ�˺�
                let damage = 20;
                switch(this.enemies[i].type) {
                    case 'scout': damage = 15; break;
                    case 'fighter': damage = 20; break;
                    case 'bomber': damage = 30; break;
                    case 'gunship': damage = 25; break;
                    case 'boss': damage = 50; break;
                }
                
                this.enemies.splice(i, 1);
                
                if (!this.shield) { // ������״̬�������˺�
                    if (this.bulletCount > 1) {
                        this.bulletCount--;
                    } else {
                        this.health -= damage;
                    }
                    // �������������Ч
                    this.audioManager.playPlayerHurt();
                } else {
                    // �����������˺�����Ч
                    this.createParticles(this.player.x, this.player.y, '#00FFFF', 8);
                }
            }
        }
        
        // ����������ײ
        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.powerUps[i])) {
                const powerUp = this.powerUps[i];
                this.createParticles(powerUp.x, powerUp.y, powerUp.type === 'bullet' ? '#00ff00' : '#ff00ff', 6);
                
                if (powerUp.type === 'bullet') {
                    // ֻ���ڵ���δ��ʱ�����ӵ�������
                    if (this.bulletCount < this.maxBullets) {
                        this.bulletCount++;
                    }
                    
                    // ���۵����Ƿ�������������������õĵ�������
                    this.consecutiveBulletPowerUps++;
                    this.totalBulletPowerUps++; // �����ܵ������߼���
                    
                    // ����Ƿ���Խ����Ż����ռ�5����10���������ֱ�����Ż�
                    if ((this.totalBulletPowerUps === 5 || this.totalBulletPowerUps === 10) && this.wingmen.length < this.maxWingmen) {
                        this.unlockWingman();
                    }
                    
                    // ����Ƿ���Խ���������12����24���������߸�����һ������
                    if ((this.totalBulletPowerUps === 12 || this.totalBulletPowerUps === 24) && this.unlockedMissiles < this.maxMissiles) {
                        this.unlockedMissiles++;
                        // ����������������Ч
                        for (let i = 0; i < 20; i++) {
                            this.particles.push(new Particle(
                                this.canvas.width / 2 + (Math.random() - 0.5) * 100,
                                this.canvas.height / 2 + (Math.random() - 0.5) * 100,
                                '#FFD700'
                            ));
                        }
                    }
                } else if (powerUp.type === 'health') {
                    this.healthPacksCollected++; // ����Ѫ�����ռ�����
                    
                    // ����Ƿ�����Զ��ָ�Ѫ������
                    if (this.healthPacksCollected >= 10 && !this.autoHealUnlocked) {
                        this.autoHealUnlocked = true;
                        // ���������Զ��ָ�����Ч
                        for (let i = 0; i < 15; i++) {
                            this.particles.push(new Particle(
                                this.canvas.width / 2 + (Math.random() - 0.5) * 100,
                                this.canvas.height / 2 + (Math.random() - 0.5) * 100,
                                '#00FF00'
                            ));
                        }
                    }
                    
                    // �����Ѫ״̬���������
                    if (this.health >= this.maxHealth) {
                        this.shield = true;
                        this.shieldTimer = 0;
                        // ���������ּ�����Ч
                        for (let i = 0; i < 10; i++) {
                            this.particles.push(new Particle(
                                this.player.x + (Math.random() - 0.5) * 60,
                                this.player.y + (Math.random() - 0.5) * 60,
                                '#00FFFF'
                            ));
                        }
                    } else {
                        // ������Ѫ״̬�������ָ�Ѫ��
                        this.health = Math.min(this.maxHealth, this.health + 30);
                    }
                    
                    this.consecutiveBulletPowerUps = 0; // �����������ʱ���õ������߼���
                }
                
                this.powerUps.splice(i, 1);
                this.score += 5;
                // ���ŵ����ռ���Ч
                this.audioManager.playPowerUp();
            }
        }
        
        // �ӵ����ϰ�����ײ
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (!this.bullets[i].isEnemy) {
                for (let j = this.obstacles.length - 1; j >= 0; j--) {
                    if (this.checkCollision(this.bullets[i], this.obstacles[j])) {
                        // ����ײ������Ч��
                        this.createParticles(this.bullets[i].x, this.bullets[i].y, '#ffaa00', 5);
                        // �Ƴ��ӵ�
                        this.bullets.splice(i, 1);
                        // ���Ż�����Ч
                        this.audioManager.playHit();
                        break;
                    }
                }
            }
        }
        
        // ������ϰ�����ײ
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            if (this.checkCollision(this.player, this.obstacles[i])) {
                this.createParticles(this.obstacles[i].x, this.obstacles[i].y, '#888888', 8);
                
                this.obstacles.splice(i, 1);
                
                // �ϰ�����ɽϴ��˺���ǿ����Ҷ��
                if (!this.shield) { // ������״̬�������˺�
                    if (this.bulletCount > 1) {
                        this.bulletCount--;
                    } else {
                        this.health -= 25; // ����ͨ�л��˺��Ը�
                    }
                    // �������������Ч
                    this.audioManager.playPlayerHurt();
                } else {
                    // �����������˺�����Ч
                    this.createParticles(this.player.x, this.player.y, '#00FFFF', 8);
                }
            }
        }
    }
    
    /**
     * ������������Ƿ���ײ
     */
    checkCollision(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (obj1.width + obj2.width) / 2;
    }
    
    /**
     * �����Ż�
     */
    unlockWingman() {
        if (this.wingmen.length < this.maxWingmen) {
            const side = this.wingmen.length === 0 ? 'left' : 'right';
            const wingman = new Wingman(this.player.x, this.player.y, side);
            this.wingmen.push(wingman);
            
            // ������ӽ�����Ч����Ч
            this.createParticles(this.player.x, this.player.y, '#0088ff', 15);
        }
    }
    
    /**
     * �����Ż�
     */
    updateWingmen() {
        this.wingmen.forEach(wingman => {
            wingman.update(this.player.x, this.player.y);
        });
    }
    
    /**
     * ���䵼��
     */
    launchMissile() {
        if (this.wingmen.length > 0) {
            // �������������������Ӳ�ͬ�Ż����䣻�������ѡ��
            let wingman;
            if (this.unlockedMissiles === 2 && this.wingmen.length >= 2) {
                wingman = this.wingmen[this.currentMissileIndex % this.wingmen.length];
                this.currentMissileIndex++; // �´δ���һ���Ż�����
            } else {
                wingman = this.wingmen[Math.floor(Math.random() * this.wingmen.length)];
            }
            
            // Ѱ������ĵл���ΪĿ��
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
            
            // ����ҵ�Ŀ�꣬���䵼��
            if (target) {
                const missile = new Missile(wingman.x, wingman.y, target);
                this.missiles.push(missile);
                
                // ����������Ч
                this.createParticles(wingman.x, wingman.y, '#ff6600', 8);
            }
        }
    }
    
    /**
     * ���µ���
     */
    updateMissiles() {
        for (let i = this.missiles.length - 1; i >= 0; i--) {
            const missile = this.missiles[i];
            missile.update();
            
            // ��鵼���Ƿ񵽴�Ŀ��򳬳��߽�
            if (missile.hasReachedTarget() || missile.y < 0 || missile.y > this.canvas.height ||
                missile.x < 0 || missile.x > this.canvas.width) {
                
                // ������ը
                this.explodeMissile(missile.x, missile.y);
                this.missiles.splice(i, 1);
            }
        }
    }
    
    /**
     * ������ըЧ��
     */
    explodeMissile(x, y) {
        const explosionRadius = 120; // ��ը�뾶
        
        // ������ը����Ч��
        this.createParticles(x, y, '#ff4400', 35);
        this.createParticles(x, y, '#ffaa00', 25);
        this.createParticles(x, y, '#ffffff', 20);
        this.createParticles(x, y, '#ff0000', 15);
        
        // �ݻٱ�ը��Χ�ڵĵл�
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
        
        // �ݻٱ�ը��Χ�ڵ��ϰ���
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
     * ��Ⱦ��Ϸ
     */
    render() {
        GameAssets.drawBackground(this.ctx, this.canvas.width, this.canvas.height);
        
        // �����ǿձ���
        GameAssets.drawStars(this.ctx, this.canvas.width, this.canvas.height);
        
        // ������Ϸ����
        if (this.player) {
            this.player.draw(this.ctx);
            
            // ���Ʊ�����
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
 * �����
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
 * �ӵ���
 */
class Bullet {
    constructor(x, y, isEnemy = false, speedMultiplier = 1) {
        this.x = x;
        this.y = y;
        this.width = 4;
        this.height = 10;
        this.baseSpeed = 3; // ���ͳ�ʼ�����ٶ�
        this.speed = this.baseSpeed * speedMultiplier;
        this.isEnemy = isEnemy;
        
        if (isEnemy) {
            this.speed = -8; // �л��ӵ����£��������ٶ�ȷ��ʼ�ձȵл���
        }
    }
    
    update() {
        if (this.isEnemy) {
            this.y -= this.speed; // �����ƶ�
        } else {
            this.y -= this.speed; // �����ƶ�
        }
    }
    
    draw(ctx) {
        GameAssets.drawBullet(ctx, this);
    }
}

/**
 * ���˻���
 */
class Enemy {
    constructor(x, y, speed, type = 'basic') {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.type = type;
        this.shootTimer = 0;
        this.shootDelay = 1000 + Math.random() * 2000; // ���������
        
        // ����������������
        this.setTypeProperties();
    }
    
    /**
     * ���ݵл�������������
     */
    setTypeProperties() {
        switch(this.type) {
            case 'scout': // ���� - ���������
                this.width = 25;
                this.height = 25;
                this.health = 1;
                this.maxHealth = 1;
                this.speed *= 1.5;
                break;
            case 'fighter': // ս���� - �е�ǿ��
                this.width = 30;
                this.height = 30;
                this.health = 2;
                this.maxHealth = 2;
                break;
            case 'bomber': // ��ը�� - ��ǿ������
                this.width = 40;
                this.height = 35;
                this.health = 3;
                this.maxHealth = 3;
                this.speed *= 0.7;
                break;
            case 'gunship': // ��ͧ - ������ĵл�
                this.width = 35;
                this.height = 32;
                this.health = 4;
                this.maxHealth = 4;
                this.speed *= 0.8;
                this.canShoot = true;
                break;
            case 'boss': // Boss�� - ��ǿ
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
        
        // ����߼���������ͧ���ͣ�
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
     * �ܵ��˺�
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
 * ������
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
 * �ϰ����� - ���ܱ��ӵ��ݻٵ��ϰ���
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
        this.rotation += 0.02; // ������ת�����Ӿ�Ч��
    }
    
    draw(ctx) {
        GameAssets.drawObstacle(ctx, this);
    }
}

/**
 * ������
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
 * �Ż���
 */
class Wingman {
    constructor(x, y, side) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 30;
        this.side = side; // 'left' or 'right'
        this.shootTimer = 0;
        this.shootInterval = 300; // �����������룩
        this.offsetX = side === 'left' ? -60 : 60; // �������ҵ�ƫ��
        this.offsetY = 20;
    }
    
    /**
     * �����Ż�λ�ã�������ң�
     */
    update(playerX, playerY) {
        this.x = playerX + this.offsetX;
        this.y = playerY + this.offsetY;
        this.shootTimer += 16; // ����60FPS��ÿ֡Լ16ms
    }
    
    /**
     * ����Ƿ�������
     */
    canShoot() {
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            return true;
        }
        return false;
    }
    
    /**
     * �����Ż�
     */
    draw(ctx) {
        GameAssets.drawWingman(ctx, this);
    }
}

/**
 * ������
 */
class Missile {
    constructor(x, y, target) {
        this.x = x;
        this.y = y;
        this.target = target; // Ŀ��л�
        this.targetX = target.x; // ��¼Ŀ���ʼλ��
        this.targetY = target.y;
        this.speed = 8;
        this.width = 10;
        this.height = 30;
        this.trail = []; // β��Ч��
        this.maxTrailLength = 8;
        
        // ���㳯��Ŀ��ķ���
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        this.velocityX = (dx / distance) * this.speed;
        this.velocityY = (dy / distance) * this.speed;
    }
    
    /**
     * ���µ���λ��
     */
    update() {
        // ��ӵ�ǰλ�õ�β��
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // ���Ŀ�껹���ڣ�����׷�ٷ���
        if (this.target && this.target.x !== undefined) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // ��΢����������׷��Ŀ��
                const targetVelX = (dx / distance) * this.speed;
                const targetVelY = (dy / distance) * this.speed;
                
                // ƽ��ת��
                this.velocityX += (targetVelX - this.velocityX) * 0.1;
                this.velocityY += (targetVelY - this.velocityY) * 0.1;
            }
        }
        
        // ����λ��
        this.x += this.velocityX;
        this.y += this.velocityY;
    }
    
    /**
     * ����Ƿ񵽴�Ŀ��
     */
    hasReachedTarget() {
        if (!this.target || this.target.x === undefined) {
            return false;
        }
        
        const distance = Math.sqrt(
            Math.pow(this.target.x - this.x, 2) + Math.pow(this.target.y - this.y, 2)
        );
        
        return distance < 30; // �ӽ�Ŀ��30����ʱ����
    }
    
    /**
     * ���Ƶ���
     */
    draw(ctx) {
        GameAssets.drawMissile(ctx, this);
    }
}

// ��ʼ����Ϸ
document.addEventListener('DOMContentLoaded', () => {
    const game = new ShootingGame();
});

// ��ֹҳ�����������
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