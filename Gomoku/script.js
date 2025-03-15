const boardSize = 15;
let gameBoard = [];
let currentPlayer = 'black';
let gameOver = false;
let difficulty = 'normal'; // 默认难度
let aiThinking = false;

// 菜单交互
const menuIcon = document.querySelector('.menu-icon');
const menuOptions = document.querySelector('.menu-options');

// 显示/隐藏菜单
menuIcon.addEventListener('click', (e) => {
    e.stopPropagation();
    menuOptions.style.display = menuOptions.style.display === 'block' ? 'none' : 'block';
});

// 点击其他地方隐藏菜单
document.addEventListener('click', () => {
    menuOptions.style.display = 'none';
});

// 处理难度选择
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.stopPropagation();
        const newDifficulty = item.dataset.difficulty;
        // 检查棋盘是否为空
        const isBoardEmpty = gameBoard.every(row => row.every(cell => cell === null));
        
        if (isBoardEmpty) {
            // 如果棋盘为空，直接切换难度
            difficulty = newDifficulty;
            menuOptions.style.display = 'none';
        } else {
            // 如果棋盘不为空，弹出确认对话框
            showConfirmDialog(`已选择${newDifficulty}难度，是否重新开始游戏？`, () => {
                difficulty = newDifficulty;
                menuOptions.style.display = 'none';
                initGame();
            });
        }
    });
});

// 根据难度调整AI策略
function getAIDifficultyMultiplier() {
    switch (difficulty) {
        case 'easy':
            return 0.5; // 降低AI评分权重
        case 'normal':
            return 1;
        case 'hard':
            return 2; // 提高AI评分权重
        default:
            return 1;
    }
}

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
               (gameBoard[x][y] === player || gameBoard[x][y] === null)) {
            if (gameBoard[x][y] === player) count++;
            else openEnds++;
            x += dx;
            y += dy;
        }
        
        // 反向检查
        x = row - dx;
        y = col - dy;
        while (x >= 0 && x < boardSize && y >= 0 && y < boardSize && 
               (gameBoard[x][y] === player || gameBoard[x][y] === null)) {
            if (gameBoard[x][y] === player) count++;
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
            if (!gameBoard[i][j]) {
                // 计算防守得分（阻止玩家）
                const defenseScore = calculateScore(i, j, 'black');
                // 计算进攻得分（自己连子）
                const offenseScore = calculateScore(i, j, 'white');
                const totalScore = (defenseScore * 2 + offenseScore) * getAIDifficultyMultiplier();
                
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
    gameBoard[row][col] = currentPlayer;
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    cell.classList.add(currentPlayer);
    
    if (checkWin(row, col)) {
        gameOver = true;
        const winner = currentPlayer === 'black' ? '黑棋' : '白棋';
        const winnerMessage = document.querySelector('#winner-message');
        if (winnerMessage) {
            winnerMessage.textContent = `${winner}获胜！`;
            winnerMessage.style.display = 'block';
        } else {
            console.error('未找到获胜提示元素');
        }
        return;
    }
    
    currentPlayer = currentPlayer === 'black' ? 'white' : 'black';
    
    // 玩家下完后，轮到AI
    if (currentPlayer === 'white' && !gameOver) {
        setTimeout(aiMove, 500);
    }
}

// 初始化棋盘
function initGame() {
    const boardElement = document.getElementById('game-board');
    boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    boardElement.style.gridTemplateRows = `repeat(${boardSize}, 1fr)`;
    
    // 清除所有子元素
    boardElement.innerHTML = '';
    
    // 重置游戏数据
    gameBoard = Array(boardSize).fill(null).map(() => Array(boardSize).fill(null));
    currentPlayer = 'black';
    gameOver = false;
    hideWinnerMessage();
    
    // 根据屏幕大小调整棋盘
    const viewportWidth = Math.min(window.innerWidth, window.innerHeight) * 0.9;
    const cellSize = Math.floor(viewportWidth / boardSize);
    
    // 创建新的棋盘单元格
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'board-cell';
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            cell.dataset.row = i;
            cell.dataset.col = j;
            cell.addEventListener('click', handleCellClick);
            boardElement.appendChild(cell);
        }
    }
    
    // 设置难度选择器
    setupDifficultySelector();
}

// 处理单元格点击
function handleCellClick(event) {
    if (aiThinking || gameOver) return;
    
    const row = parseInt(event.target.dataset.row);
    const col = parseInt(event.target.dataset.col);
    
    // 确保row和col是有效数字
    if (isNaN(row) || isNaN(col)) return;
    
    // 如果单元格已经有棋子，返回
    if (gameBoard[row][col] !== null) return;
    
    // 放置人类玩家（黑子）的棋子
    placeStone(row, col, 'black');
    
    // 检查胜利
    if (checkWin(row, col, 'black')) {
        showWinner('black');
        return;
    }
    
    // 检查平局
    if (checkDraw()) {
        showDraw();
        return;
    }
    
    // 电脑回合（白子）
    currentPlayer = 'white';
    aiThinking = true;
    
    // 延迟一下让界面更新，使用命名的超时器便于取消
    window.aiMoveTimeout = setTimeout(() => {
        makeAIMove();
        aiThinking = false;
        window.aiMoveTimeout = null;
    }, 300);
}

