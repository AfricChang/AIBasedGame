class Game {
    constructor() {
        try {
            console.log('Initializing game...');
            this.canvas = document.getElementById('GameCanvas');
            // 优化Canvas上下文设置，关闭透明度以提升性能
            this.ctx = this.canvas.getContext('2d', { 
                alpha: false,
                desynchronized: true,
                willReadFrequently: false
            });
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
            
            // 性能优化：添加离屏Canvas缓存
            this.offscreenCanvas = document.createElement('canvas');
            this.offscreenCtx = this.offscreenCanvas.getContext('2d', { alpha: false });
            
            // 性能优化：预渲染水果纹理
            this.fruitTextures = new Map();
            
            // 性能配置管理
            this.performanceConfig = new PerformanceConfig();
            const config = this.performanceConfig.getConfig();
            
            // 性能优化：帧率控制
            this.lastFrameTime = 0;
            this.targetFPS = config.targetFPS;
            this.frameInterval = 1000 / this.targetFPS;
            
            // 内存管理优化
            this.objectPool = {
                particles: [],
                bodies: []
            };
            
            // 性能监控
            this.performanceStats = {
                frameCount: 0,
                lastStatsTime: 0,
                fps: 0
            };

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
                constraintIterations: config.physicsIterations.constraint,  // 根据性能配置调整
                positionIterations: config.physicsIterations.position,   // 根据性能配置调整
                velocityIterations: config.physicsIterations.velocity,   // 根据性能配置调整
                timing: {
                    timeScale: 1,         // 优化时间缩放
                    isFixed: false,      // 启用动态时间步长
                    sleepThreshold: 0.5   // 提高睡眠阈值
                }
            });
            
            // 启用宽相位碰撞检测优化
            this.engine.broadphase.controller = Matter.Grid.create();
            
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
            
            // 预渲染水果纹理以提升性能
            this.preRenderFruitTextures();

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
        // 优化事件处理，使用防抖和事件委托
        let moveThrottle = false;
        const throttleDelay = 16; // 约60fps
        
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
            if (!moveThrottle) {
                moveThrottle = true;
                setTimeout(() => { moveThrottle = false; }, throttleDelay);
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
        
        // 简化事件监听，统一处理鼠标和触摸事件
        this.canvas.addEventListener('mousedown', handleStart);
        this.canvas.addEventListener('mousemove', handleMove);
        this.canvas.addEventListener('mouseup', handleEnd);
        this.canvas.addEventListener('mouseleave', handleEnd);
        
        this.canvas.addEventListener('touchstart', handleStart, { passive: false });
        this.canvas.addEventListener('touchmove', handleMove, { passive: false });
        this.canvas.addEventListener('touchend', handleEnd, { passive: false });
        this.canvas.addEventListener('touchcancel', handleEnd, { passive: false });
    }

    handlePointerMove(e) {
        if (!this.nextFruit || !this.isDragging) return;

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

        // 优化碰撞检测处理器
        const merges = new Set(); // 用于跟踪已处理的合并
        let mergeQueue = []; // 合并队列，批量处理
        
        this.collisionHandler = (event) => {
            const pairs = event.pairs;
            
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
                
                // 优化：预先检查标签，避免字符串操作
                if (bodyA.label && bodyB.label && 
                    bodyA.label.indexOf('fruit_') === 0 && 
                    bodyB.label.indexOf('fruit_') === 0) {
                    
                    const typeA = bodyA.label.charCodeAt(6) - 48; // 优化：直接从字符码获取数字
                    const typeB = bodyB.label.charCodeAt(6) - 48;
                    
                    if (typeA === typeB && typeA < this.fruitTypes.length - 1) {
                        // 将碰撞对添加到合并集合中
                        const mergeKey = bodyA.id < bodyB.id ? 
                            bodyA.id + ',' + bodyB.id : bodyB.id + ',' + bodyA.id;
                        
                        if (!merges.has(mergeKey)) {
                            merges.add(mergeKey);
                            mergeQueue.push({ bodyA, bodyB, type: typeA });
                        }
                    }
                }
            }
            
            // 批量处理合并，减少requestAnimationFrame调用
            if (mergeQueue.length > 0) {
                requestAnimationFrame(() => {
                    this.processMergeQueue(mergeQueue);
                    mergeQueue = [];
                    merges.clear();
                });
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
            type: currentFruit.type,
            createTime: Date.now()  // 添加创建时间戳
        });

        // 立即创建下一个水果，但保持dropDelay状态
        this.createNextFruit();
        
        // 延迟重置dropDelay，允许下次掉落
        setTimeout(() => {
            this.dropDelay = false;
        }, 200); // 减少延迟时间，提升响应性
        this.isDragging = true;
    }

    // 批量处理合并队列
    processMergeQueue(mergeQueue) {
        const toRemove = [];
        const toAdd = [];
        
        for (const merge of mergeQueue) {
            if (merge.bodyA.position && merge.bodyB.position) {
                const result = this.prepareMerge(merge.bodyA, merge.bodyB, merge.type);
                if (result) {
                    toRemove.push(merge.bodyA, merge.bodyB);
                    toAdd.push(result);
                }
            }
        }
        
        // 批量移除和添加，减少物理世界操作次数
        if (toRemove.length > 0) {
            Matter.World.remove(this.engine.world, toRemove);
            this.fruits = this.fruits.filter(f => !toRemove.includes(f.body));
        }
        
        if (toAdd.length > 0) {
            const newBodies = toAdd.map(item => item.body);
            Matter.World.add(this.engine.world, newBodies);
            this.fruits.push(...toAdd);
        }
    }
    
    prepareMerge(bodyA, bodyB, type) {
        // 计算新水果的位置
        const posA = bodyA.position;
        const posB = bodyB.position;
        const newPos = {
            x: (posA.x + posB.x) / 2,
            y: (posA.y + posB.y) / 2
        };

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

        // 播放合并音效
        this.audio.play('merge');

        // 播放合并动画效果
        this.createOptimizedParticleEffect(newPos.x, newPos.y, newFruit.color);
        
        return {
            body: newBody,
            type: newType,
            createTime: Date.now()  // 添加创建时间戳
        };
    }

    // 优化的粒子效果，减少Canvas状态改变
    createOptimizedParticleEffect(x, y, color) {
        const config = this.performanceConfig.getConfig();
        if (!config.enableParticles) return; // 低性能设备禁用粒子
        
        const particleCount = config.maxParticles;
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 4;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                size: 3
            });
        }
        
        const animate = () => {
            // 批量处理粒子，减少Canvas状态改变
            this.ctx.save();
            this.ctx.fillStyle = color;
            
            let hasAliveParticles = false;
            
            particles.forEach(p => {
                if (p.life > 0) {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vy += 0.15; // 重力
                    p.life -= 0.03;
                    
                    if (p.life > 0) {
                        this.ctx.globalAlpha = p.life;
                        this.ctx.beginPath();
                        this.ctx.arc(Math.round(p.x), Math.round(p.y), p.size * p.life, 0, Math.PI * 2);
                        this.ctx.fill();
                        hasAliveParticles = true;
                    }
                }
            });
            
            this.ctx.restore();
            
            if (hasAliveParticles) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    // 性能监控方法
    updatePerformanceStats(currentTime) {
        this.performanceStats.frameCount++;
        
        if (currentTime - this.performanceStats.lastStatsTime >= 1000) {
            this.performanceStats.fps = this.performanceStats.frameCount;
            this.performanceStats.frameCount = 0;
            this.performanceStats.lastStatsTime = currentTime;
            
            // 动态调整性能设置
            this.performanceConfig.adjustForFPS(this.performanceStats.fps);
            
            // 可选：在控制台显示FPS（调试用）
            if (this.performanceStats.fps < this.targetFPS * 0.8) {
                console.log('Performance warning: FPS =', this.performanceStats.fps);
            }
        }
    }
    
    // 内存清理方法
    cleanupMemory() {
        // 清理睡眠的物体
        const sleepingBodies = this.fruits.filter(fruit => fruit.body.isSleeping);
        if (sleepingBodies.length > 50) { // 如果睡眠物体过多
            // 可以考虑移除一些较小的睡眠水果
        }
        
        // 清理对象池
        if (this.objectPool.particles.length > 100) {
            this.objectPool.particles.length = 50;
        }
    }

    restart() {
        // 清理内存
        this.cleanupMemory();
        
        // 重置游戏状态
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

    /**
     * 检查游戏是否结束
     * 使用相对于画布高度的比例来判断，避免固定像素值导致的误判
     */
    checkGameOver() {
        if (this.isGameOver) return;
        
        // 计算危险线位置（画布高度的15%，最小50像素，最大150像素）
        const dangerLine = Math.max(50, Math.min(150, this.canvas.height * 0.15));
        
        // 检查是否有水果超出危险线
        let fruitsAboveDangerLine = 0;
        for (let fruit of this.fruits) {
            if (fruit.body.position.y < dangerLine) {
                fruitsAboveDangerLine++;
            }
        }
        
        // 只有当有多个水果（至少2个）超出危险线时才判定游戏结束
        // 这样可以避免单个水果短暂超出边界时的误判
        if (fruitsAboveDangerLine >= 2) {
            // 额外检查：确保这些水果不是刚刚掉落的（给1秒缓冲时间）
            let stableFruitsAboveLine = 0;
            const currentTime = Date.now();
            
            for (let fruit of this.fruits) {
                if (fruit.body.position.y < dangerLine) {
                    // 如果水果创建时间超过1秒，认为是稳定的
                    if (!fruit.createTime || (currentTime - fruit.createTime) > 1000) {
                        stableFruitsAboveLine++;
                    }
                }
            }
            
            if (stableFruitsAboveLine >= 2) {
                this.isGameOver = true;
                // 播放游戏结束音效
                this.audio.play('gameOver');
            }
        }
    }

    // 预渲染水果纹理
    preRenderFruitTextures() {
        this.fruitTypes.forEach((fruit, index) => {
            const size = fruit.radius * 2 + 4; // 添加边距
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d', { alpha: true });
            
            // 绘制水果纹理
            ctx.beginPath();
            ctx.arc(size / 2, size / 2, fruit.radius, 0, Math.PI * 2);
            ctx.fillStyle = fruit.color;
            ctx.fill();
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // 添加高光效果
            const gradient = ctx.createRadialGradient(
                size / 2 - fruit.radius * 0.3, size / 2 - fruit.radius * 0.3, 0,
                size / 2, size / 2, fruit.radius
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            ctx.fillStyle = gradient;
            ctx.fill();
            
            this.fruitTextures.set(index, canvas);
        });
    }

    draw(currentTime = 0) {
        // 帧率控制
        if (currentTime - this.lastFrameTime < this.frameInterval) {
            requestAnimationFrame((time) => this.draw(time));
            return;
        }
        this.lastFrameTime = currentTime;
        
        // 性能监控
        this.updatePerformanceStats(currentTime);
        
        // 确保canvas上下文存在
        if (!this.ctx) return;

        // 优化：使用整数坐标避免子像素渲染
        this.ctx.save();
        this.ctx.imageSmoothingEnabled = false;
        
        // 清除画布 - 使用fillRect比clearRect更快
        this.ctx.fillStyle = '#f0f0f0';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 批量绘制水果 - 使用预渲染纹理
        this.fruits.forEach(fruit => {
            const texture = this.fruitTextures.get(fruit.type);
            if (texture) {
                const x = Math.round(fruit.body.position.x - texture.width / 2);
                const y = Math.round(fruit.body.position.y - texture.height / 2);
                this.ctx.drawImage(texture, x, y);
            }
        });

        // 绘制下一个水果的预览
        if (this.nextFruit) {
            const texture = this.fruitTextures.get(this.nextFruit.type);
            if (texture) {
                this.ctx.globalAlpha = 0.5;
                const x = Math.round(this.nextFruit.position.x - texture.width / 2);
                const y = Math.round(this.nextFruit.position.y - texture.height / 2);
                this.ctx.drawImage(texture, x, y);
                this.ctx.globalAlpha = 1.0;
            }
        }
        
        this.ctx.restore();

        // 检查游戏结束
        this.checkGameOver();
        
        // 定期清理内存（每5秒）
        if (currentTime % 5000 < this.frameInterval) {
            this.cleanupMemory();
        }

        // 请求下一帧
        requestAnimationFrame((time) => this.draw(time));
    }
}
