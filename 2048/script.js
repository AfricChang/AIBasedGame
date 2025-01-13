const board = Array.from({ length: 4 }, () => Array(4).fill(0));
let score = 0;
let bestScore = 0;

// 添加音频上下文
let audioContext = null;

// 初始化音频上下文
function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.log('Web Audio API is not supported in this browser');
    }
}

// 播放合并音效
function playMergeSound(value) {
    if (!audioContext) return;
    
    // 创建振荡器和增益节点
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // 根据数值调整频率
    const baseFrequency = 220;
    const multiplier = Math.log2(value) / 2;
    oscillator.frequency.setValueAtTime(baseFrequency * multiplier, audioContext.currentTime);
    
    // 设置音色为正弦波
    oscillator.type = 'sine';
    
    // 设置音量包络
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    // 连接节点
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // 开始播放并在短时间后停止
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.15);
}

document.addEventListener('DOMContentLoaded', () => {
    // 初始化音频
    initAudio();
    
    // 添加点击事件来初始化音频上下文
    document.addEventListener('click', () => {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });
    
    // 语言切换功能
    let currentLang = localStorage.getItem('gameLanguage') || 'en';
    const langToggle = document.getElementById('langToggle');
    
    function updateLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('gameLanguage', lang);
        
        // 更新所有带有 data-en 和 data-zh 属性的元素
        document.querySelectorAll('[data-en][data-zh]').forEach(element => {
            element.textContent = element.getAttribute(`data-${lang}`);
        });
        
        // 更新语言切换按钮文本
        langToggle.textContent = lang === 'en' ? '中文' : 'English';
    }
    
    // 初始化语言
    updateLanguage(currentLang);
    
    // 语言切换按钮点击事件
    langToggle.addEventListener('click', () => {
        updateLanguage(currentLang === 'en' ? 'zh' : 'en');
    });

    document.getElementById('newGameButton').addEventListener('click', newGame);
    document.getElementById('restart').addEventListener('click', newGame);
    document.addEventListener('keydown', handleKeyPress);
    
    // 添加触摸事件支持
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', function(event) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    }, false);

    document.addEventListener('touchmove', function(event) {
        // 防止页面滚动
        event.preventDefault();
    }, { passive: false });

    document.addEventListener('touchend', function(event) {
        touchEndX = event.changedTouches[0].clientX;
        touchEndY = event.changedTouches[0].clientY;

        handleSwipe();
    }, false);

    function handleSwipe() {
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const minSwipeDistance = 50; // 最小滑动距离

        // 确定主要的滑动方向
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平滑动
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    // 向右滑动
                    const moved = moveRight();
                    if (moved) {
                        generateNewNumber();
                        updateBoard();
                        if (isGameOver()) {
                            document.getElementById('gameover').style.display = 'flex';
                            document.getElementById('final-score').textContent = score;
                        }
                    }
                } else {
                    // 向左滑动
                    const moved = moveLeft();
                    if (moved) {
                        generateNewNumber();
                        updateBoard();
                        if (isGameOver()) {
                            document.getElementById('gameover').style.display = 'flex';
                            document.getElementById('final-score').textContent = score;
                        }
                    }
                }
            }
        } else {
            // 垂直滑动
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    // 向下滑动
                    const moved = moveDown();
                    if (moved) {
                        generateNewNumber();
                        updateBoard();
                        if (isGameOver()) {
                            document.getElementById('gameover').style.display = 'flex';
                            document.getElementById('final-score').textContent = score;
                        }
                    }
                } else {
                    // 向上滑动
                    const moved = moveUp();
                    if (moved) {
                        generateNewNumber();
                        updateBoard();
                        if (isGameOver()) {
                            document.getElementById('gameover').style.display = 'flex';
                            document.getElementById('final-score').textContent = score;
                        }
                    }
                }
            }
        }
    }

    // 添加鼠标事件支持
    let mouseStartX = 0;
    let mouseStartY = 0;
    let isMouseDown = false;
    const gridContainer = document.getElementById('grid-container');

    // 鼠标按下事件
    gridContainer.addEventListener('mousedown', function(event) {
        event.preventDefault();
        isMouseDown = true;
        mouseStartX = event.clientX;
        mouseStartY = event.clientY;
    });

    // 鼠标移动事件
    document.addEventListener('mousemove', function(event) {
        if (!isMouseDown) return;
        event.preventDefault();
    });

    // 鼠标松开事件
    document.addEventListener('mouseup', function(event) {
        if (!isMouseDown) return;
        
        const mouseEndX = event.clientX;
        const mouseEndY = event.clientY;
        
        handleMouseSwipe(mouseStartX, mouseStartY, mouseEndX, mouseEndY);
        isMouseDown = false;
    });

    // 鼠标离开游戏区域
    document.addEventListener('mouseleave', function() {
        isMouseDown = false;
    });

    function handleMouseSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const minSwipeDistance = 30; // 鼠标滑动的最小距离阈值

        // 确定主要的滑动方向
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            // 水平滑动
            if (Math.abs(deltaX) > minSwipeDistance) {
                if (deltaX > 0) {
                    // 向右滑动
                    const moved = moveRight();
                    if (moved) {
                        generateNewNumber();
                        updateBoard();
                        if (isGameOver()) {
                            document.getElementById('gameover').style.display = 'flex';
                            document.getElementById('final-score').textContent = score;
                        }
                    }
                } else {
                    // 向左滑动
                    const moved = moveLeft();
                    if (moved) {
                        generateNewNumber();
                        updateBoard();
                        if (isGameOver()) {
                            document.getElementById('gameover').style.display = 'flex';
                            document.getElementById('final-score').textContent = score;
                        }
                    }
                }
            }
        } else {
            // 垂直滑动
            if (Math.abs(deltaY) > minSwipeDistance) {
                if (deltaY > 0) {
                    // 向下滑动
                    const moved = moveDown();
                    if (moved) {
                        generateNewNumber();
                        updateBoard();
                        if (isGameOver()) {
                            document.getElementById('gameover').style.display = 'flex';
                            document.getElementById('final-score').textContent = score;
                        }
                    }
                } else {
                    // 向上滑动
                    const moved = moveUp();
                    if (moved) {
                        generateNewNumber();
                        updateBoard();
                        if (isGameOver()) {
                            document.getElementById('gameover').style.display = 'flex';
                            document.getElementById('final-score').textContent = score;
                        }
                    }
                }
            }
        }
    }

    // 从本地存储加载最高分
    const savedBestScore = localStorage.getItem('bestScore');
    if (savedBestScore) {
        bestScore = parseInt(savedBestScore);
        document.getElementById('bestScore').textContent = bestScore;
    }
    newGame();
});

