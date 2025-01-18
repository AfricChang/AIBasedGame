class AudioManager {
    constructor() {
        this.sounds = {};
        this.currentLoopSound = null;
        this.init();
    }

    init() {
        // 预加载音效
        this.loadSound('fall', 'audio/fall.mp3');
        this.loadSound('scale_intro', 'audio/scale_intro.mp3');
        this.loadSound('scale_loop', 'audio/scale_loop.mp3');
        this.loadSound('success', 'audio/success.mp3');
        this.loadSound('combo1', 'audio/combo1.mp3');
        this.loadSound('combo2', 'audio/combo2.mp3');
        this.loadSound('combo3', 'audio/combo3.mp3');
        this.loadSound('combo4', 'audio/combo4.mp3');
        this.loadSound('combo5', 'audio/combo5.mp3');
        this.loadSound('combo6', 'audio/combo6.mp3');
        this.loadSound('combo7', 'audio/combo7.mp3');
        this.loadSound('combo8', 'audio/combo8.mp3');
    }

    loadSound(name, file) {
        const audio = new Audio(file);
        audio.preload = 'auto';
        this.sounds[name] = audio;

        // 为循环音效添加结束事件
        if (name === 'scale_intro') {
            audio.addEventListener('ended', () => {
                this.playLoop('scale_loop');
            });
        }
    }

    play(name) {
        const sound = this.sounds[name];
        if (sound) {
            // 重置音频并播放
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.log('Audio play failed:', error);
            });
        }
    }

    playLoop(name) {
        const sound = this.sounds[name];
        if (sound) {
            // 停止当前循环音效
            if (this.currentLoopSound) {
                this.currentLoopSound.pause();
                this.currentLoopSound.currentTime = 0;
            }

            // 设置新的循环音效
            sound.loop = true;
            this.currentLoopSound = sound;
            sound.play().catch(error => {
                console.log('Audio loop play failed:', error);
            });
        }
    }

    stopAll() {
        // 停止所有音效
        Object.values(this.sounds).forEach(sound => {
            sound.pause();
            sound.currentTime = 0;
        });
        this.currentLoopSound = null;
    }
}

class JumpGame {
    constructor() {
        this.config = {
            blockSize: 4,
            blockHeight: 2,
            minDistance: 4.5,
            maxDistance: 12,  // 增加最大距离
            jumpForce: 1,    // 增加跳跃力度
            maxHoldTime: 1500,
            cameraHeight: 18,
            cameraAngle: -Math.PI / 4,
            colors: [
                0x67C23A, // 绿色
                0x409EFF, // 蓝色
                0xE6A23C, // 黄色
                0xF56C6C, // 红色
                0x909399  // 灰色
            ]
        };

        this.state = {
            score: 0,
            highScore: parseInt(localStorage.getItem('jumpHighScore')) || 0,
            isHolding: false,
            holdStartTime: 0,
            gameOver: false,
            blocks: [],
            currentBlockIndex: 0,  // 当前所在方块的索引
            jumping: false,
            perfectLanding: false,
            perfectCombo: 0,  // 连续Perfect次数
            baseScore: 2  // Perfect的基础得分
        };

        this.init();
        this.updateScoreDisplay();
        this.setupEvents();
        this.animate();

        // 初始化音频管理器
        this.audioManager = new AudioManager();
    }