// 放置棋子
function placeStone(row, col, player) {
    gameBoard[row][col] = player;
    
    const cells = document.querySelectorAll('.board-cell');
    const index = row * boardSize + col;
    const stone = document.createElement('div');
    stone.className = `stone ${player}`;
    cells[index].appendChild(stone);
}

// 检查胜利条件
function checkWin(row, col, player) {
    const directions = [
        [0, 1],  // 水平
        [1, 0],  // 垂直
        [1, 1],  // 对角线
        [1, -1]  // 反对角线
    ];
    
    for (const [dx, dy] of directions) {
        let count = 1;  // 当前位置已经有一个棋子
        
        // 向一个方向查找
        for (let i = 1; i <= 4; i++) {
            const newRow = row + dx * i;
            const newCol = col + dy * i;
            if (isValidPosition(newRow, newCol) && gameBoard[newRow][newCol] === player) {
                count++;
            } else {
                break;
            }
        }
        
        // 向相反方向查找
        for (let i = 1; i <= 4; i++) {
            const newRow = row - dx * i;
            const newCol = col - dy * i;
            if (isValidPosition(newRow, newCol) && gameBoard[newRow][newCol] === player) {
                count++;
            } else {
                break;
            }
        }
        
        if (count >= 5) {
            return true;
        }
    }
    
    return false;
}

// 检查是否平局
function checkDraw() {
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (gameBoard[i][j] === null) {
                return false;
            }
        }
    }
    return true;
}

// 显示赢家消息
function showWinner(player) {
    const message = player === 'black' ? '黑方获胜！' : '白方获胜！';
    const winnerMessage = document.getElementById('winner-message');
    winnerMessage.textContent = message;
    winnerMessage.className = `show ${player}-win`;
    gameOver = true;
}

// 显示平局消息
function showDraw() {
    const winnerMessage = document.getElementById('winner-message');
    winnerMessage.textContent = '平局！';
    winnerMessage.className = 'show';
    gameOver = true;
}

// 隐藏赢家消息
function hideWinnerMessage() {
    const winnerMessage = document.getElementById('winner-message');
    winnerMessage.className = '';
}

// 重置游戏
function resetGame() {
    // 清除计时器，避免多次调用的问题
    if (window.aiMoveTimeout) {
        clearTimeout(window.aiMoveTimeout);
        window.aiMoveTimeout = null;
    }
    
    // 重置AI思考状态
    aiThinking = false;
    
    // 完全初始化游戏
    initGame();
    
    // 确保菜单状态正确
    updateDifficultyDisplay();
    
    console.log("游戏已重置");
}

// 更新难度显示
function updateDifficultyDisplay() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.difficulty === difficulty) {
            item.classList.add('active');
        }
    });
}

// 设置难度选择器
function setupDifficultySelector() {
    const menuItems = document.querySelectorAll('.menu-item');
    
    menuItems.forEach(item => {
        // 清除之前的所有事件监听器
        const clonedItem = item.cloneNode(true);
        item.parentNode.replaceChild(clonedItem, item);
        
        // 设置当前难度为active
        if (clonedItem.dataset.difficulty === difficulty) {
            clonedItem.classList.add('active');
        }
        
        // 添加新的点击事件
        clonedItem.addEventListener('click', function() {
            // 更新难度
            difficulty = this.dataset.difficulty;
            
            // 更新active状态
            updateDifficultyDisplay();
            
            // 重置游戏
            if (!isBoardEmpty()) {
                showConfirmDialog(`已选择${getDifficultyName(difficulty)}难度，是否重新开始游戏？`, () => {
                    resetGame();
                });
            } else {
                resetGame();
            }
        });
    });
}

// 获取难度名称
function getDifficultyName(diff) {
    switch(diff) {
        case 'easy': return '简单';
        case 'normal': return '普通';
        case 'hard': return '困难';
        default: return '普通';
    }
}

// 检查棋盘是否为空
function isBoardEmpty() {
    if (!gameBoard || gameBoard.length === 0) return true;
    
    return gameBoard.every(row => {
        if (!row) return true;
        return row.every(cell => cell === null);
    });
}

// 检查位置是否在棋盘内
function isValidPosition(row, col) {
    return row >= 0 && row < boardSize && col >= 0 && col < boardSize;
}

// AI移动逻辑
function makeAIMove() {
    // 根据难度选择AI策略
    let move;
    
    switch (difficulty) {
        case 'easy':
            move = getEasyAIMove();
            break;
        case 'normal':
            move = getNormalAIMove();
            break;
        case 'hard':
            move = getHardAIMove();
            break;
        default:
            move = getNormalAIMove();
    }
    
    if (!move) {
        // 没有找到合适的位置，随机选择一个
        move = getRandomMove();
    }
    
    // 放置AI的棋子
    placeStone(move.row, move.col, 'white');
    
    // 检查胜利
    if (checkWin(move.row, move.col, 'white')) {
        showWinner('white');
        return;
    }
    
    // 检查平局
    if (checkDraw()) {
        showDraw();
        return;
    }
    
    // 切换回人类玩家
    currentPlayer = 'black';
}

