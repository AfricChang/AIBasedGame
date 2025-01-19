class AudioManager {
    constructor() {
        this.sounds = {};
        this.currentLoopSound = null;
        this.initialized = false;
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
                if (this.initialized) {
                    this.playLoop('scale_loop');
                }
            });
        }
    }

    // 初始化音频（在用户第一次交互时调用）
    async initializeAudio() {
        if (this.initialized) return true;
        
        try {
            // 创建一个非常短的静音音频上下文
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            oscillator.connect(audioContext.destination);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.001);
            
            this.initialized = true;
            return true;
        } catch (error) {
            console.log('Audio context initialization failed, will retry on next interaction');
            return false;
        }
    }

    async play(name) {
        if (!this.initialized) {
            await this.initializeAudio();
        }

        const sound = this.sounds[name];
        if (sound && this.initialized) {
            try {
                sound.currentTime = 0;
                await sound.play();
            } catch (error) {
                // 静默失败，因为这可能是由于浏览器策略导致的
                this.initialized = false;
            }
        }
    }

    async playLoop(name) {
        if (!this.initialized) {
            await this.initializeAudio();
        }

        const sound = this.sounds[name];
        if (sound && this.initialized) {
            try {
                // 停止当前循环音效
                if (this.currentLoopSound) {
                    this.currentLoopSound.pause();
                    this.currentLoopSound.currentTime = 0;
                }

                // 设置新的循环音效
                sound.loop = true;
                this.currentLoopSound = sound;
                await sound.play();
            } catch (error) {
                // 静默失败，因为这可能是由于浏览器策略导致的
                this.initialized = false;
            }
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
            maxDistance: 12,
            jumpForce: 1,
            maxHoldTime: 1500,
            cameraHeight: 18,
            cameraAngle: -Math.PI / 4,
            colors: [
                0x67C23A, // 绿色
                0x409EFF, // 蓝色
                0xE6A23C, // 黄色
                0xF56C6C, // 红色
                0x909399  // 灰色
            ],
            perfectRadius: 0.3 // 新增配置：完美落地区域半径
        };

        // 检测是否为移动设备
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 根据设备类型和屏幕尺寸调整参数
        if (this.isMobile) {
            // 移动设备上调整相机参数
            this.config.cameraDistance = 18; // 增加相机距离
            this.config.cameraHeight = 20; // 增加相机高度
            this.config.cameraAngle = -Math.PI / 3.8; // 调整俯视角度
            this.config.maxDistance = 10; // 减小最大距离
        } else {
            // PC设备保持原有参数
            this.config.cameraDistance = 15;
            this.config.cameraHeight = 18;
            this.config.cameraAngle = -Math.PI / 4;
            this.config.maxDistance = 12;
        }

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

        this.init();
        this.updateScoreDisplay();
        this.setupEvents();
        this.animate();

        this.audioManager = new AudioManager();
    }

    init() {
        // 初始化场景
        this.scene = new THREE.Scene();
        // 移除雾效果
        // this.scene.fog = new THREE.Fog(0x7F7F7F, 20, 40);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            this.isMobile ? 50 : 45, // 移动端增加视野角度
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // 根据设备类型设置相机位置
        this.camera.position.set(
            -this.config.cameraDistance,
            this.config.cameraHeight,
            this.config.cameraDistance
        );
        this.camera.lookAt(0, 0, 0);
        this.camera.rotation.x = this.config.cameraAngle;
        
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

        // 使用点光源替代平行光
        this.pointLight = new THREE.PointLight(0xffffff, 1, 100);
        this.pointLight.position.set(0, 20, 0);
        this.pointLight.castShadow = true;
        this.pointLight.shadow.mapSize.width = 2048;
        this.pointLight.shadow.mapSize.height = 2048;
        this.pointLight.shadow.camera.near = 0.1;
        this.pointLight.shadow.camera.far = 100;
        this.scene.add(this.pointLight);

        // 添加地板
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.ShadowMaterial({ 
            opacity: 0.3,
            depthWrite: false
        });
        this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
        this.ground.rotation.x = -Math.PI / 2;
        this.ground.position.y = -0.1;
        this.ground.receiveShadow = true;
        this.ground.renderOrder = 0; // 确保地板在最底层渲染
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
            transparent: false,
            opacity: 1,
            shininess: 30
        });
        this.character = new THREE.Mesh(bodyGeometry, bodyMaterial);
        this.character.castShadow = true;
        this.character.receiveShadow = true;
        
        // 眼睛
        const eyeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const eyeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xffffff,
            transparent: false,
            opacity: 1
        });
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
            opacity: 0.3,
            depthWrite: false
        });
        this.characterShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
        this.characterShadow.rotation.x = -Math.PI / 2;
        this.characterShadow.position.y = this.config.blockHeight + 0.01;
        this.characterShadow.renderOrder = 1; // 确保阴影在其他物体之后渲染
        this.scene.add(this.characterShadow);
    }

    createBlock(position) {
        const blockGroup = new THREE.Group();
        blockGroup.position.copy(position);

        // 随机选择颜色
        const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];

        // 随机生成宽度和深度，保留一位小数
        const blockSizeX = parseFloat((2 + Math.random() * (4 - 2)).toFixed(1));

        // 主体方块
        const geometry = new THREE.BoxGeometry(
            blockSizeX,
            this.config.blockHeight,
            blockSizeX
        );

        const materials = [
            new THREE.MeshPhongMaterial({ color: color, transparent: false, opacity: 1, shininess: 30 }), // right
            new THREE.MeshPhongMaterial({ color: color, transparent: false, opacity: 1, shininess: 30 }), // left
            new THREE.MeshPhongMaterial({ color: color * 1.2, transparent: false, opacity: 1, shininess: 30 }), // top
            new THREE.MeshPhongMaterial({ color: color * 0.8, transparent: false, opacity: 1, shininess: 30 }), // bottom
            new THREE.MeshPhongMaterial({ color: color, transparent: false, opacity: 1, shininess: 30 }), // front
            new THREE.MeshPhongMaterial({ color: color, transparent: false, opacity: 1, shininess: 30 }), // back
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
                transparent: false,
                opacity: 1
            })
        );
        blockGroup.add(line);

        // 添加顶部圆形, 半径改为 this.config.perfectRadius
        const circleGeometry = new THREE.CircleGeometry(this.config.perfectRadius, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = this.config.blockHeight / 2 + 0.01;
        circle.renderOrder = 2; // 确保圆形在最上层渲染
        blockGroup.add(circle);

        this.scene.add(blockGroup);
        return blockGroup;
    }

    createCylinderBlock(position) {
        const blockGroup = new THREE.Group();
        blockGroup.position.copy(position);

        // 随机选择颜色
        const color = this.config.colors[Math.floor(Math.random() * this.config.colors.length)];

        // 随机生成半径，保留一位小数
        const radius = parseFloat((1 + Math.random() * (2 - 1)).toFixed(1));

        // 主体圆柱
        const geometry = new THREE.CylinderGeometry(
            radius, // 顶部半径
            radius, // 底部半径
            this.config.blockHeight, // 高度
            32 // 圆周分段数
        );

        const materials = [
            new THREE.MeshPhongMaterial({ color: color, transparent: false, opacity: 1, shininess: 30 }), // 侧面
            new THREE.MeshPhongMaterial({ color: color * 1.2, transparent: false, opacity: 1, shininess: 30 }), // 顶部
            new THREE.MeshPhongMaterial({ color: color * 0.8, transparent: false, opacity: 1, shininess: 30 }) // 底部
        ];

        const cylinder = new THREE.Mesh(geometry, materials);
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        blockGroup.add(cylinder);

        // 添加顶部圆形
        const circleGeometry = new THREE.CircleGeometry(radius, 32);
        const circleMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.3,
            depthWrite: false
        });
        const circle = new THREE.Mesh(circleGeometry, circleMaterial);
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = this.config.blockHeight / 2 + 0.01;
        circle.renderOrder = 2; // 确保圆形在最上层渲染
        blockGroup.add(circle);

        // 添加完美落地区域小圆
        const perfectCircleGeometry = new THREE.CircleGeometry(this.config.perfectRadius, 32);
        const perfectCircleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6, // 稍微提高不透明度，使其更明显
            depthWrite: false
        });
        const perfectCircle = new THREE.Mesh(perfectCircleGeometry, perfectCircleMaterial);
        perfectCircle.rotation.x = -Math.PI / 2;
        perfectCircle.position.y = this.config.blockHeight / 2 + 0.02; // 稍微高于大圆，避免 Z-fighting
        perfectCircle.renderOrder = 3; // 确保小圆在大圆之上渲染
        blockGroup.add(perfectCircle);

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

        // 创建第二个方块，生成圆柱的概率为 80%
        const position = this.getNextBlockPosition(firstBlock);
        const secondBlock = Math.random() < 0.8 ? this.createCylinderBlock(position) : this.createBlock(position);
        this.state.blocks.push(secondBlock);
        
        // 重置当前方块索引
        this.state.currentBlockIndex = 0;
    }

    getNextBlockPosition(lastBlock) {
        const distance = this.getRandomDistance();
        // 移动端进一步降低X轴生成概率
        const direction = Math.random() < (this.isMobile ? 0.2 : 0.3) ? 'x' : 'y';
        
        // 根据设备类型调整视野范围
        const viewRangeX = this.isMobile ? 12 : 15;
        const viewRangeZ = 15;
        
        const newPosition = new THREE.Vector3();
        if (direction === 'x') {
            // 移动端留出更多余量
            const margin = this.isMobile ? 6 : 4;
            const maxDistance = Math.min(distance, viewRangeX - margin);
            newPosition.set(
                lastBlock.position.x + maxDistance,
                lastBlock.position.y,
                lastBlock.position.z
            );
        } else {
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
        
        // 移动端留出更多余量
        const margin = this.isMobile ? 6 : 4;
        if (distanceFromCharacterX > viewRangeX - margin) {
            newPosition.x = characterPos.x + (newPosition.x > characterPos.x ? viewRangeX - margin : -(viewRangeX - margin));
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
        
        // 鼠标事件
        container.addEventListener('mousedown', (e) => {
            // 如果点击的是按钮，不触发蓄力
            if (e.target.tagName === 'BUTTON' || 
                e.target.closest('.game-over-content') ||
                e.target.closest('.header')) {
                return;
            }
            this.startJump(e);
        });
        
        container.addEventListener('mouseup', (e) => {
            // 如果点击的是按钮，不触发跳跃
            if (e.target.tagName === 'BUTTON' || 
                e.target.closest('.game-over-content') ||
                e.target.closest('.header')) {
                return;
            }
            this.endJump(e);
        });
        
        // 触摸事件
        container.addEventListener('touchstart', (e) => {
            // 如果点击的是按钮，不触发蓄力
            if (e.target.tagName === 'BUTTON' || 
                e.target.closest('.game-over-content') ||
                e.target.closest('.header')) {
                return;
            }
            e.preventDefault(); // 阻止默认行为
            this.startJump(e);
        });
        
        container.addEventListener('touchend', (e) => {
            // 如果点击的是按钮，不触发跳跃
            if (e.target.tagName === 'BUTTON' || 
                e.target.closest('.game-over-content') ||
                e.target.closest('.header')) {
                return;
            }
            e.preventDefault(); // 阻止默认行为
            this.endJump(e);
        });
        
        // 返回按钮事件
        const backButton = document.querySelector('.back-button');
        const newBackButton = backButton.cloneNode(true);
        backButton.parentNode.replaceChild(newBackButton, backButton);
        
        newBackButton.addEventListener('click', (e) => {
            e.preventDefault();
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
            // 初始化音频（在用户第一次交互时）
            this.audioManager.initializeAudio();
            
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
        
        // 计算角色底部中心点的位置
        const characterBottomCenter = this.characterGroup.position.clone();
        characterBottomCenter.y -= this.character.geometry.parameters.height / 2; // 减去角色高度的一半
        
        // 计算下一个方块的中心点位置
        const nextBlockCenter = nextBlock.position.clone();
        nextBlockCenter.y += nextBlock.children[0].geometry.parameters.height / 2; // 加上方块高度的一半
        
        // 计算跳跃方向，从角色底部中心点指向下一个方块的中心点
        const direction = new THREE.Vector3();
        direction.subVectors(nextBlockCenter, characterBottomCenter).normalize();
        
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
        
        // 更新点光源位置，让它跟随角色但稍微偏移
        if (this.pointLight && this.characterGroup) {
            this.pointLight.position.x = this.characterGroup.position.x + 5;
            this.pointLight.position.z = this.characterGroup.position.z + 5;
            this.pointLight.position.y = 20;
        }
        
        // 更新角色阴影位置
        if (this.characterShadow) {
            this.characterShadow.position.x = this.characterGroup.position.x;
            this.characterShadow.position.z = this.characterGroup.position.z;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    checkLanding() {
        const characterPosition = this.characterGroup.position;
        let landedBlock = null;
        let landedBlockIndex = -1;

        for (let i = 0; i < this.state.blocks.length; i++) {
            const block = this.state.blocks[i];
            const blockType = block.children[0].geometry.type;

            if (blockType === 'BoxGeometry') {
                // 方块的碰撞检测
                const halfWidth = block.children[0].geometry.parameters.width / 2;
                const halfDepth = block.children[0].geometry.parameters.depth / 2;
                const dx = Math.abs(characterPosition.x - block.position.x);
                const dz = Math.abs(characterPosition.z - block.position.z);

                if (dx <= halfWidth && dz <= halfDepth) {
                    landedBlock = block;
                    landedBlockIndex = i;
                    break;
                }
            } else if (blockType === 'CylinderGeometry') {
                // 圆柱的碰撞检测
                const radius = block.children[0].geometry.parameters.radiusTop;
                const dx = characterPosition.x - block.position.x;
                const dz = characterPosition.z - block.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);

                if (distance <= radius) {
                    landedBlock = block;
                    landedBlockIndex = i;
                    break;
                }
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
                const newBlock = this.generateNextBlock(newPosition);
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
        
        // 移除之前的事件监听器
        const newRestartButton = restartButton.cloneNode(true);
        const newMenuButton = menuButton.cloneNode(true);
        restartButton.parentNode.replaceChild(newRestartButton, restartButton);
        menuButton.parentNode.replaceChild(newMenuButton, menuButton);
        
        // 添加新的事件监听器
        newRestartButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            gameOverDialog.classList.remove('active');
            setTimeout(() => {
                gameOverDialog.style.display = 'none';
                this.resetGame();
            }, 300);
        });
        
        newMenuButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            gameOverDialog.classList.remove('active');
            setTimeout(() => {
                gameOverDialog.style.display = 'none';
                window.location.href = '../index.html';
            }, 300);
        });
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
        this.camera.position.set(
            -this.config.cameraDistance,
            this.config.cameraHeight,
            this.config.cameraDistance
        );
        this.camera.lookAt(0, 0, 0);
        this.camera.rotation.x = this.config.cameraAngle;
        
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
        const targetX = this.characterGroup.position.x - this.config.cameraDistance;
        const targetZ = this.characterGroup.position.z + this.config.cameraDistance;
        
        // 使用GSAP实现平滑平移
        gsap.to(this.camera.position, {
            x: targetX,
            z: targetZ,
            duration: 0.5,
            ease: "power2.out"
        });
    }

    generateNextBlock(position) {
        var d = Math.random() ;
        // 生成后续方块，生成圆柱的概率为 60%
        const nextBlock = d < 0.6 ? this.createCylinderBlock(position) : this.createBlock(position);
        return nextBlock ;
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    new JumpGame();
});