    init() {
        // 初始化场景
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x7F7F7F, 20, 40);  // 添加雾效果

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            45,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // 设置相机位置和固定视角
        this.camera.position.set(-12, this.config.cameraHeight, 12);
        this.camera.lookAt(0, 0, 0);
        // 固定相机的x轴旋转（俯视角度）
        this.camera.rotation.x = -Math.PI / 4;
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x7F7F7F);  // 设置背景色为127,127,127
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.querySelector('.game-container').appendChild(this.renderer.domElement);

        // 添加光源
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.near = 0.1;
        directionalLight.shadow.camera.far = 100;
        directionalLight.shadow.camera.left = -20;
        directionalLight.shadow.camera.right = 20;
        directionalLight.shadow.camera.top = 20;
        directionalLight.shadow.camera.bottom = -20;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // 添加地板
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.1;
        this.ground.receiveShadow = true;
        this.scene.add(this.ground);

        // 创建角色
        this.createCharacter();
        
        // 创建初始方块
        this.createInitialBlocks();

        // 添加能量条
        this.addPowerBar();
        
        // 添加窗口大小调整监听
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    createCharacter() {
        // 创建角色组
        this.characterGroup = new THREE.Group();
        
        // 主体
        const bodyGeometry = new THREE.BoxGeometry(0.7, 0.7, 0.7);
        const bodyMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 30
        });
        this.character = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.character.castShadow = true;
        this.character.receiveShadow = true;
        
        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.15, 0.1, 0.3);
        rightEye.position.set(0.15, 0.1, 0.3);
        
        // 添加到角色组
        this.characterGroup.add(this.character);
        this.characterGroup.add(leftEye);
        this.characterGroup.add(rightEye);
        
        // 设置角色在方块上的位置，减小高度偏移
        this.character.position.y = -0.35; // 将角色下移，使其底部贴合方块
        this.characterGroup.position.y = this.config.blockHeight;
        this.scene.add(this.characterGroup);
        
        // 创建角色阴影
        const shadowGeometry = new THREE.CircleGeometry(0.3, 32);
        const shadowMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.2
        });
        this.characterShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.characterShadow.rotation.x = -Math.PI / 2;
        this.characterShadow.position.y = this.config.blockHeight + 0.01;
        this.scene.add(this.characterShadow);
    }

    createBlock(position) {
        const blockGroup = new THREE.Group();
        blockGroup.position.copy(position);

        // 随机选择颜色
        const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];

        // 主体方块
        const geometry = new THREE.BoxGeometry(
            this.config.blockSize,
            this.config.blockHeight,
            this.config.blockSize
        );

        const materials = [
            new THREE.MeshPhongMaterial({ color: color, shininess: 30 }), // right
            new THREE.MeshPhongMaterial({ color: color, shininess: 30 }), // left
            new THREE.MeshPhongMaterial({ color: color * 1.2, shininess: 30 }), // top
            new THREE.MeshPhongMaterial({ color: color * 0.8, shininess: 30 }), // bottom
            new THREE.MeshPhongMaterial({ color: color, shininess: 30 }), // front
            new THREE.MeshPhongMaterial({ color: color, shininess: 30 }), // back
        ];

        const block = new THREE.Mesh(geometry, materials);
        block.castShadow = true;
        block.receiveShadow = true;
        blockGroup.add(block);

        // 添加描边
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ 
                color: 0xffffff,
                transparent: true,
                opacity: 0.5
            })
        );
        blockGroup.add(line);

        // 添加顶部圆形
        const circleGeometry = new THREE.CircleGeometry(0.8, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.2
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = this.config.blockHeight / 2 + 0.01;
        blockGroup.add(circle);

        this.scene.add(blockGroup);
        return blockGroup;
    }

    createInitialBlocks() {
        // 清除现有的方块
        this.state.blocks.forEach(block => {
            this.scene.remove(block);
        });
        this.state.blocks = [];
        
        // 创建起始方块
        const firstBlock = this.createBlock(new THREE.Vector3(0, 0, 0));
        this.state.blocks.push(firstBlock);

        // 创建第二个方块
        const position = this.getNextBlockPosition(firstBlock);
        const secondBlock = this.createBlock(position);
        this.state.blocks.push(secondBlock);
        
        // 重置当前方块索引
        this.state.currentBlockIndex = 0;
    }

    getNextBlockPosition(lastBlock) {
        const distance = this.getRandomDistance();
        // 随机选择方向：X轴或Y轴
        const direction = Math.random() < 0.5 ? 'x' : 'y';
        
        // 计算相机视野范围（基于角色位置）
        const viewRangeX = 15; // 相机视野范围
        const viewRangeZ = 15;
        
        const newPosition = new THREE.Vector3();
        if (direction === 'x') {
            // 确保X方向的新方块不会超出相机视野
            const maxDistance = Math.min(distance, viewRangeX);
            newPosition.set(
                lastBlock.position.x + maxDistance,
                lastBlock.position.y,
                lastBlock.position.z
            );
        } else {
            // 确保Z方向的新方块不会超出相机视野
            const maxDistance = Math.min(distance, viewRangeZ);
            newPosition.set(
                lastBlock.position.x,
                lastBlock.position.y,
                lastBlock.position.z - maxDistance
            );
        }
        
        // 检查是否在可见范围内
        const characterPos = this.characterGroup.position;
        const distanceFromCharacterX = Math.abs(newPosition.x - characterPos.x);
        const distanceFromCharacterZ = Math.abs(newPosition.z - characterPos.z);
        
        // 如果生成的位置超出视野，调整到合适的范围内
        if (distanceFromCharacterX > viewRangeX) {
            newPosition.x = characterPos.x + (newPosition.x > characterPos.x ? viewRangeX : -viewRangeX);
        }
        if (distanceFromCharacterZ > viewRangeZ) {
            newPosition.z = characterPos.z + (newPosition.z > characterPos.z ? viewRangeZ : -viewRangeZ);
        }
        
        return newPosition;
    }

    getRandomDistance() {
        return this.config.minDistance + Math.random() * (this.config.maxDistance - this.config.minDistance);
    }

    addPowerBar() {
        const powerBar = document.createElement('div');
        powerBar.className = 'power-bar';
        const powerBarFill = document.createElement('div');
        powerBarFill.className = 'power-bar-fill';
        powerBar.appendChild(powerBarFill);
        document.querySelector('.game-container').appendChild(powerBar);
        this.powerBar = powerBar;
        this.powerBarFill = powerBarFill;
    }

    setupEvents() {
        // 获取游戏容器
        const container = document.querySelector('.game-container');
        
        // 将事件绑定到游戏容器而不是document
        container.addEventListener('mousedown', (e) => {
            // 如果点击的是返回按钮，不触发蓄力
            if (e.target.classList.contains('back-button')) return;
            this.startJump(e);
        });
        container.addEventListener('mouseup', (e) => {
            // 如果点击的是返回按钮，不触发跳跃
            if (e.target.classList.contains('back-button')) return;
            this.endJump(e);
        });
        container.addEventListener('touchstart', (e) => {
            // 如果点击的是返回按钮，不触发蓄力
            if (e.target.classList.contains('back-button')) return;
            this.startJump(e);
        });
        container.addEventListener('touchend', (e) => {
            // 如果点击的是返回按钮，不触发跳跃
            if (e.target.classList.contains('back-button')) return;
            this.endJump(e);
        });
        
        // 返回按钮事件
        document.querySelector('.back-button').addEventListener('click', (e) => {
            e.stopPropagation();
            showConfirmDialog({
                title: '退出游戏',
                content: '确定要退出游戏返回主菜单吗？',
                confirmText: '确定',
                cancelText: '取消',
                onConfirm: () => {
                    window.location.href = '../index.html';
                }
            });
        });
    }

    startJump(event) {
        event.preventDefault();
        if (!this.state.gameOver && !this.state.jumping) {
            this.state.isHolding = true;
            this.state.holdStartTime = Date.now();
            document.querySelector('.instruction').style.opacity = '0';
            document.querySelector('.power-bar').classList.add('active');
            
            // 播放蓄力开始音效
            this.audioManager.play('scale_intro');
        }
    }

    endJump(event) {
        event.preventDefault();
        if (this.state.isHolding && !this.state.gameOver) {
            const holdTime = Date.now() - this.state.holdStartTime;
            const power = Math.min(holdTime / this.config.maxHoldTime, 1) * this.config.jumpForce;
            
            this.state.isHolding = false;
            document.querySelector('.power-bar').classList.remove('active');
            this.powerBarFill.style.width = '0%';
            
            // 停止蓄力音效
            this.audioManager.stopAll();
            
            // 如果蓄力时间太短，不执行跳跃
            if (holdTime < 100) return;
            
            this.jump(power);
        }
    }

    jump(power) {
        if (this.state.jumping || this.state.gameOver) return;
        
        const currentBlock = this.state.blocks[this.state.currentBlockIndex];
        const nextBlock = this.state.blocks[this.state.currentBlockIndex + 1];
        
        // 计算跳跃方向
        const direction = new THREE.Vector3();
        direction.subVectors(nextBlock.position, currentBlock.position).normalize();
        
        // 计算角色朝向
        const angle = Math.atan2(direction.z, direction.x);
        this.characterGroup.rotation.y = -angle; // 负角度是因为THREE.js的坐标系统
        
        // 计算跳跃力度
        const holdTime = Date.now() - this.state.holdStartTime;
        const normalizedHoldTime = Math.min(holdTime / this.config.maxHoldTime, 1);
        const jumpPower = normalizedHoldTime * this.config.jumpForce;
        
        // 计算跳跃的水平和垂直速度
        const horizontalSpeed = jumpPower * 15;
        const verticalSpeed = jumpPower * 10;
        
        this.state.jumping = true;
        
        // 使用GSAP创建跳跃动画
        const jumpDuration = 0.6;
        
        // 水平移动（同时处理X和Z方向）
        gsap.to(this.characterGroup.position, {
            x: this.characterGroup.position.x + direction.x * horizontalSpeed,
            z: this.characterGroup.position.z + direction.z * horizontalSpeed,
            duration: jumpDuration,
            ease: "none"
        });
        
        // 垂直移动（抛物线效果）
        gsap.to(this.characterGroup.position, {
            y: this.config.blockHeight + verticalSpeed,
            duration: jumpDuration / 2,
            ease: "power1.out",
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                this.checkLanding();
                this.state.jumping = false;
            }
        });
        
        // 添加向前翻转动画
        gsap.to(this.character.rotation, {
            x: Math.PI * 2,
            duration: jumpDuration,
            ease: "linear",
            onComplete: () => {
                this.character.rotation.x = 0;  // 重置旋转
            }
        });
        
        // 更新阴影
        gsap.to(this.characterShadow.material, {
            opacity: 0.2,
            duration: jumpDuration / 2,
            yoyo: true,
            repeat: 1
        });
        
        gsap.to(this.characterShadow.scale, {
            x: 0.5,
            z: 0.5,
            duration: jumpDuration / 2,
            yoyo: true,
            repeat: 1
        });
        
        // 重置能量条
        document.querySelector('.power-bar').classList.remove('active');
        document.querySelector('.power-bar-fill').style.width = '0%';
        document.querySelector('.instruction').style.opacity = '0';
    }

    updateJump() {
        // 不再需要手动更新跳跃，现在使用GSAP处理动画
    }

    update() {
        requestAnimationFrame(() => this.update());
        this.updatePowerBar();
        
        // 更新角色阴影位置
        if (this.characterShadow) {
            this.characterShadow.position.x = this.characterGroup.position.x;
            this.characterShadow.position.z = this.characterGroup.position.z;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    checkLanding() {
        const characterPosition = this.characterGroup.position;
        
        // 检查是否在任何一个方块上
        let landedBlock = null;
        let landedBlockIndex = -1;

        for (let i = 0; i < this.state.blocks.length; i++) {
            const block = this.state.blocks[i];
            
            // 计算方块的左右边界和前后边界
            const blockLeftEdge = block.position.x - this.config.blockSize / 2;
            const blockRightEdge = block.position.x + this.config.blockSize / 2;
            const blockFrontEdge = block.position.z - this.config.blockSize / 2;
            const blockBackEdge = block.position.z + this.config.blockSize / 2;
            
            // 检查角色是否在方块的边界之内
            const onBlockX = characterPosition.x >= blockLeftEdge && 
                           characterPosition.x <= blockRightEdge;
            const onBlockZ = characterPosition.z >= blockFrontEdge && 
                           characterPosition.z <= blockBackEdge;
            
            if (onBlockX && onBlockZ) {
                landedBlock = block;
                landedBlockIndex = i;
                break;
            }
        }

        if (landedBlock) {
            // 成功落在某个方块上
            if (landedBlockIndex > 0) { // 如果不是第一个方块
                this.audioManager.play('success');
                
                // 计算完美落地（到方块中心的距离）
                const distanceToCenter = Math.sqrt(
                    Math.pow(characterPosition.x - landedBlock.position.x, 2) +
                    Math.pow(characterPosition.z - landedBlock.position.z, 2)
                );
                const isPerfectLanding = distanceToCenter < 0.3;

                if (isPerfectLanding) {
                    // 先增加连击次数
                    this.state.perfectCombo++;
                    // 再显示特效和播放音效
                    this.showPerfectEffect();
                    this.state.score += this.state.baseScore * (this.state.perfectCombo + 1);
                } else {
                    this.state.score++;
                    this.state.perfectCombo = 0;
                }
                
                this.updateHighScore();
                this.updateScoreDisplay();
                
                // 更新当前方块索引
                this.state.currentBlockIndex = landedBlockIndex;
                
                // 生成新方块
                const lastBlock = this.state.blocks[this.state.blocks.length - 1];
                const newPosition = this.getNextBlockPosition(lastBlock);
                const newBlock = this.createBlock(newPosition);
                this.state.blocks.push(newBlock);
                
                // 移动相机
                this.adjustCamera();
            }
        } else {
            // 没有落在任何方块上，游戏结束
            this.state.gameOver = true;
            this.audioManager.play('fall');
            
            // 添加掉落和旋转动画
            gsap.to(this.characterGroup.position, {
                y: -5,
                duration: 0.8,
                ease: "power1.in"
            });
            
            gsap.to(this.characterGroup.rotation, {
                z: Math.PI * 2,
                duration: 0.8,
                ease: "power1.in",
                onComplete: () => {
                    this.updateHighScore();
                    this.showGameOver();
                }
            });
            
            // 阴影逐渐消失
            gsap.to(this.characterShadow.material, {
                opacity: 0,
                duration: 0.3,
                ease: "power1.in"
            });
        }
    }

    showPerfectEffect() {
        // 播放对应的combo音效
        const comboNumber = Math.min(this.state.perfectCombo, 8);
        this.audioManager.play(`combo${comboNumber}`);
        
        // 完美落地特效
        const perfectText = document.createElement('div');
        perfectText.className = 'perfect-text';
        
        // 根据连击次数显示不同文本
        if (this.state.perfectCombo > 1) {
            perfectText.textContent = `Perfect x${this.state.perfectCombo}!`;
            perfectText.style.fontSize = `${Math.min(24 + this.state.perfectCombo * 2, 40)}px`;
            perfectText.style.color = this.state.perfectCombo >= 8 ? '#ff0000' : 
                                    this.state.perfectCombo >= 5 ? '#ff4444' :
                                    this.state.perfectCombo >= 3 ? '#ffaa00' : 
                                    '#ffffff';
        } else {
            perfectText.textContent = 'Perfect!';
        }
        
        document.querySelector('.game-container').appendChild(perfectText);
        
        setTimeout(() => {
            perfectText.remove();
        }, 1000);
    }

    showGameOver() {
        const gameOverDialog = document.querySelector('.game-over');
        const finalScore = gameOverDialog.querySelector('.final-score span');
        const finalHighScore = gameOverDialog.querySelector('.final-high-score span');
        
        finalScore.textContent = this.state.score;
        finalHighScore.textContent = this.state.highScore;
        
        gameOverDialog.style.display = 'flex';
        // 强制重绘
        gameOverDialog.offsetHeight;
        gameOverDialog.classList.add('active');
        
        // 绑定重新开始按钮事件
        const restartButton = gameOverDialog.querySelector('.restart-button');
        const menuButton = gameOverDialog.querySelector('.menu-button');
        
        restartButton.onclick = () => {
            gameOverDialog.classList.remove('active');
            setTimeout(() => {
                gameOverDialog.style.display = 'none';
                this.resetGame();
            }, 300);
        };
        
        menuButton.onclick = () => {
            gameOverDialog.classList.remove('active');
            setTimeout(() => {
                gameOverDialog.style.display = 'none';
                // 返回外部主菜单
                window.location.href = '../index.html';
            }, 300);
        };
    }

    resetGame() {
        // 保存最高分
        this.updateHighScore();
        
        // 清除所有现有方块
        while(this.state.blocks.length > 0) {
            const block = this.state.blocks.pop();
            this.scene.remove(block);
        }
        
        // 重置状态
        this.state = {
            score: 0,
            highScore: parseInt(localStorage.getItem('jumpHighScore')) || 0,
            isHolding: false,
            holdStartTime: 0,
            gameOver: false,
            blocks: [],
            currentBlockIndex: 0,
            jumping: false,
            perfectLanding: false,
            perfectCombo: 0,
            baseScore: 2
        };
        
        // 重置角色位置和旋转
        this.characterGroup.position.set(0, this.config.blockHeight, 0);
        this.characterGroup.rotation.set(0, 0, 0);
        
        // 重置角色阴影
        this.characterShadow.position.set(0, this.config.blockHeight + 0.01, 0);
        this.characterShadow.material.opacity = 0.2;
        this.characterShadow.scale.setScalar(1);
        
        // 重置相机位置
        this.camera.position.set(-12, this.config.cameraHeight, 12);
        this.camera.lookAt(0, 0, 0);
        this.camera.rotation.x = -Math.PI / 4;
        
        // 重新初始化方块
        this.createInitialBlocks();
        
        // 停止所有音效
        this.audioManager.stopAll();
        
        // 重置UI
        document.querySelector('.power-bar').classList.remove('active');
        document.querySelector('.power-bar-fill').style.width = '0%';
        document.querySelector('.instruction').style.opacity = '1';
        
        // 更新分数显示
        this.updateScoreDisplay();
        
        // 隐藏游戏结束界面
        const gameOverDialog = document.querySelector('.game-over');
        if (gameOverDialog) {
            gameOverDialog.style.display = 'none';
            gameOverDialog.classList.remove('active');
        }
    }

    updatePowerBar() {
        if (this.state.isHolding) {
            const holdTime = Date.now() - this.state.holdStartTime;
            const power = Math.min(holdTime / this.config.maxHoldTime * 100, 100);
            this.powerBarFill.style.width = power + '%';
        }
    }

    updateHighScore() {
        if (this.state.score > this.state.highScore) {
            this.state.highScore = this.state.score;
            localStorage.setItem('jumpHighScore', this.state.highScore);
            this.updateScoreDisplay();
        }
    }

    updateScoreDisplay() {
        document.querySelector('.score').textContent = '得分: ' + this.state.score;
        document.querySelector('.high-score').textContent = '最高分: ' + this.state.highScore;
    }

    animate() {
        this.update();
    }

    adjustCamera() {
        // 计算相机目标位置，保持与角色的相对位置不变
        const targetX = this.characterGroup.position.x - 12;
        const targetZ = this.characterGroup.position.z + 12;
        
        // 使用GSAP实现平滑平移
        gsap.to(this.camera.position, {
            x: targetX,
            z: targetZ,
            duration: 0.5,
            ease: "power2.out"
        });
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    new JumpGame();
});