// 简单难度AI (随机放置)
function getEasyAIMove() {
    // 70%概率随机下，30%概率有策略地下
    if (Math.random() < 0.7) {
        return getRandomMove();
    } else {
        // 尝试找到基本的防守位置
        return findBasicDefensiveMove();
    }
}

// 普通难度AI
function getNormalAIMove() {
    // 优先考虑进攻，然后防守
    let move = findWinningMove('white');
    if (move) return move;
    
    // 防止玩家下一步获胜
    move = findWinningMove('black');
    if (move) return move;
    
    // 寻找有利位置
    move = findGoodMove();
    if (move) return move;
    
    // 随机放置
    return getRandomMove();
}

// 困难难度AI
function getHardAIMove() {
    // 1. 首先检查是否可以直接获胜
    let move = findWinningMove('white');
    if (move) return move;
    
    // 2. 阻止对手直接获胜
    move = findWinningMove('black');
    if (move) return move;
    
    // 3. 攻击型搜索 - 寻找能形成活四、双活三等致命威胁的位置
    move = findOffensiveThreatMove('white', 2);
    if (move) return move;
    
    // 4. 防御型搜索 - 阻止对手形成活四、双活三等威胁
    move = findOffensiveThreatMove('black', 2);
    if (move) return move;
    
    // 5. 使用VCT (Victory by Continuous Threats) 威胁搜索
    move = findVCTMove('white', 3); // 进行3步威胁搜索
    if (move) return move;
    
    // 6. 使用改进的极小极大搜索
    move = findBestMoveWithIterativeDeepening('white', 6); // 深度为6的迭代加深搜索
    if (move) return move;
    
    // 7. 回落到基于评分的搜索
    return findBestScoringMove('white');
}

// 寻找一步获胜的位置
function findWinningMove(player) {
    const moves = getEmptyCells();
    
    for (const move of moves) {
        // 临时放置棋子
        gameBoard[move.row][move.col] = player;
        
        // 检查是否获胜
        const isWinning = checkWin(move.row, move.col, player);
        
        // 撤销临时放置
        gameBoard[move.row][move.col] = null;
        
        if (isWinning) {
            return move;
        }
    }
    
    return null;
}

// 寻找能形成高威胁（如活四、双活三等）的位置
function findOffensiveThreatMove(player, minThreats) {
    const moves = getEmptyCells();
    let bestMove = null;
    let bestScore = -1;
    
    for (const move of moves) {
        // 临时放置棋子
        gameBoard[move.row][move.col] = player;
        
        // 计算此位置的棋型评分
        const patternScore = evaluatePositionPatterns(move.row, move.col, player);
        
        // 撤销临时放置
        gameBoard[move.row][move.col] = null;
        
        // 更新最佳分数
        if (patternScore > bestScore) {
            bestScore = patternScore;
            bestMove = move;
        }
    }
    
    // 只返回足够强的威胁
    if (bestScore >= PATTERN_SCORES.FOUR || bestScore >= minThreats * PATTERN_SCORES.THREE_OPEN) {
        return bestMove;
    }
    
    return null;
}

// 棋型分数常量
const PATTERN_SCORES = {
    FIVE: 100000,           // 五连
    FOUR: 10000,            // 活四
    FOUR_BLOCKED: 5000,     // 冲四
    THREE_OPEN: 2000,       // 活三
    THREE_BLOCKED: 500,     // 眠三
    TWO_OPEN: 200,          // 活二
    TWO_BLOCKED: 50,        // 眠二
    ONE_OPEN: 20,           // 活一
    ONE_BLOCKED: 5,         // 眠一
    BLOCKED: -10            // 被阻挡
};

// 评估位置的棋型
function evaluatePositionPatterns(row, col, player) {
    const directions = [
        [0, 1],  // 水平
        [1, 0],  // 垂直
        [1, 1],  // 对角线
        [1, -1]  // 反对角线
    ];
    
    let totalScore = 0;
    const patterns = {
        fives: 0,
        openFours: 0,
        blockedFours: 0,
        openThrees: 0,
        blockedThrees: 0,
        openTwos: 0
    };
    
    for (const [dx, dy] of directions) {
        // 获取该方向的棋型
        const pattern = identifyPattern(row, col, dx, dy, player);
        
        // 累计棋型
        if (pattern.type === 'five') {
            patterns.fives++;
        } else if (pattern.type === 'four' && pattern.openEnds === 2) {
            patterns.openFours++;
        } else if (pattern.type === 'four' && pattern.openEnds === 1) {
            patterns.blockedFours++;
        } else if (pattern.type === 'three' && pattern.openEnds === 2) {
            patterns.openThrees++;
        } else if (pattern.type === 'three' && pattern.openEnds === 1) {
            patterns.blockedThrees++;
        } else if (pattern.type === 'two' && pattern.openEnds === 2) {
            patterns.openTwos++;
        }
        
        // 单方向评分
        totalScore += getPatternScore(pattern);
    }
    
    // 组合棋型评分
    if (patterns.fives > 0) {
        totalScore += PATTERN_SCORES.FIVE;
    } else if (patterns.openFours > 0) {
        totalScore += PATTERN_SCORES.FOUR;
    } else if (patterns.blockedFours >= 2) {
        totalScore += PATTERN_SCORES.FOUR; // 双冲四等同于活四
    } else if (patterns.blockedFours > 0 && patterns.openThrees > 0) {
        totalScore += PATTERN_SCORES.FOUR; // 冲四活三组合也很强
    } else if (patterns.openThrees >= 2) {
        totalScore += PATTERN_SCORES.THREE_OPEN * 2; // 双活三加成
    }
    
    return totalScore;
}

