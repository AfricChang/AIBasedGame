const board = Array.from({ length: 4 }, () => Array(4).fill(0));
let score = 0;
let bestScore = 0;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('newGameButton').addEventListener('click', newGame);
    document.getElementById('restart').addEventListener('click', newGame);
    document.addEventListener('keydown', handleKeyPress);
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

function moveUp() {
    let moved = false;
    for (let j = 0; j < 4; j++) {
        let compressed = compress(board.map(row => row[j]));
        if (compressed.some((val, i) => val !== board[i][j])) {
            moved = true;
        }
        for (let i = 0; i < 4; i++) {
            board[i][j] = compressed[i];
        }
    }
    return moved;
}

function moveDown() {
    let moved = false;
    for (let j = 0; j < 4; j++) {
        let compressed = compress(board.map(row => row[j]).reverse()).reverse();
        if (compressed.some((val, i) => val !== board[i][j])) {
            moved = true;
        }
        for (let i = 0; i < 4; i++) {
            board[i][j] = compressed[i];
        }
    }
    return moved;
}

function moveLeft() {
    let moved = false;
    for (let i = 0; i < 4; i++) {
        let compressed = compress(board[i]);
        if (compressed.some((val, j) => val !== board[i][j])) {
            moved = true;
        }
        board[i] = compressed;
    }
    return moved;
}

function moveRight() {
    let moved = false;
    for (let i = 0; i < 4; i++) {
        let compressed = compress(board[i].reverse()).reverse();
        if (compressed.some((val, j) => val !== board[i][j])) {
            moved = true;
        }
        board[i] = compressed;
    }
    return moved;
}

function compress(row) {
    let newRow = row.filter(val => val !== 0);
    for (let i = 0; i < newRow.length - 1; i++) {
        if (newRow[i] === newRow[i + 1]) {
            newRow[i] *= 2;
            score += newRow[i];
            updateScore();
            newRow[i + 1] = 0;
        }
    }
    newRow = newRow.filter(val => val !== 0);
    while (newRow.length < 4) {
        newRow.push(0);
    }
    return newRow;
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