class FlappyBird {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.score = 0;
        this.scoreElement = document.getElementById('score');
        this.backBtn = document.getElementById('backBtn');

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
            gravity: 0.6,
            jump: -10,
            size: 30,
            frame: 0,
            animationSpeed: 0.1,
            animationTime: 0
        };

        // 管道属性
        this.pipes = [];
        this.pipeWidth = 60;
        this.pipeGap = 150;
        this.pipeSpacing = 200;
        this.minPipeHeight = 50;

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
        
        // 保持16:9的宽高比
        const aspectRatio = 16/9;
        let width = containerWidth;
        let height = containerWidth / aspectRatio;

        if (height > containerHeight) {
            height = containerHeight;
            width = height * aspectRatio;
        }

        this.canvas.width = width;
        this.canvas.height = height;
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
        // 点击/触摸事件
        const jumpHandler = (e) => {
            e.preventDefault();
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

        // 返回按钮
        this.backBtn.addEventListener('click', () => {
            if (confirm('确定要返回主菜单吗？')) {
                window.location.href = '../index.html';
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
            pipe.x -= 3;

            // 检查碰撞
            if (this.checkCollision(pipe)) {
                this.gameOver = true;
                this.sounds.hit.play();
                return;
            }

            // 计分
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.scoreElement.textContent = `得分: ${this.score}`;
                this.sounds.score.play();
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
        const numberWidth = 24; // 数字图片的宽度
        const numberHeight = 36; // 数字图片的高度
        const spacing = 2; // 数字之间的间距

        // 计算总宽度
        scoreWidth = scoreStr.length * (numberWidth + spacing) - spacing;

        // 绘制每个数字
        let xPos = (this.canvas.width - scoreWidth) / 2;
        for (const digit of scoreStr) {
            const numberImg = this.images.numbers[parseInt(digit)];
            this.ctx.drawImage(numberImg, xPos, 50, numberWidth, numberHeight);
            xPos += numberWidth + spacing;
        }

        // 游戏开始提示
        if (!this.gameStarted) {
            this.ctx.drawImage(this.images.message, 
                (this.canvas.width - 184) / 2, 
                (this.canvas.height - 267) / 2, 
                184, 267);
        }

        // 游戏结束提示
        if (this.gameOver) {
            this.ctx.drawImage(this.images.gameOver, 
                (this.canvas.width - 192) / 2, 
                (this.canvas.height - 42) / 2, 
                192, 42);
        }
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