// 获取棋型评分
function getPatternScore(pattern) {
    if (pattern.type === 'five') {
        return PATTERN_SCORES.FIVE;
    } else if (pattern.type === 'four') {
        return pattern.openEnds === 2 ? PATTERN_SCORES.FOUR : PATTERN_SCORES.FOUR_BLOCKED;
    } else if (pattern.type === 'three') {
        return pattern.openEnds === 2 ? PATTERN_SCORES.THREE_OPEN : PATTERN_SCORES.THREE_BLOCKED;
    } else if (pattern.type === 'two') {
        return pattern.openEnds === 2 ? PATTERN_SCORES.TWO_OPEN : PATTERN_SCORES.TWO_BLOCKED;
    } else if (pattern.type === 'one') {
        return pattern.openEnds === 2 ? PATTERN_SCORES.ONE_OPEN : PATTERN_SCORES.ONE_BLOCKED;
    } else {
        return 0;
    }
}

// 识别棋型
function identifyPattern(row, col, dx, dy, player) {
    let count = 1; // 包括当前位置
    let leftBlocked = false;
    let rightBlocked = false;
    
    // 向左检查
    for (let i = 1; i <= 4; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        
        if (isValidPosition(newRow, newCol)) {
            if (gameBoard[newRow][newCol] === player) {
                count++;
            } else if (gameBoard[newRow][newCol] === null) {
                break;
            } else { // 对手棋子
                leftBlocked = true;
                break;
            }
        } else { // 边界外
            leftBlocked = true;
            break;
        }
    }
    
    // 向右检查
    for (let i = 1; i <= 4; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        
        if (isValidPosition(newRow, newCol)) {
            if (gameBoard[newRow][newCol] === player) {
                count++;
            } else if (gameBoard[newRow][newCol] === null) {
                break;
            } else { // 对手棋子
                rightBlocked = true;
                break;
            }
        } else { // 边界外
            rightBlocked = true;
            break;
        }
    }
    
    // 判断棋型
    let type = '';
    if (count >= 5) {
        type = 'five';
    } else if (count === 4) {
        type = 'four';
    } else if (count === 3) {
        type = 'three';
    } else if (count === 2) {
        type = 'two';
    } else if (count === 1) {
        type = 'one';
    }
    
    // 计算开放端数量
    const openEnds = (leftBlocked ? 0 : 1) + (rightBlocked ? 0 : 1);
    
    return { type, count, openEnds };
}

// 连续威胁搜索 (VCT - Victory by Continuous Threats)
function findVCTMove(player, depth) {
    // 获取所有可能的威胁位置
    const threatMoves = getAllThreatMoves(player);
    
    // 按威胁程度排序
    threatMoves.sort((a, b) => b.score - a.score);
    
    // 尝试每个威胁位置
    for (const move of threatMoves) {
        if (move.score < PATTERN_SCORES.THREE_OPEN) continue; // 只考虑强威胁
        
        // 临时放置棋子
        gameBoard[move.row][move.col] = player;
        
        // 检查是否胜利
        if (checkWin(move.row, move.col, player)) {
            gameBoard[move.row][move.col] = null;
            return move;
        }
        
        // 递归检查对手是否能防守所有后续威胁
        const canForceWin = checkContinuousThreat(player, depth - 1, move.row, move.col);
        
        // 撤销临时放置
        gameBoard[move.row][move.col] = null;
        
        if (canForceWin) {
            return move;
        }
    }
    
    return null;
}

