class FlappyBird {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // 游戏状态
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('flappyBirdBestScore')) || 0;

        // 初始化属性（但不设置具体值）
        this.bird = {
            x: 0,
            y: 0,
            velocity: 0,
            gravity: 0.25,
            jump: -6,
            size: 30,
            frame: 0,
            animationSpeed: 0.1,
            animationTime: 0
        };

        // 管道属性
        this.pipes = [];
        this.pipeWidth = 52;
        this.pipeGap = 120;
        this.pipeSpacing = 220;
        this.minPipeHeight = 50;

        // 音效
        this.sounds = {
            jump: new Audio('assets/sounds/wing.ogg'),
            score: new Audio('assets/sounds/point.ogg'),
            hit: new Audio('assets/sounds/hit.ogg'),
            die: new Audio('assets/sounds/die.ogg'),
            swoosh: new Audio('assets/sounds/swoosh.ogg')
        };

        // 加载图片资源
        this.loadResources().then(() => {
            // 资源加载完成后进行初始化
            this.resizeCanvas();
            this.setupEventListeners();
            this.startGameLoop();
        });
    }

    loadResources() {
        return new Promise((resolve) => {
            this.images = {
                bird: {
                    yellow: []
                },
                background: null,
                pipe: null,
                base: null,
                gameOver: null,
                numbers: [],
                message: null
            };

            // 创建要加载的图片列表
            const imagesToLoad = [
                { key: 'background', path: 'assets/images/background-day.png' },
                { key: 'pipe', path: 'assets/images/pipe-green.png' },
                { key: 'base', path: 'assets/images/base.png' },
                { key: 'gameOver', path: 'assets/images/gameover.png' },
                { key: 'message', path: 'assets/images/message.png' }
            ];

            // 添加小鸟动画帧
            const birdFrames = [
                'assets/images/yellowbird-downflap.png',
                'assets/images/yellowbird-midflap.png',
                'assets/images/yellowbird-upflap.png'
            ];

            // 添加数字图片
            const numberImages = Array.from({ length: 10 }, (_, i) => ({
                key: `number_${i}`,
                path: `assets/images/${i}.png`
            }));

            let loadedCount = 0;
            const totalImages = imagesToLoad.length + birdFrames.length + numberImages.length;

            // 加载主要图片
            imagesToLoad.forEach(img => {
                const image = new Image();
                image.onload = () => {
                    this.images[img.key] = image;
                    loadedCount++;
                    checkComplete();
                };
                image.onerror = (e) => {
                    console.error(`Error loading image: ${img.path}`, e);
                    loadedCount++;
                    checkComplete();
                };
                image.src = img.path;
            });

            // 加载小鸟动画帧
            birdFrames.forEach((path, index) => {
                const image = new Image();
                image.onload = () => {
                    this.images.bird.yellow[index] = image;
                    loadedCount++;
                    checkComplete();
                };
                image.onerror = (e) => {
                    console.error(`Error loading bird frame: ${path}`, e);
                    loadedCount++;
                    checkComplete();
                };
                image.src = path;
            });

            // 加载数字图片
            this.images.numbers = [];
            numberImages.forEach((img, index) => {
                const image = new Image();
                image.onload = () => {
                    this.images.numbers[index] = image;
                    loadedCount++;
                    checkComplete();
                };
                image.onerror = (e) => {
                    console.error(`Error loading number: ${img.path}`, e);
                    loadedCount++;
                    checkComplete();
                };
                image.src = img.path;
            });

            const checkComplete = () => {
                console.log(`Loaded ${loadedCount}/${totalImages} images`);
                if (loadedCount === totalImages) {
                    console.log('All images loaded successfully');
                    resolve();
                }
            };
        });
    }

    resizeCanvas() {
        const container = document.getElementById('gameContainer');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // 设置画布尺寸
        this.canvas.width = containerWidth;
        this.canvas.height = containerHeight;

        // 计算缩放比例
        const baseWidth = 400;
        const baseHeight = 600;

        // 移动端使用不同的基准高度
        const isMobile = window.innerWidth <= 768;
        const mobileScale = isMobile ? 0.85 : 1; // 移动端缩小比例

        this.scale = Math.min(
            containerWidth / baseWidth,
            (containerHeight / baseHeight) * mobileScale
        );

        // 调整游戏元素大小
        this.bird.size = Math.round(30 * this.scale);
        this.pipeWidth = Math.round(52 * this.scale);
        this.pipeGap = Math.round(170 * this.scale); // 增加管道垂直间距
        this.pipeSpacing = Math.round(220 * this.scale);
        this.minPipeHeight = Math.round(50 * this.scale);

        // 初始化或更新小鸟位置
        this.bird.x = Math.round(containerWidth * 0.2);
        this.bird.y = containerHeight / 2;

        // 调整管道生成参数
        if (isMobile) {
            this.pipeGap = Math.round(160 * this.scale); // 移动端也保持较大的通道宽度
            this.pipeSpacing = Math.round(200 * this.scale); // 减小管道水平间距
        }
    }

    setupEventListeners() {
        // 处理跳跃事件
        const jumpHandler = (e) => {
            if (e.type === 'keydown' && e.code !== 'Space') {
                return;
            }
            e.preventDefault();

            // 如果游戏结束，不处理跳跃
            if (this.gameOver) {
                return;
            }

            if (!this.gameStarted) {
                this.gameStarted = true;
            }

            // 小鸟跳跃
            this.bird.velocity = this.bird.jump;

            // 播放音效（如果存在）
            if (this.sounds && this.sounds.wing) {
                this.sounds.wing.currentTime = 0;
                this.sounds.wing.play().catch(err => console.log('Error playing sound:', err));
            }
        };

        // 处理重新开始游戏的点击事件
        const restartHandler = (e) => {
            if (!this.gameOver) return;

            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.type === 'click' ? e.clientX : e.touches[0].clientX;
            const clickY = e.type === 'click' ? e.clientY : e.touches[0].clientY;
            const x = clickX - rect.left;
            const y = clickY - rect.top;

            // 计算重新开始按钮的位置和大小
            const buttonWidth = Math.round(200 * this.scale);
            const buttonHeight = Math.round(40 * this.scale);
            const buttonX = Math.round((this.canvas.width - buttonWidth) / 2);
            const buttonY = Math.round(this.canvas.height / 2 + 60 * this.scale);

            // 检查点击是否在按钮区域内
            if (x >= buttonX && x <= buttonX + buttonWidth &&
                y >= buttonY && y <= buttonY + buttonHeight) {
                this.resetGame();
            }
        };

        // 添加跳跃事件监听
        document.addEventListener('keydown', jumpHandler);
        this.canvas.addEventListener('click', (e) => {
            jumpHandler(e);
            restartHandler(e);
        });
        this.canvas.addEventListener('touchstart', (e) => {
            jumpHandler(e);
            restartHandler(e);
        });

        // 返回按钮和对话框
        this.backBtn = document.getElementById('backBtn');
        this.dialogOverlay = document.getElementById('dialogOverlay');
        this.dialogConfirm = document.getElementById('dialogConfirm');
        this.dialogCancel = document.getElementById('dialogCancel');

        this.backBtn.addEventListener('click', () => {
            // 暂停游戏
            this.gameStarted = false;
            // 显示对话框
            this.dialogOverlay.style.display = 'flex';
        });

        this.dialogConfirm.addEventListener('click', () => {
            window.location.href = '../index.html';
        });

        this.dialogCancel.addEventListener('click', () => {
            // 隐藏对话框
            this.dialogOverlay.style.display = 'none';
            // 如果游戏没有结束，继续游戏
            if (!this.gameOver) {
                this.gameStarted = true;
            }
        });
    }

    createPipe() {
        const minHeight = this.minPipeHeight;
        const maxHeight = this.canvas.height - this.pipeGap - minHeight;
        const height = Math.round(Math.random() * (maxHeight - minHeight) + minHeight);

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
            pipe.x -= Math.round(2 * this.scale);  // 使用缩放后的速度

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
        if (!this.ctx || !this.images.background) {
            console.log('Context or images not ready');
            return;
        }

        try {
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
            if (this.images.bird.yellow[this.bird.frame]) {
                this.ctx.save();
                this.ctx.translate(this.bird.x + this.bird.size / 2, this.bird.y + this.bird.size / 2);
                this.ctx.rotate(Math.min(Math.max(this.bird.velocity * 0.05, -0.5), 0.5));
                const currentBirdFrame = this.images.bird.yellow[this.bird.frame];
                this.ctx.drawImage(currentBirdFrame,
                    -this.bird.size / 2, -this.bird.size / 2,
                    this.bird.size, this.bird.size);
                this.ctx.restore();
            }

            // 绘制分数
            if (this.images.numbers.length === 10) {
                const scoreStr = this.score.toString();
                const numberWidth = Math.round(24 * this.scale);
                const numberHeight = Math.round(36 * this.scale);
                const spacing = Math.round(2 * this.scale);
                const totalWidth = scoreStr.length * (numberWidth + spacing) - spacing;
                let xPos = Math.round((this.canvas.width - totalWidth) / 2);

                for (const digit of scoreStr) {
                    const numberImg = this.images.numbers[parseInt(digit)];
                    if (numberImg) {
                        this.ctx.drawImage(numberImg,
                            xPos, Math.round(50 * this.scale),
                            numberWidth, numberHeight);
                        xPos += numberWidth + spacing;
                    }
                }
            }

            // 游戏开始提示
            if (!this.gameStarted && this.images.message) {
                const messageWidth = Math.round(184 * this.scale);
                const messageHeight = Math.round(267 * this.scale);
                this.ctx.drawImage(this.images.message,
                    Math.round((this.canvas.width - messageWidth) / 2),
                    Math.round((this.canvas.height - messageHeight) / 2),
                    messageWidth, messageHeight);
            }

            // 游戏结束界面
            if (this.gameOver && this.images.gameOver) {
                const gameOverWidth = Math.round(192 * this.scale);
                const gameOverHeight = Math.round(42 * this.scale);
                this.ctx.drawImage(this.images.gameOver,
                    Math.round((this.canvas.width - gameOverWidth) / 2),
                    Math.round((this.canvas.height - gameOverHeight) / 2 - 50 * this.scale),
                    gameOverWidth, gameOverHeight);

                // 绘制分数面板和按钮
                this.drawGameOverUI();
            }
        } catch (error) {
            console.error('Error in draw function:', error);
        }
    }

    drawGameOverUI() {
        // 绘制分数面板背景
        const panelWidth = Math.round(200 * this.scale);
        const panelHeight = Math.round(50 * this.scale);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(
            Math.round((this.canvas.width - panelWidth) / 2),
            Math.round(this.canvas.height / 2),
            panelWidth,
            panelHeight
        );

        // 绘制分数文本
        this.ctx.fillStyle = '#000';
        this.ctx.font = `${Math.round(20 * this.scale)}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(
            `得分: ${this.score} | 最高分: ${this.bestScore}`,
            Math.round(this.canvas.width / 2),
            Math.round(this.canvas.height / 2 + 30 * this.scale)
        );

        // 绘制重新开始按钮
        const buttonWidth = Math.round(200 * this.scale);
        const buttonHeight = Math.round(40 * this.scale);
        this.ctx.fillStyle = '#4CAF50';
        const buttonX = Math.round((this.canvas.width - buttonWidth) / 2);
        const buttonY = Math.round(this.canvas.height / 2 + 60 * this.scale);
        this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);

        this.ctx.fillStyle = '#FFF';
        this.ctx.font = `bold ${Math.round(20 * this.scale)}px Arial`;
        this.ctx.fillText(
            '重新开始',
            Math.round(this.canvas.width / 2),
            Math.round(this.canvas.height / 2 + 85 * this.scale)
        );
    }

    resetGame() {
        // 重置游戏状态
        this.gameStarted = false;
        this.gameOver = false;
        this.score = 0;

        // 重置小鸟位置和速度
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.bird.frame = 0;
        this.bird.animationTime = 0;

        // 清空管道
        this.pipes = [];

        // 更新分数显示
        this.updateScoreDisplay();

        // 立即开始新游戏
        this.gameStarted = true;
    }

    updateScoreDisplay() {
        this.currentScoreElement = document.getElementById('score').querySelector('.current-score');
        this.bestScoreElement = document.getElementById('score').querySelector('.best-score');
        this.currentScoreElement.textContent = `得分: ${this.score}`;
        this.bestScoreElement.textContent = `最高分: ${this.bestScore}`;
    }

    updateScore() {
        this.score++;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('flappyBirdBestScore', this.bestScore);
        }
        this.updateScoreDisplay();

        // 播放音效（如果存在）
        if (this.sounds && this.sounds.score) {
            this.sounds.score.currentTime = 0;
            this.sounds.score.play().catch(err => console.log('Error playing sound:', err));
        }
    }

    startGameLoop() {
        this.lastTime = 0;
        this.animate(0);
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
    const canvas = document.getElementById('gameCanvas');
    new FlappyBird(canvas);
};