function newGame() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            board[i][j] = 0;
        }
    }
    score = 0;
    updateScore();
    generateNewNumber();
    generateNewNumber();
    updateBoard();
    document.getElementById('gameover').style.display = 'none';
}

function generateNewNumber() {
    const emptyCells = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) {
                emptyCells.push({ x: i, y: j });
            }
        }
    }
    if (emptyCells.length === 0) return;
    
    const { x, y } = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    board[x][y] = Math.random() < 0.9 ? 2 : 4;
    
    // 标记新生成的数字
    const cell = document.getElementById(`grid-cell-${x}-${y}`);
    if (cell) {
        cell.dataset.isNew = 'true';
    }
}

function updateBoard() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const cell = document.getElementById(`grid-cell-${i}-${j}`);
            const value = board[i][j];
            
            // 清除之前的动画类
            cell.classList.remove('tile-new', 'tile-merged', 'tile-moving');
            
            if (value !== 0) {
                cell.textContent = value;
                cell.className = `grid-cell number-${value}`;
                
                // 为新生成的数字添加出现动画
                if (cell.dataset.isNew === 'true') {
                    cell.classList.add('tile-new');
                    cell.dataset.isNew = 'false';
                }
                
                // 为合并的数字添加合并动画
                if (cell.dataset.merged === 'true') {
                    cell.classList.add('tile-merged');
                    cell.dataset.merged = 'false';
                }
            } else {
                cell.textContent = '';
                cell.className = 'grid-cell';
                cell.style.backgroundColor = '';
            }
        }
    }
}