// 检查连续威胁是否能获胜
function checkContinuousThreat(player, depth, lastRow, lastCol) {
    if (depth <= 0) return false;
    
    const opponent = player === 'white' ? 'black' : 'white';
    
    // 找出对手必须防守的位置
    const mustDefendMoves = findMustDefendMoves(player, lastRow, lastCol);
    
    // 如果没有必须防守的位置，对手可以自由走子，威胁链断裂
    if (mustDefendMoves.length === 0) return false;
    
    // 如果必须防守的位置有多个，对手无法全部防守
    if (mustDefendMoves.length > 1) return true;
    
    // 对手防守唯一的必须防守位置
    const defenseMove = mustDefendMoves[0];
    gameBoard[defenseMove.row][defenseMove.col] = opponent;
    
    // 获取所有下一步的威胁位置
    const nextThreatMoves = getAllThreatMoves(player);
    
    // 按威胁程度排序
    nextThreatMoves.sort((a, b) => b.score - a.score);
    
    let canContinueThreat = false;
    
    // 尝试每个下一步威胁
    for (const move of nextThreatMoves) {
        if (move.score < PATTERN_SCORES.THREE_OPEN) continue; // 只考虑强威胁
        
        // 临时放置棋子
        gameBoard[move.row][move.col] = player;
        
        // 检查是否胜利
        if (checkWin(move.row, move.col, player)) {
            canContinueThreat = true;
        } else {
            // 递归检查是否能继续威胁
            canContinueThreat = checkContinuousThreat(player, depth - 1, move.row, move.col);
        }
        
        // 撤销临时放置
        gameBoard[move.row][move.col] = null;
        
        if (canContinueThreat) break;
    }
    
    // 撤销对手的防守
    gameBoard[defenseMove.row][defenseMove.col] = null;
    
    return canContinueThreat;
}

// 找出必须防守的位置
function findMustDefendMoves(player, lastRow, lastCol) {
    const mustDefendMoves = [];
    const emptyCells = getEmptyCells();
    
    for (const move of emptyCells) {
        // 临时放置棋子
        gameBoard[move.row][move.col] = player;
        
        // 检查是否形成威胁
        const pattern = evaluatePositionPatterns(move.row, move.col, player);
        
        // 撤销临时放置
        gameBoard[move.row][move.col] = null;
        
        // 判断是否是必须防守的位置
        if (pattern >= PATTERN_SCORES.FOUR || checkWin(move.row, move.col, player)) {
            mustDefendMoves.push(move);
        }
    }
    
    return mustDefendMoves;
}

// 获取所有威胁位置
function getAllThreatMoves(player) {
    const emptyCells = getEmptyCells();
    const threatMoves = [];
    
    for (const move of emptyCells) {
        // 临时放置棋子
        gameBoard[move.row][move.col] = player;
        
        // 评估此位置的威胁
        const score = evaluatePositionPatterns(move.row, move.col, player);
        
        // 撤销临时放置
        gameBoard[move.row][move.col] = null;
        
        // 如果有威胁，添加到列表
        if (score > 0) {
            threatMoves.push({
                row: move.row,
                col: move.col,
                score: score
            });
        }
    }
    
    return threatMoves;
}

// 使用迭代加深的极小极大搜索找出最佳移动
function findBestMoveWithIterativeDeepening(player, maxDepth) {
    // 首先考虑中心区域
    if (countStones() <= 2) {
        const center = Math.floor(boardSize / 2);
        const centerArea = [
            { row: center, col: center },
            { row: center-1, col: center-1 },
            { row: center-1, col: center },
            { row: center, col: center-1 },
            { row: center+1, col: center+1 },
            { row: center+1, col: center },
            { row: center, col: center+1 },
            { row: center-1, col: center+1 },
            { row: center+1, col: center-1 }
        ];
        
        // 过滤出有效空位
        const validMoves = centerArea.filter(move => 
            isValidPosition(move.row, move.col) && gameBoard[move.row][move.col] === null
        );
        
        if (validMoves.length > 0) {
            // 随机选择一个中心区域的位置
            const randomIndex = Math.floor(Math.random() * validMoves.length);
            return validMoves[randomIndex];
        }
    }
    
    // 逐步增加搜索深度
    let bestMove = null;
    const startTime = Date.now();
    const timeLimit = 2000; // 2秒时间限制
    
    for (let depth = 2; depth <= maxDepth; depth += 2) {
        const moveWithDepth = findBestMoveWithAlphaBeta(player, depth);
        
        if (moveWithDepth) {
            bestMove = moveWithDepth;
        }
        
        // 检查时间限制，防止过长计算
        if (Date.now() - startTime > timeLimit) {
            break;
        }
    }
    
    return bestMove;
}

