const board = Array.from({ length: 4 }, () => Array(4).fill(0));
let score = 0;
let bestScore = 0;

document.addEventListener('DOMContentLoaded', () => {
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
    let emptyCells = [];
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
}

function updateBoard() {
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            const cell = document.getElementById(`grid-cell-${i}-${j}`);
            const value = board[i][j];
            cell.textContent = value === 0 ? '' : value;
            cell.className = 'grid-cell' + (value ? ` number-${value}` : '');
            if (value === 0) {
                cell.style.backgroundColor = '';
            }
        }
    }
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

function compress(row) {
    // 保存原始行数据用于比较
    const originalRow = [...row];
    
    let newRow = row.filter(val => val !== 0);
    let merged = false;
    
    for (let i = 0; i < newRow.length - 1; i++) {
        if (newRow[i] === newRow[i + 1]) {
            newRow[i] *= 2;
            score += newRow[i];
            newRow[i + 1] = 0;
            merged = true;
        }
    }
    
    newRow = newRow.filter(val => val !== 0);
    while (newRow.length < 4) {
        newRow.push(0);
    }
    
    updateScore();
    
    // 检查是否发生了移动或合并
    return {
        row: newRow,
        changed: merged || JSON.stringify(originalRow) !== JSON.stringify(newRow)
    };
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