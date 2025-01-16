class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('flappyBirdBestScore')) || 0;
        this.scoreElement = document.getElementById('score');
        this.currentScoreElement = this.scoreElement.querySelector('.current-score');
        this.bestScoreElement = this.scoreElement.querySelector('.best-score');
        this.backBtn = document.getElementById('backBtn');
        this.dialogOverlay = document.getElementById('dialogOverlay');
        this.dialogConfirm = document.getElementById('dialogConfirm');
        this.dialogCancel = document.getElementById('dialogCancel');

        // 初始化显示最高分
        this.updateScoreDisplay();

        // 设置画布大小
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // 加载资源
        this.loadResources();

        // 游戏状态
        this.gameStarted = false;
        this.gameOver = false;

        // 小鸟属性
        this.bird = {
            x: this.canvas.width * 0.2,
            y: this.canvas.height / 2,
            velocity: 0,
            gravity: 0.25,  // 降低重力
            jump: -6,      // 降低跳跃力度
            size: 30,
            frame: 0,
            animationSpeed: 0.1,
            animationTime: 0
        };

        // 管道属性
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 160;     // 增加管道垂直间距
        this.pipeSpacing = 280; // 增加管道水平间距
        this.minPipeHeight = 50;
        this.pipeSpeed = 2;     // 降低管道移动速度

        // 音效
        this.sounds = {
            jump: new Audio('assets/sounds/wing.ogg'),
            score: new Audio('assets/sounds/point.ogg'),
            hit: new Audio('assets/sounds/hit.ogg'),
            die: new Audio('assets/sounds/die.ogg'),
            swoosh: new Audio('assets/sounds/swoosh.ogg')
        };

        // 事件监听
        this.setupEventListeners();

        // 开始游戏循环
        this.lastTime = 0;
        this.animate(0);
    }

    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 设置画布尺寸
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;

        // 根据屏幕大小调整游戏元素比例
        const scale = Math.min(containerWidth / 400, containerHeight / 600);
        
        // 调整游戏元素大小
        this.bird.size = 30 * scale;
        this.pipeWidth = 60 * scale;
        this.pipeGap = 160 * scale;
        this.pipeSpacing = 280 * scale;

        // 重新定位小鸟的X坐标
        this.bird.x = containerWidth * 0.2;

        // 如果是移动设备，调整管道高度范围
        if (window.innerWidth <= 768) {
            this.minPipeHeight = 40 * scale;
        } else {
            this.minPipeHeight = 50 * scale;
        }
    }

    loadResources() {
        // 加载图片
        this.images = {
            bird: {
                yellow: [
                    this.loadImage('assets/images/yellowbird-downflap.png'),
                    this.loadImage('assets/images/yellowbird-midflap.png'),
                    this.loadImage('assets/images/yellowbird-upflap.png')
                ]
            },
            background: this.loadImage('assets/images/background-day.png'),
            pipe: this.loadImage('assets/images/pipe-green.png'),
            base: this.loadImage('assets/images/base.png'),
            gameOver: this.loadImage('assets/images/gameover.png'),
            numbers: Array.from({length: 10}, (_, i) => this.loadImage(`assets/images/${i}.png`)),
            message: this.loadImage('assets/images/message.png')
        };
    }

    loadImage(src) {
        const img = new Image();
        img.src = src;
        return img;
    }

    setupEventListeners() {
        // 返回按钮和对话框逻辑
        this.backBtn.addEventListener('click', () => {
            // 暂停游戏
            this.gameStarted = false;
            // 显示对话框
            this.dialogOverlay.style.display = 'flex';
        });

        // 确认返回
        this.dialogConfirm.addEventListener('click', () => {
            window.location.href = '../index.html';
        });

        // 取消返回
        this.dialogCancel.addEventListener('click', () => {
            // 隐藏对话框
            this.dialogOverlay.style.display = 'none';
            // 如果游戏之前在运行，则继续运行
            if (!this.gameOver) {
                this.gameStarted = true;
            }
        });

        // 点击/触摸事件
        const jumpHandler = (e) => {
            e.preventDefault();
            if (this.gameOver) {
                // 检查点击是否在重新开始按钮区域内
                const buttonX = (this.canvas.width - 200) / 2;
                const buttonY = this.canvas.height / 2 + 60;
                const buttonWidth = 200;
                const buttonHeight = 40;
                
                const rect = this.canvas.getBoundingClientRect();
                const clickX = e.type === 'click' ? e.clientX : e.touches[0].clientX;
                const clickY = e.type === 'click' ? e.clientY : e.touches[0].clientY;
                const x = clickX - rect.left;
                const y = clickY - rect.top;
                
                if (x >= buttonX && x <= buttonX + buttonWidth &&
                    y >= buttonY && y <= buttonY + buttonHeight) {
                    this.resetGame();
                }
                return;
            }
            if (!this.gameStarted) {
                this.gameStarted = true;
            }
            if (!this.gameOver) {
                this.bird.velocity = this.bird.jump;
                this.sounds.jump.currentTime = 0;
                this.sounds.jump.play();
            }
        };

        this.canvas.addEventListener('click', jumpHandler);
        this.canvas.addEventListener('touchstart', jumpHandler);

        // 空格键跳跃
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                jumpHandler(e);
            }
        });
    }

    createPipe() {
        const minHeight = this.minPipeHeight;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const height = Math.random() * (maxHeight - minHeight) + minHeight;

        return {
            x: this.canvas.width,
            height: height,
            scored: false
        };
    }

    update(deltaTime) {
        if (!this.gameStarted) {
            this.bird.y = this.canvas.height / 2 + Math.sin(Date.now() / 300) * 20;
            // 更新小鸟动画
            this.bird.animationTime += deltaTime * this.bird.animationSpeed;
            this.bird.frame = Math.floor(this.bird.animationTime % 3);
            return;
        }

        if (this.gameOver) return;

        // 更新小鸟
        this.bird.velocity += this.bird.gravity;
        this.bird.y += this.bird.velocity;

        // 检查碰撞
        if (this.bird.y + this.bird.size > this.canvas.height || this.bird.y < 0) {
            this.gameOver = true;
            this.sounds.hit.play();
            return;
        }

        // 更新管道
        if (this.pipes.length === 0 || 
            this.canvas.width - this.pipes[this.pipes.length - 1].x >= this.pipeSpacing) {
            this.pipes.push(this.createPipe());
        }

        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed;  // 使用新的管道速度

            // 检查碰撞
            if (this.checkCollision(pipe)) {
                this.gameOver = true;
                this.sounds.hit.play();
                return;
            }

            // 计分
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.scored = true;
                this.updateScore();
            }

            // 移除屏幕外的管道
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }
    }

    checkCollision(pipe) {
        const birdRight = this.bird.x + this.bird.size;
        const birdLeft = this.bird.x;
        const pipeRight = pipe.x + this.pipeWidth;
        const pipeLeft = pipe.x;

        if (birdRight > pipeLeft && birdLeft < pipeRight) {
            if (this.bird.y < pipe.height || 
                this.bird.y + this.bird.size > pipe.height + this.pipeGap) {
                return true;
            }
        }
        return false;
    }

    draw() {
        // 计算缩放比例
        const scale = Math.min(this.canvas.width / 400, this.canvas.height / 600);

        // 绘制背景
        this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);

        // 绘制管道
        for (const pipe of this.pipes) {
            // 上管道
            this.ctx.save();
            this.ctx.scale(1, -1);
            this.ctx.drawImage(this.images.pipe, 
                pipe.x, -pipe.height, 
                this.pipeWidth, pipe.height);
            this.ctx.restore();

            // 下管道
            this.ctx.drawImage(this.images.pipe, 
                pipe.x, pipe.height + this.pipeGap, 
                this.pipeWidth, this.canvas.height - (pipe.height + this.pipeGap));
        }

        // 绘制小鸟
        this.ctx.save();
        this.ctx.translate(this.bird.x + this.bird.size/2, this.bird.y + this.bird.size/2);
        this.ctx.rotate(Math.min(Math.max(this.bird.velocity * 0.05, -0.5), 0.5));
        const currentBirdFrame = this.images.bird.yellow[this.bird.frame];
        this.ctx.drawImage(currentBirdFrame, 
            -this.bird.size/2, -this.bird.size/2, 
            this.bird.size, this.bird.size);
        this.ctx.restore();

        // 绘制分数
        const scoreStr = this.score.toString();
        let scoreWidth = 0;
        const numberWidth = 24 * scale;
        const numberHeight = 36 * scale;
        const spacing = 2 * scale;

        // 计算总宽度
        scoreWidth = scoreStr.length * (numberWidth + spacing) - spacing;

        // 绘制每个数字
        let xPos = (this.canvas.width - scoreWidth) / 2;
        for (const digit of scoreStr) {
            const numberImg = this.images.numbers[parseInt(digit)];
            this.ctx.drawImage(numberImg, xPos, 50 * scale, numberWidth, numberHeight);
            xPos += numberWidth + spacing;
        }

        // 游戏开始提示
        if (!this.gameStarted) {
            const messageWidth = 184 * scale;
            const messageHeight = 267 * scale;
            this.ctx.drawImage(this.images.message, 
                (this.canvas.width - messageWidth) / 2, 
                (this.canvas.height - messageHeight) / 2, 
                messageWidth, messageHeight);
        }

        // 游戏结束界面
        if (this.gameOver) {
            // 绘制游戏结束图片
            const gameOverWidth = 192 * scale;
            const gameOverHeight = 42 * scale;
            this.ctx.drawImage(this.images.gameOver, 
                (this.canvas.width - gameOverWidth) / 2, 
                (this.canvas.height - gameOverHeight) / 2 - 50 * scale, 
                gameOverWidth, gameOverHeight);

            // 绘制分数面板背景
            const panelWidth = 200 * scale;
            const panelHeight = 50 * scale;
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            this.ctx.fillRect(
                (this.canvas.width - panelWidth) / 2,
                this.canvas.height / 2,
                panelWidth,
                panelHeight
            );

            // 绘制分数文本
            this.ctx.fillStyle = '#000';
            this.ctx.font = `${20 * scale}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(
                `得分: ${this.score} | 最高分: ${this.bestScore}`,
                this.canvas.width / 2,
                this.canvas.height / 2 + 30 * scale
            );

            // 绘制重新开始按钮
            const buttonWidth = 200 * scale;
            const buttonHeight = 40 * scale;
            this.ctx.fillStyle = '#4CAF50';
            const buttonX = (this.canvas.width - buttonWidth) / 2;
            const buttonY = this.canvas.height / 2 + 60 * scale;
            this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
            
            this.ctx.fillStyle = '#FFF';
            this.ctx.font = `bold ${20 * scale}px Arial`;
            this.ctx.fillText(
                '重新开始',
                this.canvas.width / 2,
                this.canvas.height / 2 + 85 * scale
            );
        }
    }

    resetGame() {
        // 重置游戏状态
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.updateScoreDisplay();
        
        // 重置小鸟位置和速度
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        
        // 清空管道
        this.pipes = [];
        
        // 播放重新开始音效
        this.sounds.swoosh.currentTime = 0;
        this.sounds.swoosh.play();
    }

    updateScoreDisplay() {
        this.currentScoreElement.textContent = `得分: ${this.score}`;
        this.bestScoreElement.textContent = `最高分: ${this.bestScore}`;
    }

    updateScore() {
        this.score++;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('flappyBirdBestScore', this.bestScore);
            // 播放特殊音效当破纪录时
            this.sounds.swoosh.currentTime = 0;
            this.sounds.swoosh.play();
        }
        this.updateScoreDisplay();
        this.sounds.score.play();
    }

    animate(currentTime) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((time) => this.animate(time));
    }
}

// 启动游戏
window.onload = () => {
    new FlappyBird();
};