// 使用Alpha-Beta剪枝的极小极大搜索
function findBestMoveWithAlphaBeta(player, depth) {
    const opponent = player === 'white' ? 'black' : 'white';
    const emptyCells = getEmptyCells();
    let bestMove = null;
    let bestScore = -Infinity;
    let alpha = -Infinity;
    const beta = Infinity;
    
    // 首先考虑威胁位置
    const threatMoves = getAllThreatMoves(player).filter(move => move.score >= PATTERN_SCORES.THREE_OPEN);
    const potentialMoves = [...threatMoves];
    
    // 加入对手威胁位置
    const opponentThreats = getAllThreatMoves(opponent).filter(move => move.score >= PATTERN_SCORES.THREE_OPEN);
    potentialMoves.push(...opponentThreats);
    
    // 过滤出唯一位置并按分数排序
    const uniqueMoves = Array.from(new Map(potentialMoves.map(move => 
        [`${move.row},${move.col}`, move]
    )).values()).sort((a, b) => b.score - a.score);
    
    // 如果没有威胁位置，考虑所有空位
    const movesToEvaluate = uniqueMoves.length > 0 ? uniqueMoves : emptyCells;
    
    // 限制评估的位置数量
    const maxPositionsToEvaluate = Math.min(12, movesToEvaluate.length);
    
    for (let i = 0; i < maxPositionsToEvaluate; i++) {
        const move = movesToEvaluate[i];
        const { row, col } = move;
        
        // 临时放置棋子
        gameBoard[row][col] = player;
        
        // 检查是否获胜
        if (checkWin(row, col, player)) {
            gameBoard[row][col] = null;
            return move;
        }
        
        // 递归评估
        const score = alphaBetaMinimize(opponent, depth - 1, alpha, beta);
        
        // 撤销临时放置
        gameBoard[row][col] = null;
        
        // 更新最佳分数
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
            alpha = Math.max(alpha, bestScore);
        }
    }
    
    return bestMove;
}

// Alpha-Beta极小化
function alphaBetaMinimize(player, depth, alpha, beta) {
    // 终止条件
    if (depth === 0) {
        return evaluateBoardForWhite();
    }
    
    const opponent = player === 'white' ? 'black' : 'white';
    const emptyCells = getEmptyCells();
    let minScore = Infinity;
    
    // 过滤和排序移动位置
    const threatMoves = getAllThreatMoves(player).filter(move => move.score >= PATTERN_SCORES.THREE_OPEN);
    const opponentThreats = getAllThreatMoves(opponent).filter(move => move.score >= PATTERN_SCORES.THREE_OPEN);
    
    let movesToEvaluate;
    if (threatMoves.length > 0 || opponentThreats.length > 0) {
        // 合并并过滤出唯一位置
        const potentialMoves = [...threatMoves, ...opponentThreats];
        movesToEvaluate = Array.from(new Map(potentialMoves.map(move => 
            [`${move.row},${move.col}`, move]
        )).values()).sort((a, b) => b.score - a.score);
    } else {
        movesToEvaluate = emptyCells;
    }
    
    // 限制评估的位置数量
    const maxPositionsToEvaluate = Math.min(10, movesToEvaluate.length);
    
    for (let i = 0; i < maxPositionsToEvaluate; i++) {
        const move = movesToEvaluate[i];
        const { row, col } = move;
        
        // 临时放置棋子
        gameBoard[row][col] = player;
        
        // 检查是否获胜
        if (checkWin(row, col, player)) {
            gameBoard[row][col] = null;
            return -10000; // 玩家获胜，对AI是极坏结果
        }
        
        // 递归评估
        const score = alphaBetaMaximize(opponent, depth - 1, alpha, beta);
        
        // 撤销临时放置
        gameBoard[row][col] = null;
        
        // 更新最小分数
        minScore = Math.min(minScore, score);
        beta = Math.min(beta, minScore);
        
        // Alpha-Beta剪枝
        if (beta <= alpha) {
            break;
        }
    }
    
    return minScore;
}

// Alpha-Beta极大化
function alphaBetaMaximize(player, depth, alpha, beta) {
    // 终止条件
    if (depth === 0) {
        return evaluateBoardForWhite();
    }
    
    const opponent = player === 'white' ? 'black' : 'white';
    const emptyCells = getEmptyCells();
    let maxScore = -Infinity;
    
    // 过滤和排序移动位置
    const threatMoves = getAllThreatMoves(player).filter(move => move.score >= PATTERN_SCORES.THREE_OPEN);
    const opponentThreats = getAllThreatMoves(opponent).filter(move => move.score >= PATTERN_SCORES.THREE_OPEN);
    
    let movesToEvaluate;
    if (threatMoves.length > 0 || opponentThreats.length > 0) {
        // 合并并过滤出唯一位置
        const potentialMoves = [...threatMoves, ...opponentThreats];
        movesToEvaluate = Array.from(new Map(potentialMoves.map(move => 
            [`${move.row},${move.col}`, move]
        )).values()).sort((a, b) => b.score - a.score);
    } else {
        movesToEvaluate = emptyCells;
    }
    
    // 限制评估的位置数量
    const maxPositionsToEvaluate = Math.min(10, movesToEvaluate.length);
    
    for (let i = 0; i < maxPositionsToEvaluate; i++) {
        const move = movesToEvaluate[i];
        const { row, col } = move;
        
        // 临时放置棋子
        gameBoard[row][col] = player;
        
        // 检查是否获胜
        if (checkWin(row, col, player)) {
            gameBoard[row][col] = null;
            return 10000; // AI获胜，是极好结果
        }
        
        // 递归评估
        const score = alphaBetaMinimize(opponent, depth - 1, alpha, beta);
        
        // 撤销临时放置
        gameBoard[row][col] = null;
        
        // 更新最大分数
        maxScore = Math.max(maxScore, score);
        alpha = Math.max(alpha, maxScore);
        
        // Alpha-Beta剪枝
        if (beta <= alpha) {
            break;
        }
    }
    
    return maxScore;
}