function compress(row) {
    // 保存原始行数据用于比较
    const originalRow = [...row];
    
    let newRow = row.filter(val => val !== 0);
    let merged = false;
    let mergedPositions = new Set(); // 记录合并位置
    
    for (let i = 0; i < newRow.length - 1; i++) {
        if (newRow[i] === newRow[i + 1]) {
            const mergedValue = newRow[i] * 2;
            newRow[i] = mergedValue;
            score += mergedValue;
            newRow[i + 1] = 0;
            merged = true;
            mergedPositions.add(i); // 记录发生合并的位置
            
            // 播放合并音效
            playMergeSound(mergedValue);
        }
    }
    
    newRow = newRow.filter(val => val !== 0);
    while (newRow.length < 4) {
        newRow.push(0);
    }
    
    updateScore();
    
    // 标记合并的格子
    if (merged) {
        mergedPositions.forEach(pos => {
            const cell = document.getElementById(`grid-cell-${row}-${pos}`);
            if (cell) {
                cell.dataset.merged = 'true';
            }
        });
    }
    
    return {
        row: newRow,
        changed: merged || JSON.stringify(originalRow) !== JSON.stringify(newRow)
    };
}

function handleKeyPress(event) {
    if (document.getElementById('gameover').style.display === 'block') {
        return; // 如果游戏结束，不处理按键事件
    }

    let moved = false;
    switch (event.key) {
        case 'ArrowUp':
            moved = moveUp();
            break;
        case 'ArrowDown':
            moved = moveDown();
            break;
        case 'ArrowLeft':
            moved = moveLeft();
            break;
        case 'ArrowRight':
            moved = moveRight();
            break;
        default:
            return;
    }

    if (moved) {
        generateNewNumber();
        updateBoard();
        if (isGameOver()) {
            document.getElementById('gameover').style.display = 'flex';
            document.getElementById('final-score').textContent = score;
        }
    }
}

function moveLeft() {
    let moved = false;
    for (let i = 0; i < 4; i++) {
        const result = compress(board[i]);
        if (result.changed) {
            moved = true;
        }
        board[i] = result.row;
    }
    return moved;
}

function moveRight() {
    let moved = false;
    for (let i = 0; i < 4; i++) {
        const reversed = board[i].slice().reverse();
        const result = compress(reversed);
        if (result.changed) {
            moved = true;
        }
        board[i] = result.row.reverse();
    }
    return moved;
}

function moveUp() {
    let moved = false;
    for (let j = 0; j < 4; j++) {
        const column = board.map(row => row[j]);
        const result = compress(column);
        if (result.changed) {
            moved = true;
        }
        for (let i = 0; i < 4; i++) {
            board[i][j] = result.row[i];
        }
    }
    return moved;
}

function moveDown() {
    let moved = false;
    for (let j = 0; j < 4; j++) {
        const column = board.map(row => row[j]).reverse();
        const result = compress(column);
        if (result.changed) {
            moved = true;
        }
        const newColumn = result.row.reverse();
        for (let i = 0; i < 4; i++) {
            board[i][j] = newColumn[i];
        }
    }
    return moved;
}

function updateScore() {
    document.getElementById('score').textContent = score;
    if (score > bestScore) {
        bestScore = score;
        document.getElementById('bestScore').textContent = bestScore;
        localStorage.setItem('bestScore', bestScore.toString());
    }
}

function isGameOver() {
    // 检查是否有空格
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (board[i][j] === 0) return false;
        }
    }
    
    // 检查是否有相邻的相同数字
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (i < 3 && board[i][j] === board[i + 1][j]) return false;
            if (j < 3 && board[i][j] === board[i][j + 1]) return false;
        }
    }
    return true;
}