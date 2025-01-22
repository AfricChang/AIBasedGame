class Game {
    constructor() {
        try {
            console.log('Initializing game...');
            this.canvas = document.getElementById('GameCanvas');
            this.ctx = this.canvas.getContext('2d');
            this.score = 0;
            // 从localStorage读取最高分
            const savedBestScore = localStorage.getItem('watermelon_best_score');
            this.bestScore = savedBestScore ? parseInt(savedBestScore) : 0;
            // 显示最高分
            document.getElementById('bestScore').textContent = this.bestScore;
            this.isGameOver = false;
            this.fruits = [];
            this.nextFruit = null;
            this.isDragging = false;
            this.dropDelay = false;
            this.collisionHandler = null;

            // 初始化音频管理器
            this.audio = new AudioManager();
            
            // 添加音量控制按钮
            this.addVolumeControl();
            
            // 设置画布大小
            this.updateCanvasSize();
            // 监听窗口大小变化
            window.addEventListener('resize', () => this.updateCanvasSize());

            console.log('Initializing physics engine...');
            // 初始化物理引擎
            this.engine = Matter.Engine.create({
                enableSleeping: true,
                constraintIterations: 10,  // 增加约束迭代次数
                positionIterations: 20,   // 增加位置迭代次数
                velocityIterations: 20,   // 增加速度迭代次数
                timing: {
                    timeScale: 0.6,       // 降低时间缩放
                    sleepThreshold: 0.5   // 提高睡眠阈值
                }
            });
            
            // 调整重力以适应屏幕高度
            this.engine.world.gravity.y = Math.max(0.8, Math.min(1.5, this.canvas.height / 400));
            
            // 创建边界
            const wallOptions = {
                isStatic: true,
                friction: 0.8,  // 增加摩擦力
                restitution: 0.1,  // 降低弹性
            };

            // 计算边界位置
            const bottomWallY = this.canvas.height + 2;
            const wallThickness = 60;
            
            this.walls = [
                // 底部边界
                Matter.Bodies.rectangle(
                    this.canvas.width/2,
                    bottomWallY,
                    this.canvas.width * 1.2,
                    wallThickness,
                    wallOptions
                ),
                // 左边界
                Matter.Bodies.rectangle(
                    -wallThickness/2,
                    this.canvas.height/2,
                    wallThickness,
                    this.canvas.height * 2,
                    wallOptions
                ),
                // 右边界
                Matter.Bodies.rectangle(
                    this.canvas.width + wallThickness/2,
                    this.canvas.height/2,
                    wallThickness,
                    this.canvas.height * 2,
                    wallOptions
                )
            ];
            Matter.World.add(this.engine.world, this.walls);

            // 配置水果类型
            this.fruitTypes = [
                { radius: 15, color: '#FFB7C5', density: 0.001, score: 1, name: '樱桃' },     // 樱桃
                { radius: 25, color: '#FF82AB', density: 0.002, score: 2, name: '草莓' },     // 草莓
                { radius: 35, color: '#FF8C00', density: 0.003, score: 3, name: '橘子' },     // 橘子
                { radius: 45, color: '#FFD700', density: 0.004, score: 4, name: '柠檬' },     // 柠檬
                { radius: 55, color: '#FF6A6A', density: 0.005, score: 5, name: '番茄' },     // 番茄
                { radius: 65, color: '#BA55D3', density: 0.006, score: 6, name: '葡萄' },     // 葡萄
                { radius: 75, color: '#FF4500', density: 0.007, score: 7, name: '桃子' },     // 桃子
                { radius: 85, color: '#FF0000', density: 0.008, score: 8, name: '苹果' },     // 苹果
                { radius: 95, color: '#7FFF00', density: 0.009, score: 9, name: '梨' },       // 梨
                { radius: 105, color: '#FF1493', density: 0.01, score: 10, name: '西瓜' }     // 西瓜
            ];

            // 添加碰撞检测
            this.setupCollisionDetection();

            console.log('Starting game loop...');
            // 开始游戏循环
            Matter.Runner.run(this.engine);
            this.draw();
            
            // 初始化事件
            this.initEvents();
            
            // 创建第一个水果
            this.createNextFruit();

            // 隐藏加载文本
            const loadingText = document.getElementById('loadingText');
            if (loadingText) {
                loadingText.style.display = 'none';
            }

            console.log('Game initialized successfully!');
        } catch (error) {
            console.error('Error initializing game:', error);
            const loadingText = document.getElementById('loadingText');
            if (loadingText) {
                loadingText.textContent = '加载失败，请刷新页面重试';
            }
        }
    }

    addVolumeControl() {
        const volumeContainer = document.createElement('div');
        volumeContainer.style.position = 'fixed';
        volumeContainer.style.bottom = '20px';
        volumeContainer.style.right = '20px';
        volumeContainer.style.zIndex = '1000';
        
        const volumeButton = document.createElement('button');
        volumeButton.innerText = this.audio.isMuted ? '🔇' : '🔊';
        volumeButton.style.background = 'rgba(255, 255, 255, 0.8)';
        volumeButton.style.border = 'none';
        volumeButton.style.borderRadius = '50%';
        volumeButton.style.width = '40px';
        volumeButton.style.height = '40px';
        volumeButton.style.cursor = 'pointer';
        volumeButton.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.2)';
        volumeButton.style.transition = 'all 0.3s';
        
        volumeButton.addEventListener('click', () => {
            this.audio.toggleMute();
            volumeButton.innerText = this.audio.isMuted ? '🔇' : '🔊';
        });
        
        volumeContainer.appendChild(volumeButton);
        document.body.appendChild(volumeContainer);
    }

    updateCanvasSize() {
        // 获取画布的实际显示尺寸
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // 如果物理世界已经初始化，更新重力和边界
        if (this.engine && this.engine.world) {
            // 调整重力以适应屏幕高度
            this.engine.world.gravity.y = Math.max(1, Math.min(2, this.canvas.height / 400));
            
            // 更新边界
            if (this.walls) {
                Matter.World.remove(this.engine.world, this.walls);
                const wallOptions = {
                    isStatic: true,
                    friction: 0.3,
                    restitution: 0.2,
                };
                
                // 计算边界位置
                const bottomWallY = this.canvas.height + 2;
                const wallThickness = 60;
                
                this.walls = [
                    // 底部边界
                    Matter.Bodies.rectangle(
                        this.canvas.width/2,
                        bottomWallY,
                        this.canvas.width * 1.2,
                        wallThickness,
                        wallOptions
                    ),
                    // 左边界
                    Matter.Bodies.rectangle(
                        -wallThickness/2,
                        this.canvas.height/2,
                        wallThickness,
                        this.canvas.height * 2,
                        wallOptions
                    ),
                    // 右边界
                    Matter.Bodies.rectangle(
                        this.canvas.width + wallThickness/2,
                        this.canvas.height/2,
                        wallThickness,
                        this.canvas.height * 2,
                        wallOptions
                    )
                ];
                Matter.World.add(this.engine.world, this.walls);
            }
        }
    }

    initEvents() {
        // 触摸/鼠标事件处理
        const handleStart = (e) => {
            e.preventDefault();
            if (this.isGameOver) {
                this.restart();
                return;
            }
            this.isDragging = true;
            this.handlePointerMove(e);
        };

        const handleMove = (e) => {
            e.preventDefault();
            if (this.isDragging) {
                this.handlePointerMove(e);
            }
        };

        const handleEnd = (e) => {
            e.preventDefault();
            if (this.isDragging) {
                this.isDragging = false;
                this.dropFruit();
            }
        };

        // 添加触摸事件监听
        if ('ontouchstart' in window) {
            this.canvas.addEventListener('touchstart', handleStart, { passive: false });
            this.canvas.addEventListener('touchmove', handleMove, { passive: false });
            this.canvas.addEventListener('touchend', handleEnd, { passive: false });
            this.canvas.addEventListener('touchcancel', handleEnd, { passive: false });
        } else {
            // 添加鼠标事件监听
            this.canvas.addEventListener('mousedown', handleStart);
            this.canvas.addEventListener('mousemove', handleMove);
            this.canvas.addEventListener('mouseup', handleEnd);
            this.canvas.addEventListener('mouseleave', handleEnd);
        }
    }

    handlePointerMove(e) {
        if (!this.nextFruit || this.dropDelay) return;

        let x;
        if (e.touches) {
            // 触摸事件
            const touch = e.touches[0];
            const rect = this.canvas.getBoundingClientRect();
            x = (touch.clientX - rect.left) * (this.canvas.width / rect.width);
        } else {
            // 鼠标事件
            const rect = this.canvas.getBoundingClientRect();
            x = (e.clientX - rect.left) * (this.canvas.width / rect.width);
        }

        // 限制水果的移动范围
        const fruit = this.fruitTypes[this.nextFruit.type];
        const maxX = this.canvas.width - fruit.radius;
        const minX = fruit.radius;
        
        this.nextFruit.position.x = Math.min(Math.max(x, minX), maxX);
    }

    setupCollisionDetection() {
        // 移除旧的碰撞处理器
        if (this.collisionHandler) {
            Matter.Events.off(this.engine, 'collisionStart', this.collisionHandler);
        }

        // 创建新的碰撞处理器
        this.collisionHandler = (event) => {
            const pairs = event.pairs;
            const merges = new Set(); // 使用Set来防止重复合并

            for (let i = 0; i < pairs.length; i++) {
                const pair = pairs[i];
                const bodyA = pair.bodyA;
                const bodyB = pair.bodyB;
                
                // 检查是否是新水果与地面的碰撞
                if ((bodyA.isNew || bodyB.isNew) && (bodyA === this.walls[0] || bodyB === this.walls[0])) {
                    const fruit = bodyA.isNew ? bodyA : bodyB;
                    if (fruit.isNew) {
                        fruit.isNew = false;  // 移除新水果标记
                        this.audio.play('drop');  // 播放落地音效
                    }
                }
                
                if (bodyA.label.startsWith('fruit_') && bodyB.label.startsWith('fruit_')) {
                    const typeA = parseInt(bodyA.label.split('_')[1]);
                    const typeB = parseInt(bodyB.label.split('_')[1]);
                    
                    if (typeA === typeB && typeA < this.fruitTypes.length - 1) {
                        // 将碰撞对添加到合并集合中
                        const mergeKey = [bodyA.id, bodyB.id].sort().join(',');
                        if (!merges.has(mergeKey)) {
                            merges.add(mergeKey);
                            // 使用requestAnimationFrame来延迟合并，防止在物理引擎更新时修改物体
                            requestAnimationFrame(() => {
                                if (bodyA.position && bodyB.position) { // 确保物体还存在
                                    this.mergeFruits(bodyA, bodyB, typeA);
                                }
                            });
                        }
                    }
                }
            }
        };

        // 添加新的碰撞处理器
        Matter.Events.on(this.engine, 'collisionStart', this.collisionHandler);
    }

    createNextFruit() {
        const type = Math.floor(Math.random() * 5); // 从前5种水果中随机选择
        this.nextFruit = {
            type: type,
            position: {
                x: this.canvas.width / 2,
                y: this.fruitTypes[type].radius + 20
            }
        };
    }

    dropFruit() {
        if (!this.nextFruit || this.dropDelay) return;

        this.dropDelay = true;
        const currentFruit = this.nextFruit; // 保存当前水果的引用

        // 创建物理实体
        const fruit = this.fruitTypes[currentFruit.type];
        const body = Matter.Bodies.circle(
            currentFruit.position.x,
            currentFruit.position.y,
            fruit.radius,
            {
                density: fruit.density,
                friction: 0.1,
                frictionAir: 0.01,
                restitution: 0.15,
                label: 'fruit_' + currentFruit.type,
                collisionFilter: {
                    group: 0,
                    category: 0x0001,
                    mask: 0xFFFFFFFF
                },
                isNew: true  // 标记为新创建的水果
            }
        );

        // 添加到物理世界
        Matter.World.add(this.engine.world, body);
        this.fruits.push({
            body: body,
            type: currentFruit.type
        });

        // 立即清除nextFruit，这样就不会继续显示预览
        this.nextFruit = null;

        // 延迟创建下一个水果
        setTimeout(() => {
            this.createNextFruit();
            this.dropDelay = false;
        }, 500);
    }

    mergeFruits(bodyA, bodyB, type) {
        // 确保两个物体都还存在于物理世界中
        if (!bodyA.position || !bodyB.position) return;

        // 计算新水果的位置
        const posA = bodyA.position;
        const posB = bodyB.position;
        const newPos = {
            x: (posA.x + posB.x) / 2,
            y: (posA.y + posB.y) / 2
        };

        // 从物理世界和数组中移除旧水果
        Matter.World.remove(this.engine.world, bodyA);
        Matter.World.remove(this.engine.world, bodyB);
        this.fruits = this.fruits.filter(f => f.body !== bodyA && f.body !== bodyB);

        // 创建新水果
        const newType = type + 1;
        const newFruit = this.fruitTypes[newType];

        // 更新分数
        this.score += newFruit.score;
        document.getElementById('score').textContent = this.score;
        
        // 更新最高分
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            document.getElementById('bestScore').textContent = this.bestScore;
            localStorage.setItem('watermelon_best_score', this.bestScore.toString());
        }

        const newBody = Matter.Bodies.circle(
            newPos.x,
            newPos.y,
            newFruit.radius,
            {
                density: newFruit.density,
                friction: 0.05,
                frictionAir: 0.005,
                restitution: 0.2,
                label: 'fruit_' + newType,
                collisionFilter: {
                    group: 0,
                    category: 0x0001,
                    mask: 0xFFFFFFFF
                }
            }
        );

        // 添加新水果到游戏中
        Matter.World.add(this.engine.world, newBody);
        this.fruits.push({
            body: newBody,
            type: newType
        });

        // 播放合并音效
        this.audio.play('merge');

        // 播放合并动画效果
        this.createMergeEffect(newPos.x, newPos.y, newFruit.color);
    }

    createMergeEffect(x, y, color) {
        const particles = [];
        const particleCount = 10;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 5;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color
            });
        }
        
        const animate = () => {
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.2; // 重力
                p.life -= 0.02;
                
                if (p.life > 0) {
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2);
                    this.ctx.fillStyle = p.color + Math.floor(p.life * 255).toString(16).padStart(2, '0');
                    this.ctx.fill();
                }
            });
            
            if (particles.some(p => p.life > 0)) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    restart() {
        // 仅重置游戏状态，不清除已有水果
        this.score = 0;
        this.isGameOver = false;
        this.isDragging = false;
        this.dropDelay = false;

        // 更新分数显示
        document.getElementById('score').textContent = this.score;
        
        // 如果当前没有下一个水果，创建一个
        if (!this.nextFruit) {
            this.createNextFruit();
        }
    }

    checkGameOver() {
        if (this.isGameOver) return;
        
        // 检查是否有水果超出上边界
        for (let fruit of this.fruits) {
            if (fruit.body.position.y < 100) { // 如果有水果位置高于顶部一定距离
                this.isGameOver = true;
                // 播放游戏结束音效
                this.audio.play('gameOver');
                break;
            }
        }
    }

    draw() {
        // 确保canvas上下文存在
        if (!this.ctx) return;

        // 清除画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 绘制所有水果
        this.fruits.forEach(fruit => {
            const type = this.fruitTypes[fruit.type];
            this.ctx.beginPath();
            this.ctx.arc(fruit.body.position.x, fruit.body.position.y, type.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = type.color;
            this.ctx.fill();
            this.ctx.stroke();
        });

        // 绘制下一个水果的预览
        if (this.nextFruit) {
            const type = this.fruitTypes[this.nextFruit.type];
            this.ctx.beginPath();
            this.ctx.arc(this.nextFruit.position.x, this.nextFruit.position.y, type.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = type.color + '80'; // 添加透明度
            this.ctx.fill();
            this.ctx.stroke();
        }

        // 检查游戏结束
        this.checkGameOver();

        // 请求下一帧
        requestAnimationFrame(() => this.draw());
    }
}