// 评估棋盘状态（从白方/AI角度）
function evaluateBoardForWhite() {
    let score = 0;
    
    // 评估每个位置
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (gameBoard[i][j] === 'white') {
                score += evaluatePositionPatterns(i, j, 'white');
                score += getPositionValue(i, j);
            } else if (gameBoard[i][j] === 'black') {
                score -= evaluatePositionPatterns(i, j, 'black');
                score -= getPositionValue(i, j);
            }
        }
    }
    
    return score;
}

// 基于位置的价值评估
function getPositionValue(row, col) {
    // 中心价值最高，边缘价值较低
    const centerRow = Math.floor(boardSize / 2);
    const centerCol = Math.floor(boardSize / 2);
    
    // 计算到中心的距离
    const distanceToCenter = Math.sqrt(
        Math.pow(row - centerRow, 2) + 
        Math.pow(col - centerCol, 2)
    );
    
    // 距离中心越远，价值越低
    return Math.max(0, 20 - distanceToCenter * 2);
}

// 寻找评分最高的位置
function findBestScoringMove(player) {
    const emptyCells = getEmptyCells();
    let bestMove = null;
    let bestScore = -Infinity;
    
    for (const move of emptyCells) {
        // 临时放置棋子
        gameBoard[move.row][move.col] = player;
        
        // 计算此位置的棋型评分
        const patternScore = evaluatePositionPatterns(move.row, move.col, player);
        // 计算位置价值
        const positionValue = getPositionValue(move.row, move.col);
        // 计算防守价值
        let defenseValue = 0;
        
        // 评估防守价值
        const opponent = player === 'white' ? 'black' : 'white';
        gameBoard[move.row][move.col] = opponent;
        defenseValue = evaluatePositionPatterns(move.row, move.col, opponent) * 0.8; // 防守评分略低
        
        // 恢复为player
        gameBoard[move.row][move.col] = player;
        
        // 总分
        const totalScore = patternScore + positionValue + defenseValue;
        
        // 撤销临时放置
        gameBoard[move.row][move.col] = null;
        
        // 更新最佳分数
        if (totalScore > bestScore) {
            bestScore = totalScore;
            bestMove = move;
        }
    }
    
    return bestMove;
}

// 寻找基本防守位置
function findBasicDefensiveMove() {
    // 遍历棋盘寻找玩家的连续三子
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (gameBoard[i][j] === 'black') {
                // 检查各个方向
                const directions = [
                    [0, 1],  // 水平
                    [1, 0],  // 垂直
                    [1, 1],  // 对角线
                    [1, -1]  // 反对角线
                ];
                
                for (const [dx, dy] of directions) {
                    // 检查是否有连续三子
                    if (countConsecutiveStones(i, j, dx, dy, 'black') >= 3) {
                        // 找出两端的空位
                        const move = findEmptyEndOfLine(i, j, dx, dy, 'black');
                        if (move) return move;
                    }
                }
            }
        }
    }
    
    return null;
}

// 计算连续棋子数
function countConsecutiveStones(row, col, dx, dy, player) {
    let count = 1; // 包括起始位置
    
    // 向一个方向计数
    for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        
        if (isValidPosition(newRow, newCol) && gameBoard[newRow][newCol] === player) {
            count++;
        } else {
            break;
        }
    }
    
    // 向相反方向计数
    for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        
        if (isValidPosition(newRow, newCol) && gameBoard[newRow][newCol] === player) {
            count++;
        } else {
            break;
        }
    }
    
    return count;
}

// 寻找连线末端的空位
function findEmptyEndOfLine(row, col, dx, dy, player) {
    // 向一个方向查找空位
    let i = 1;
    while (i < 5) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        
        if (!isValidPosition(newRow, newCol)) {
            break;
        }
        
        if (gameBoard[newRow][newCol] !== player) {
            if (gameBoard[newRow][newCol] === null) {
                return { row: newRow, col: newCol };
            }
            break;
        }
        
        i++;
    }
    
    // 向相反方向查找空位
    i = 1;
    while (i < 5) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        
        if (!isValidPosition(newRow, newCol)) {
            break;
        }
        
        if (gameBoard[newRow][newCol] !== player) {
            if (gameBoard[newRow][newCol] === null) {
                return { row: newRow, col: newCol };
            }
            break;
        }
        
        i++;
    }
    
    return null;
}

// 寻找有利位置
function findGoodMove() {
    const moves = getEmptyCells();
    let bestMove = null;
    let bestScore = -Infinity;
    
    for (const move of moves) {
        // 临时放置棋子
        gameBoard[move.row][move.col] = 'white';
        
        // 评估位置分数
        const score = evaluatePositionPatterns(move.row, move.col, 'white');
        
        // 撤销临时放置
        gameBoard[move.row][move.col] = null;
        
        // 更新最佳分数
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    return bestMove;
}

// 随机移动
function getRandomMove() {
    const emptyCells = getEmptyCells();
    
    if (emptyCells.length === 0) {
        return null;
    }
    
    const randomIndex = Math.floor(Math.random() * emptyCells.length);
    return emptyCells[randomIndex];
}

// 获取所有空白单元格
function getEmptyCells() {
    const emptyCells = [];
    
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (gameBoard[i][j] === null) {
                emptyCells.push({ row: i, col: j });
            }
        }
    }
    
    return emptyCells;
}

