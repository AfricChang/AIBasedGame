const boardSize = 15;
let board = [];
let currentPlayer = 'black';
let gameOver = false;

// 计算某个位置的得分
function calculateScore(row, col, player) {
    let score = 0;
    const directions = [
        [1, 0],  // 垂直
        [0, 1],  // 水平
        [1, 1],  // 对角线
        [1, -1]  // 反对角线
    ];

    for (const [dx, dy] of directions) {
        let count = 0;
        let openEnds = 0;
        
        // 正向检查
        let x = row + dx;
        let y = col + dy;
        while (x >= 0 && x < boardSize && y >= 0 && y < boardSize && 
               (board[x][y] === player || board[x][y] === null)) {
            if (board[x][y] === player) count++;
            else openEnds++;
            x += dx;
            y += dy;
        }
        
        // 反向检查
        x = row - dx;
        y = col - dy;
        while (x >= 0 && x < boardSize && y >= 0 && y < boardSize && 
               (board[x][y] === player || board[x][y] === null)) {
            if (board[x][y] === player) count++;
            else openEnds++;
            x -= dx;
            y -= dy;
        }
        
        // 根据连子数和开放端评分
        if (count >= 4) score += 1000000;  // 阻止四连
        else if (count === 3) {
            if (openEnds >= 2) score += 100000;  // 开放三连
            else if (openEnds >= 1) score += 50000;  // 半开放三连
        }
        else if (count === 2 && openEnds >= 2) score += 10000;  // 开放二连
    }
    
    return score;
}

// AI智能下棋
function aiMove() {
    if (gameOver) return;
    
    let bestScore = -1;
    let bestMoves = [];
    
    // 遍历所有空位，寻找最佳下法
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (!board[i][j]) {
                // 计算防守得分（阻止玩家）
                const defenseScore = calculateScore(i, j, 'black');
                // 计算进攻得分（自己连子）
                const offenseScore = calculateScore(i, j, 'white');
                const totalScore = defenseScore * 2 + offenseScore;  // 更注重防守
                
                if (totalScore > bestScore) {
                    bestScore = totalScore;
                    bestMoves = [{row: i, col: j}];
                } else if (totalScore === bestScore) {
                    bestMoves.push({row: i, col: j});
                }
            }
        }
    }
    
    // 从最佳下法中随机选择一个
    if (bestMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * bestMoves.length);
        const {row, col} = bestMoves[randomIndex];
        placeMove(row, col);
    }
}

// 下棋
function placeMove(row, col) {
    board[row][col] = currentPlayer;
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add(currentPlayer);
    
    if (checkWin(row, col)) {
        gameOver = true;
        alert(`${currentPlayer === 'black' ? '黑棋' : '白棋'}获胜！`);
        return;
    }
    
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    
    // 玩家下完后，轮到AI
    if (currentPlayer === 'white' && !gameOver) {
        setTimeout(aiMove, 500);
    }
}

// 初始化棋盘
function initBoard() {
    const gameBoard = document.getElementById('game-board');
    gameBoard.innerHTML = '';
    board = Array.from({ length: boardSize }, () => Array(boardSize).fill(null));
    
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            gameBoard.appendChild(cell);
        }
    }
}

// 处理格子点击
function handleCellClick(event) {
    if (gameOver || currentPlayer !== 'black') return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    if (board[row][col]) return;
    
    placeMove(row, col);
}

// 检查是否获胜
function checkWin(row, col) {
    const directions = [
        [1, 0],  // 垂直
        [0, 1],  // 水平
        [1, 1],  // 对角线
        [1, -1]  // 反对角线
    ];

    for (const [dx, dy] of directions) {
        let count = 1;
        
        // 正向检查
        let x = row + dx;
        let y = col + dy;
        while (x >= 0 && x < boardSize && y >= 0 && y < boardSize && board[x][y] === currentPlayer) {
            count++;
            x += dx;
            y += dy;
        }
        
        // 反向检查
        x = row - dx;
        y = col - dy;
        while (x >= 0 && x < boardSize && y >= 0 && y < boardSize && board[x][y] === currentPlayer) {
            count++;
            x -= dx;
            y -= dy;
        }
        
        if (count >= 5) {
            return true;
        }
    }
    
    return false;
}

// 重置游戏
document.getElementById('reset-btn').addEventListener('click', () => {
    initBoard();
    currentPlayer = 'black';
    gameOver = false;
});

// 初始化游戏
initBoard();
