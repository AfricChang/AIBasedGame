/**
 * 动物消消消游戏 - 主要游戏逻辑
 * 包含格子地图系统、动物方向判定与移动规则、连击机制、动画表现与道具触发逻辑
 */

class AnimalReleaseGame {
    constructor() {
        this.boardSize = 8; // 默认8x8网格
        this.board = [];
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.level = 1;
        this.targetAnimals = 10; // 每关需要释放的动物数量
        this.releasedAnimals = 0;
        this.isAnimating = false;
        
        // 道具数量
        this.tools = {
            shuffle: 3,
            flip: 3,
            hint: 5
        };
        
        // 动物类型和方向
        this.animalTypes = ['🐰', '🐱', '🐶', '🐼', '🐸', '🐷', '🐻', '🦊'];
        this.directions = ['up', 'down', 'left', 'right'];
        this.directionSymbols = {
            up: '↑',
            down: '↓',
            left: '←',
            right: '→'
        };
        
        // 初始化音效和粒子系统
        this.audioManager = null;
        this.particleSystem = null;
        
        this.init();
    }
    
    /**
     * 初始化游戏
     */
    init() {
        this.initAudioAndParticles();
        this.createBoard();
        this.generateAnimals();
        this.bindEvents();
        this.updateUI();
        this.adjustBoardSize();
        
        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this.adjustBoardSize();
        });
        
        // 监听设备方向变化
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.adjustBoardSize();
            }, 100);
        });
    }
    
    /**
     * 初始化音效和粒子系统
     */
    initAudioAndParticles() {
        // 初始化音效管理器
        if (typeof AudioManager !== 'undefined') {
            this.audioManager = new AudioManager();
        }
        
        // 初始化粒子系统
        const particleCanvas = document.getElementById('particleCanvas');
        if (particleCanvas && typeof ParticleSystem !== 'undefined') {
            this.particleSystem = new ParticleSystem(particleCanvas);
        }
    }
    
    /**
     * 根据屏幕大小调整游戏板尺寸
     */
    adjustBoardSize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const minDimension = Math.min(width, height);
        
        let newBoardSize;
        if (minDimension <= 480) {
            newBoardSize = 5;
        } else if (minDimension <= 768) {
            newBoardSize = 6;
        } else {
            newBoardSize = 8;
        }
        
        // 只有当尺寸真正改变时才重新创建游戏板
        if (newBoardSize !== this.boardSize) {
            this.boardSize = newBoardSize;
            this.createBoard();
            this.generateAnimals();
            this.updateUI();
        }
        
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.style.gridTemplateColumns = `repeat(${this.boardSize}, 1fr)`;
        gameBoard.style.gridTemplateRows = `repeat(${this.boardSize}, 1fr)`;
    }
    
    /**
     * 创建游戏板
     */
    createBoard() {
        const gameBoard = document.getElementById('gameBoard');
        gameBoard.innerHTML = '';
        
        this.board = [];
        for (let row = 0; row < this.boardSize; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.boardSize; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                gameBoard.appendChild(cell);
                
                this.board[row][col] = {
                    element: cell,
                    animal: null,
                    direction: null
                };
            }
        }
    }
    
    /**
     * 生成随机动物
     */
    generateAnimals() {
        // 清空现有动物
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                this.board[row][col].animal = null;
                this.board[row][col].direction = null;
                this.board[row][col].element.innerHTML = '';
                this.board[row][col].element.className = 'cell';
            }
        }
        
        // 根据关卡调整动物密度
        const animalCount = Math.min(this.boardSize * this.boardSize * 0.6 + this.level * 2, this.boardSize * this.boardSize * 0.8);
        
        for (let i = 0; i < animalCount; i++) {
            let row, col;
            do {
                row = Math.floor(Math.random() * this.boardSize);
                col = Math.floor(Math.random() * this.boardSize);
            } while (this.board[row][col].animal !== null);
            
            const animal = this.animalTypes[Math.floor(Math.random() * this.animalTypes.length)];
            const direction = this.directions[Math.floor(Math.random() * this.directions.length)];
            
            this.placeAnimal(row, col, animal, direction);
        }
    }
    
    /**
     * 在指定位置放置动物
     */
    placeAnimal(row, col, animal, direction) {
        const cell = this.board[row][col];
        cell.animal = animal;
        cell.direction = direction;
        
        const animalElement = document.createElement('div');
        animalElement.className = 'animal';
        animalElement.textContent = animal;
        
        const arrowElement = document.createElement('div');
        arrowElement.className = `direction-arrow ${direction}`;
        arrowElement.textContent = this.directionSymbols[direction];
        
        cell.element.innerHTML = '';
        cell.element.appendChild(animalElement);
        cell.element.appendChild(arrowElement);
        cell.element.className = 'cell';
    }
    
    /**
     * 处理格子点击事件
     */
    async handleCellClick(row, col) {
        if (this.isAnimating) return;
        
        const cell = this.board[row][col];
        if (!cell.animal) return;
        
        // 播放点击音效
        if (this.audioManager) {
            this.audioManager.play('click');
        }
        
        this.isAnimating = true;
        
        // 计算移动路径和结果
        const moveResult = this.calculateMoveResult(row, col, cell.direction);
        
        // 如果路径为空且不能释放，说明动物被完全阻挡，无法移动
        if (moveResult.path.length === 0 && !moveResult.canRelease) {
            // 动物无法移动，显示一个简短的提示动画
            const animalElement = cell.element.querySelector('.animal');
            if (animalElement) {
                animalElement.classList.add('shake-effect');
                setTimeout(() => {
                    animalElement.classList.remove('shake-effect');
                }, 500);
            }
        } else if (moveResult.canRelease) {
            // 可以直接释放
            this.highlightPath(moveResult.path);
            // 等待路径高亮显示完成后直接释放
            await new Promise(resolve => setTimeout(resolve, 300));
            await this.releaseAnimal(row, col);
            this.updateScore(moveResult.path.length);
        } else {
            // 需要移动到阻挡物旁边
            this.highlightPath(moveResult.path);
            // 等待路径高亮显示完成后直接移动到最终位置
            await new Promise(resolve => setTimeout(resolve, 300));
            await this.moveAnimalToPosition(row, col, moveResult.finalPosition);
        }
        
        // 检查游戏状态
        this.checkGameState();
        
        this.isAnimating = false;
    }
    
    /**
     * 计算动物移动结果（路径和是否可以释放）
     */
    calculateMoveResult(startRow, startCol, direction) {
        const path = [];
        let currentRow = startRow;
        let currentCol = startCol;
        let canRelease = true;
        let finalPosition = null;
        
        const directions = {
            up: [-1, 0],
            down: [1, 0],
            left: [0, -1],
            right: [0, 1]
        };
        
        const [deltaRow, deltaCol] = directions[direction];
        
        // 首先检查第一步是否就有阻挡
        const firstNextRow = startRow + deltaRow;
        const firstNextCol = startCol + deltaCol;
        
        // 如果第一步就出界，说明动物在边界上朝向边界外，应该可以被释放
        if (firstNextRow < 0 || firstNextRow >= this.boardSize || 
            firstNextCol < 0 || firstNextCol >= this.boardSize) {
            return {
                path: [],
                canRelease: true,
                finalPosition: null // 动物将被释放
            };
        }
        
        // 如果第一步遇到其他动物，则不能移动也不能释放
        if (this.board[firstNextRow][firstNextCol].animal !== null) {
            return {
                path: [],
                canRelease: false,
                finalPosition: [startRow, startCol] // 保持原位置
            };
        }
        
        while (true) {
            const nextRow = currentRow + deltaRow;
            const nextCol = currentCol + deltaCol;
            
            // 检查边界
            if (nextRow < 0 || nextRow >= this.boardSize || 
                nextCol < 0 || nextCol >= this.boardSize) {
                // 到达边界，动物可以被释放
                canRelease = true;
                break;
            }
            
            // 检查是否有其他动物阻挡
            if (this.board[nextRow][nextCol].animal !== null) {
                // 遇到阻挡，不能释放，需要移动到当前位置
                canRelease = false;
                finalPosition = [currentRow, currentCol];
                break;
            }
            
            path.push([nextRow, nextCol]);
            currentRow = nextRow;
            currentCol = nextCol;
        }
        
        return {
            path: path,
            canRelease: canRelease,
            finalPosition: finalPosition
        };
    }
    
    /**
     * 计算动物移动路径（保持向后兼容）
     */
    calculatePath(startRow, startCol, direction) {
        return this.calculateMoveResult(startRow, startCol, direction).path;
    }
    
    /**
     * 高亮显示移动路径
     */
    highlightPath(path) {
        // 清除之前的高亮
        document.querySelectorAll('.cell.path').forEach(cell => {
            cell.classList.remove('path');
        });
        
        // 高亮新路径
        path.forEach(([row, col]) => {
            this.board[row][col].element.classList.add('path');
        });
        
        // 延迟清除高亮
        setTimeout(() => {
            path.forEach(([row, col]) => {
                this.board[row][col].element.classList.remove('path');
            });
        }, 1000);
    }
    
    /**
     * 动画移动动物
     */
    async animateAnimalMovement(row, col, path) {
        const animalElement = this.board[row][col].element.querySelector('.animal');
        if (!animalElement || path.length === 0) return;
        
        const cellSize = this.board[0][0].element.offsetWidth;
        const gap = 2; // CSS中定义的gap
        
        // 获取起始位置
        const startCell = this.board[row][col].element;
        const startRect = startCell.getBoundingClientRect();
        
        // 创建移动的动物副本
         const movingAnimal = animalElement.cloneNode(true);
         movingAnimal.className = 'animal';
         movingAnimal.style.position = 'fixed';
         movingAnimal.style.left = startRect.left + 'px';
         movingAnimal.style.top = startRect.top + 'px';
         movingAnimal.style.width = cellSize + 'px';
         movingAnimal.style.height = cellSize + 'px';
         movingAnimal.style.zIndex = '1000';
         movingAnimal.style.transition = 'all 0.3s ease-in-out';
         movingAnimal.style.pointerEvents = 'none';
         movingAnimal.style.borderRadius = '8px';
         movingAnimal.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
         movingAnimal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
        
        // 隐藏原始动物
        animalElement.style.opacity = '0';
        
        // 添加到页面
        document.body.appendChild(movingAnimal);
        
        // 沿路径移动
        for (let i = 0; i < path.length; i++) {
            const [targetRow, targetCol] = path[i];
            const targetCell = this.board[targetRow][targetCol].element;
            const targetRect = targetCell.getBoundingClientRect();
            
            await new Promise(resolve => {
                setTimeout(() => {
                    movingAnimal.style.left = targetRect.left + 'px';
                    movingAnimal.style.top = targetRect.top + 'px';
                    setTimeout(resolve, 300);
                }, 50);
            });
        }
        
        // 清理
        return new Promise(resolve => {
            setTimeout(() => {
                document.body.removeChild(movingAnimal);
                animalElement.style.opacity = '1';
                resolve();
            }, 100);
        });
    }
    
    /**
     * 释放动物
     */
    async releaseAnimal(row, col) {
        const cell = this.board[row][col];
        const animalElement = cell.element.querySelector('.animal');
        
        if (animalElement) {
            // 播放释放音效
            if (this.audioManager) {
                this.audioManager.play('release');
            }
            
            // 创建爆炸粒子效果
            if (this.particleSystem) {
                const rect = cell.element.getBoundingClientRect();
                const gameBoard = document.getElementById('gameBoard');
                const boardRect = gameBoard.getBoundingClientRect();
                const x = rect.left + rect.width / 2 - boardRect.left;
                const y = rect.top + rect.height / 2 - boardRect.top;
                this.particleSystem.createExplosion(x, y, 12, { color: '#FFD700' });
            }
            
            animalElement.classList.add('releasing');
            
            return new Promise(resolve => {
                setTimeout(() => {
                    cell.animal = null;
                    cell.direction = null;
                    cell.element.innerHTML = '';
                    cell.element.className = 'cell empty';
                    
                    this.releasedAnimals++;
                    this.combo++;
                    
                    resolve();
                }, 600);
            });
        }
    }
    
    /**
     * 移动动物到指定位置
     */
    async moveAnimalToPosition(fromRow, fromCol, toPosition) {
        if (!toPosition) return;
        
        const [toRow, toCol] = toPosition;
        const fromCell = this.board[fromRow][fromCol];
        const toCell = this.board[toRow][toCol];
        
        // 获取动物信息
        const animal = fromCell.animal;
        const direction = fromCell.direction;
        
        // 创建移动动画
        const animalElement = fromCell.element.querySelector('.animal');
        if (animalElement) {
            const fromRect = fromCell.element.getBoundingClientRect();
            const toRect = toCell.element.getBoundingClientRect();
            
            // 创建移动的动物副本
             const movingAnimal = animalElement.cloneNode(true);
             movingAnimal.className = 'animal';
             movingAnimal.style.position = 'fixed';
             movingAnimal.style.left = fromRect.left + 'px';
             movingAnimal.style.top = fromRect.top + 'px';
             movingAnimal.style.width = fromRect.width + 'px';
             movingAnimal.style.height = fromRect.height + 'px';
             movingAnimal.style.zIndex = '1000';
             movingAnimal.style.transition = 'all 0.4s ease-out';
             movingAnimal.style.pointerEvents = 'none';
             movingAnimal.style.borderRadius = '8px';
             movingAnimal.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
             movingAnimal.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
            
            // 隐藏原始动物
            animalElement.style.opacity = '0';
            
            // 添加到页面
            document.body.appendChild(movingAnimal);
            
            // 执行移动动画
            await new Promise(resolve => {
                setTimeout(() => {
                    movingAnimal.style.left = toRect.left + 'px';
                    movingAnimal.style.top = toRect.top + 'px';
                    setTimeout(() => {
                        document.body.removeChild(movingAnimal);
                        resolve();
                    }, 400);
                }, 50);
            });
        }
        
        // 移动动物数据
        toCell.animal = animal;
        toCell.direction = direction;
        
        // 清空原位置
        fromCell.animal = null;
        fromCell.direction = null;
        fromCell.element.innerHTML = '';
        fromCell.element.className = 'cell empty';
        
        // 在新位置放置动物
        this.placeAnimal(toRow, toCol, animal, direction);
        
        return new Promise(resolve => {
            setTimeout(resolve, 100);
        });
    }
    
    /**
     * 更新分数
     */
    updateScore(pathLength) {
        const baseScore = 10;
        const pathBonus = pathLength * 5;
        const comboBonus = this.combo * 2;
        
        const earnedScore = baseScore + pathBonus + comboBonus;
        this.score += earnedScore;
        
        // 更新最高连击
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
        
        // 连击效果
        if (this.combo > 1) {
            const comboElement = document.getElementById('combo');
            comboElement.classList.add('combo-effect');
            
            // 播放连击音效
            if (this.audioManager) {
                this.audioManager.playCombo(this.combo);
            }
            
            // 创建连击粒子效果
            if (this.particleSystem) {
                const rect = comboElement.getBoundingClientRect();
                const x = rect.left + rect.width / 2;
                const y = rect.top + rect.height / 2;
                this.particleSystem.createComboEffect(x, y, this.combo);
            }
            
            setTimeout(() => {
                comboElement.classList.remove('combo-effect');
            }, 600);
        }
        
        this.updateUI();
    }
    
    /**
     * 更新UI显示
     */
    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('combo').textContent = this.combo;
        document.getElementById('level').textContent = this.level;
        
        // 更新道具数量
        document.getElementById('shuffle-count').textContent = this.tools.shuffle;
        document.getElementById('flip-count').textContent = this.tools.flip;
        document.getElementById('hint-count').textContent = this.tools.hint;
        
        // 更新道具按钮状态
        document.getElementById('shuffle-btn').disabled = this.tools.shuffle <= 0;
        document.getElementById('flip-btn').disabled = this.tools.flip <= 0;
        document.getElementById('hint-btn').disabled = this.tools.hint <= 0;
        
        // 更新进度条
        const progress = (this.releasedAnimals / this.targetAnimals) * 100;
        document.getElementById('progressFill').style.width = `${Math.min(progress, 100)}%`;
        document.getElementById('progressText').textContent = `${this.releasedAnimals}/${this.targetAnimals}`;
    }
    
    /**
     * 检查游戏状态
     */
    checkGameState() {
        // 检查是否过关
        if (this.releasedAnimals >= this.targetAnimals) {
            this.showVictoryModal();
            return;
        }
        
        // 检查是否还有可移动的动物
        let hasMovableAnimals = false;
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = this.board[row][col];
                if (cell.animal && this.calculatePath(row, col, cell.direction).length > 0) {
                    hasMovableAnimals = true;
                    break;
                }
            }
            if (hasMovableAnimals) break;
        }
        
        // 如果没有可移动的动物，重新生成
        if (!hasMovableAnimals) {
            this.combo = 0; // 重置连击
            this.generateAnimals();
            this.updateUI();
        }
    }
    
    /**
     * 洗牌道具
     */
    useShuffle() {
        if (this.tools.shuffle <= 0 || this.isAnimating) return;
        
        // 播放道具音效
        if (this.audioManager) {
            this.audioManager.play('tool');
        }
        
        // 创建粒子效果
        if (this.particleSystem) {
            const gameBoard = document.getElementById('gameBoard');
            const rect = gameBoard.getBoundingClientRect();
            const x = rect.width / 2;
            const y = rect.height / 2;
            this.particleSystem.createToolEffect(x, y, 'shuffle');
        }
        
        this.tools.shuffle--;
        this.combo = 0; // 重置连击
        this.generateAnimals();
        this.updateUI();
    }
    
    /**
     * 翻转方向道具
     */
    useFlip() {
        if (this.tools.flip <= 0 || this.isAnimating) return;
        
        // 播放道具音效
        if (this.audioManager) {
            this.audioManager.play('tool');
        }
        
        // 创建粒子效果
        if (this.particleSystem) {
            const gameBoard = document.getElementById('gameBoard');
            const rect = gameBoard.getBoundingClientRect();
            const x = rect.width / 2;
            const y = rect.height / 2;
            this.particleSystem.createToolEffect(x, y, 'flip');
        }
        
        this.tools.flip--;
        
        // 翻转所有动物的方向
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = this.board[row][col];
                if (cell.animal) {
                    const oppositeDirection = {
                        up: 'down',
                        down: 'up',
                        left: 'right',
                        right: 'left'
                    };
                    
                    cell.direction = oppositeDirection[cell.direction];
                    const arrowElement = cell.element.querySelector('.direction-arrow');
                    if (arrowElement) {
                        arrowElement.className = `direction-arrow ${cell.direction}`;
                        arrowElement.textContent = this.directionSymbols[cell.direction];
                    }
                }
            }
        }
        
        this.updateUI();
    }
    
    /**
     * 提示道具
     */
    useHint() {
        if (this.tools.hint <= 0 || this.isAnimating) return;
        
        // 播放道具音效
        if (this.audioManager) {
            this.audioManager.play('tool');
        }
        
        // 创建粒子效果
        if (this.particleSystem) {
            const gameBoard = document.getElementById('gameBoard');
            const rect = gameBoard.getBoundingClientRect();
            const x = rect.width / 2;
            const y = rect.height / 2;
            this.particleSystem.createToolEffect(x, y, 'hint');
        }
        
        this.tools.hint--;
        
        // 找到最佳移动
        let bestMove = null;
        let maxPathLength = 0;
        
        for (let row = 0; row < this.boardSize; row++) {
            for (let col = 0; col < this.boardSize; col++) {
                const cell = this.board[row][col];
                if (cell.animal) {
                    const path = this.calculatePath(row, col, cell.direction);
                    if (path.length > maxPathLength) {
                        maxPathLength = path.length;
                        bestMove = { row, col };
                    }
                }
            }
        }
        
        // 高亮最佳移动
        if (bestMove) {
            const cell = this.board[bestMove.row][bestMove.col];
            cell.element.classList.add('highlighted');
            
            setTimeout(() => {
                cell.element.classList.remove('highlighted');
            }, 2000);
        }
        
        this.updateUI();
    }
    
    /**
     * 显示胜利弹窗
     */
    showVictoryModal() {
        // 播放胜利音效
        if (this.audioManager) {
            this.audioManager.play('victory');
        }
        
        // 创建庆祝粒子效果
        if (this.particleSystem) {
            const gameBoard = document.getElementById('gameBoard');
            const rect = gameBoard.getBoundingClientRect();
            for (let i = 0; i < 5; i++) {
                setTimeout(() => {
                    const x = Math.random() * rect.width;
                    const y = Math.random() * rect.height;
                    this.particleSystem.createExplosion(x, y, 20, { color: '#FFD700', speed: 5 });
                }, i * 200);
            }
        }
        
        const levelScore = this.score;
        const comboBonus = this.maxCombo * 50;
        
        document.getElementById('levelScore').textContent = levelScore;
        document.getElementById('comboBonus').textContent = comboBonus;
        document.getElementById('victoryModal').classList.remove('hidden');
    }
    
    /**
     * 显示游戏结束弹窗
     */
    showGameOverModal() {
        // 播放失败音效
        if (this.audioManager) {
            this.audioManager.play('gameOver');
        }
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('maxCombo').textContent = this.maxCombo;
        document.getElementById('gameOverModal').classList.remove('hidden');
    }
    
    /**
     * 下一关
     */
    nextLevel() {
        this.level++;
        this.releasedAnimals = 0;
        this.targetAnimals = Math.min(10 + this.level * 2, 20);
        this.combo = 0;
        
        // 增加道具奖励
        this.tools.shuffle += 1;
        this.tools.flip += 1;
        this.tools.hint += 2;
        
        this.generateAnimals();
        this.updateUI();
        
        document.getElementById('victoryModal').classList.add('hidden');
    }
    
    /**
     * 重新开始游戏
     */
    restart() {
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.level = 1;
        this.releasedAnimals = 0;
        this.targetAnimals = 10;
        
        this.tools = {
            shuffle: 3,
            flip: 3,
            hint: 5
        };
        
        this.generateAnimals();
        this.updateUI();
        
        document.getElementById('gameOverModal').classList.add('hidden');
        document.getElementById('victoryModal').classList.add('hidden');
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 道具按钮
        document.getElementById('shuffle-btn').addEventListener('click', () => this.useShuffle());
        document.getElementById('flip-btn').addEventListener('click', () => this.useFlip());
        document.getElementById('hint-btn').addEventListener('click', () => this.useHint());
        
        // 弹窗按钮
        document.getElementById('restartBtn').addEventListener('click', () => this.restart());
        document.getElementById('nextLevelBtn').addEventListener('click', () => this.nextLevel());
        
        // 音效控制按钮
        const audioToggle = document.getElementById('audioToggle');
        if (audioToggle && this.audioManager) {
            audioToggle.addEventListener('click', () => {
                const isMuted = this.audioManager.toggleMute();
                audioToggle.textContent = isMuted ? '🔇' : '🔊';
                audioToggle.classList.toggle('muted', isMuted);
                audioToggle.title = isMuted ? '开启音效' : '关闭音效';
            });
        }
        
        // 响应式调整
        window.addEventListener('resize', () => {
            this.adjustBoardSize();
            this.createBoard();
            this.generateAnimals();
            this.updateUI();
            
            // 调整粒子系统画布大小
            if (this.particleSystem) {
                this.particleSystem.resize();
            }
        });
    }
}

// 游戏初始化
document.addEventListener('DOMContentLoaded', () => {
    const game = new AnimalReleaseGame();
});