// 计算棋盘上的棋子数量
function countStones() {
    let count = 0;
    
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (gameBoard[i][j] !== null) {
                count++;
            }
        }
    }
    
    return count;
}

// 显示确认对话框
function showConfirmDialog(message, confirmCallback) {
    const dialog = document.getElementById('confirm-dialog');
    const messageElement = document.getElementById('confirm-message');
    const yesButton = document.getElementById('confirm-yes');
    const noButton = document.getElementById('confirm-no');

    // 设置消息内容
    messageElement.textContent = message;
    
    // 确保对话框正确显示
    dialog.style.display = 'flex';
    dialog.style.alignItems = 'center';
    dialog.style.justifyContent = 'center';
    
    // 清除可能的内联样式
    const dialogContent = dialog.querySelector('.dialog-content');
    dialogContent.style.position = 'relative';
    dialogContent.style.left = '';
    dialogContent.style.top = '';
    dialogContent.style.transform = '';
    
    // 阻止对话框内容区域的点击事件冒泡
    dialogContent.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // 处理响应的函数
    const handleResponse = (confirmed) => {
        dialog.style.display = 'none';
        if (confirmed && confirmCallback) {
            confirmCallback();
        }
        
        // 移除事件监听器
        yesButton.removeEventListener('click', yesHandler);
        noButton.removeEventListener('click', noHandler);
        dialog.removeEventListener('click', dialogClickHandler);
    };

    // 事件处理函数
    const yesHandler = () => handleResponse(true);
    const noHandler = () => handleResponse(false);
    const dialogClickHandler = (e) => {
        if (e.target === dialog) {
            handleResponse(false);
        }
    };

    // 绑定事件
    yesButton.addEventListener('click', yesHandler);
    noButton.addEventListener('click', noHandler);
    dialog.addEventListener('click', dialogClickHandler);
    
    // 调试信息
    console.log('对话框已显示', {
        dialogDisplay: dialog.style.display,
        dialogContentStyles: {
            position: dialogContent.style.position,
            width: dialogContent.style.width,
            maxWidth: dialogContent.style.maxWidth
        }
    });
}

// 响应窗口大小变化
window.addEventListener('resize', function() {
    // 保存当前棋盘状态
    const currentBoardState = gameBoard.map(row => [...row]);
    const currentGameOver = gameOver;
    const currentPlayerState = currentPlayer;
    
    // 重新初始化界面
    initGame();
    
    // 恢复棋盘状态
    for (let i = 0; i < boardSize; i++) {
        for (let j = 0; j < boardSize; j++) {
            if (currentBoardState[i] && currentBoardState[i][j]) {
                placeStone(i, j, currentBoardState[i][j]);
            }
        }
    }
    
    // 恢复游戏状态
    gameOver = currentGameOver;
    currentPlayer = currentPlayerState;
    
    if (gameOver) {
        // 恢复获胜消息
        const blackWon = currentBoardState.some((row, i) => 
            row.some((cell, j) => cell === 'black' && checkWin(i, j, 'black'))
        );
        const whiteWon = currentBoardState.some((row, i) => 
            row.some((cell, j) => cell === 'white' && checkWin(i, j, 'white'))
        );
        
        if (blackWon) {
            showWinner('black');
        } else if (whiteWon) {
            showWinner('white');
        } else if (checkDraw()) {
            showDraw();
        }
    }
});

// 添加事件监听
document.addEventListener('DOMContentLoaded', function() {
    // 确保重置按钮事件监听只绑定一次
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        // 移除所有已有的事件监听器
        const clonedBtn = resetBtn.cloneNode(true);
        resetBtn.parentNode.replaceChild(clonedBtn, resetBtn);
        
        // 添加新的事件监听器
        clonedBtn.addEventListener('click', function() {
            if (!isBoardEmpty()) {
                showConfirmDialog('确定要重新开始游戏吗？', resetGame);
            } else {
                resetGame();
            }
        });
    }
    
    // 初始化游戏
    initGame();
});

// 移除旧的事件监听器并更新为新的DOMContentLoaded事件
const oldResetListener = document.getElementById('reset-btn').onclick;
if (oldResetListener) {
    document.getElementById('reset-btn').removeEventListener('click', oldResetListener);
}

// 更新window.onload以避免多次初始化
const oldOnload = window.onload;
window.onload = function() {
    if (oldOnload && typeof oldOnload === 'function') {
        oldOnload();
    }
    
    // 确保只初始化一次
    if (!window.gameInitialized) {
        initGame();
        window.gameInitialized = true;
    }
};

