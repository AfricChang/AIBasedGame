// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    // DOM元素
    const board = document.querySelector('.board');
    const points = document.querySelectorAll('.point');
    const resetButton = document.getElementById('resetButton');
    const winDialog = document.getElementById('winDialog');
    const winMessage = document.getElementById('winMessage');
    const playAgainButton = document.getElementById('playAgain');
    const closeDialogButton = document.getElementById('closeDialog');
    const phaseText = document.querySelector('.phase-text');
    const currentPlayerText = document.querySelector('.current-player');
    const player1Info = document.querySelector('.player1-info');
    const player2Info = document.querySelector('.player2-info');
    const player1PieceCount = player1Info.querySelector('.piece-count');
    const player2PieceCount = player2Info.querySelector('.piece-count');

    // 游戏状态
    let currentPlayer = 'player1';
    let gamePhase = 'placing';
    const PIECES_PER_PLAYER = 9;
    // 玩家一二初始棋子个数
    let player1InitCount = PIECES_PER_PLAYER;
    let player2InitCount = PIECES_PER_PLAYER;

    let selectedPiece = null;
    let isCapturing = false;

    // 更新游戏状态显示
    function updateGameStatus() {
        phaseText.textContent = gamePhase === 'placing' ? '放置阶段' : '移动阶段';
        currentPlayerText.textContent = `当前回合: ${currentPlayer === 'player1' ? '玩家一' : '玩家二'}`;
        player1Info.classList.toggle('active', currentPlayer === 'player1');
        player2Info.classList.toggle('active', currentPlayer === 'player2');

        let player1Pieces = 0;
        let player2Pieces = 0;
        points.forEach(point => {
            if (point.classList.contains('player1')) player1Pieces++;
            if (point.classList.contains('player2')) player2Pieces++;
        });

        player1PieceCount.textContent = `棋子: ${player1Pieces}`;
        player2PieceCount.textContent = `棋子: ${player2Pieces}`;

        // 检查胜利条件
        if (gamePhase === 'placing') {
            if (player2Pieces + player2InitCount <= 2) {
                showWinDialog('玩家一胜利！');
            }
            // 检查是否进入移动阶段
            if (player1InitCount === 0 && player2InitCount === 0) {
                gamePhase = 'moving';
            }
        } else {
            if (player1Pieces <= 2) {
                showWinDialog('玩家二胜利！');
            } else if (player2Pieces <= 2) {
                showWinDialog('玩家一胜利！');
            }
        }
    }

    // 检查三连
    function checkLine() {
        const winCombinations = [
            // 外圈三连
            [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
            // 中圈三连
            [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
            // 内圈三连
            [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
            // 外到内的连线
            [0, 8, 16], [1, 9, 17], [2, 10, 18], [3, 11, 19],
            [4, 12, 20], [5, 13, 21], [6, 14, 22], [7, 15, 23]
        ];

        return winCombinations.some(combination => {
            const [a, b, c] = combination;
            const pointA = document.querySelector(`.point[data-index="${a}"]`);
            const pointB = document.querySelector(`.point[data-index="${b}"]`);
            const pointC = document.querySelector(`.point[data-index="${c}"]`);

            return pointA && pointB && pointC &&
                pointA.classList.contains(currentPlayer) &&
                pointB.classList.contains(currentPlayer) &&
                pointC.classList.contains(currentPlayer);
        });
    }

    // 找出所有三连组合
    function findLines(player) {
        const winCombinations = [
            [0, 1, 2], [2, 3, 4], [4, 5, 6], [6, 7, 0],
            [8, 9, 10], [10, 11, 12], [12, 13, 14], [14, 15, 8],
            [16, 17, 18], [18, 19, 20], [20, 21, 22], [22, 23, 16],
            [0, 8, 16], [1, 9, 17], [2, 10, 18], [3, 11, 19],
            [4, 12, 20], [5, 13, 21], [6, 14, 22], [7, 15, 23]
        ];

        return winCombinations.filter(combination => {
            const [a, b, c] = combination;
            const pointA = document.querySelector(`.point[data-index="${a}"]`);
            const pointB = document.querySelector(`.point[data-index="${b}"]`);
            const pointC = document.querySelector(`.point[data-index="${c}"]`);

            return pointA && pointB && pointC &&
                pointA.classList.contains(player) &&
                pointB.classList.contains(player) &&
                pointC.classList.contains(player);
        });
    }

    // 检查是否是三连的一部分
    function isPartOfLine(point, player) {
        const lines = findLines(player);
        const index = parseInt(point.dataset.index);
        return lines.some(line => line.includes(index));
    }

    // 启用吃子模式
    function enableCapture() {
        const oppositePlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
        isCapturing = true;

        let hasNonLinePoint = false;
        points.forEach(point => {
            if (point.classList.contains(oppositePlayer) && !isPartOfLine(point, oppositePlayer)) {
                hasNonLinePoint = true;
            }
        });

        points.forEach(point => {
            if (point.classList.contains(oppositePlayer)) {
                if (!hasNonLinePoint || !isPartOfLine(point, oppositePlayer)) {
                    point.classList.add('capturable');
                    point.addEventListener('click', capturePiece);
                }
            }
        });
    }

    // 吃子函数
    function capturePiece(event) {
        if (!isCapturing) return;

        const point = event.target;
        const oppositePlayer = currentPlayer === 'player1' ? 'player2' : 'player1';

        // 从棋盘中移除对方棋子
        point.classList.remove(oppositePlayer);

        // 移除所有可吃子标记和事件
        points.forEach(p => {
            p.classList.remove('capturable');
            p.removeEventListener('click', capturePiece);
        });

        isCapturing = false;

        // 检查胜利条件
        let opponentPieces = 0;
        points.forEach(point => {
            if (point.classList.contains(oppositePlayer)) {
                opponentPieces++;
            }
        });

        let nTotal = opponentPieces + (currentPlayer === 'player1' ? player2InitCount : player1InitCount);
        if (nTotal <= 2) {
            showWinDialog(`${currentPlayer === 'player1' ? '玩家一' : '玩家二'}胜利！`);
            return;
        }

        // 切换玩家
        currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
        updateGameStatus();
    }

    // 切换玩家
    function switchPlayer() {
        currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
        updateGameStatus();
    }

    // 落子函数（放置阶段）
    function placePiece(point) {
        if (isCapturing) return; // 吃子模式下不能落子

        if (!point.classList.contains('player1') && !point.classList.contains('player2')) {
            point.classList.add(currentPlayer);

            if (currentPlayer === 'player1') {
                player1InitCount--;
            } else {
                player2InitCount--;
            }

            // 检查是否形成三连
            if (checkLine()) {
                enableCapture();
                return; // 等待选择要吃掉的子
            }

            // 检查是否进入移动阶段
            if (player1InitCount === 0 && player2InitCount === 0) {
                gamePhase = 'moving';
            }

            // 切换玩家
            currentPlayer = currentPlayer === 'player1' ? 'player2' : 'player1';
            updateGameStatus();
        }
    }

    // 检查移动是否有效
    function isValidMove(from, to) {
        if (to.classList.contains('player1') || to.classList.contains('player2')) {
            return false;
        }

        const fromIndex = parseInt(from.dataset.index);
        const toIndex = parseInt(to.dataset.index);

        // 定义相邻点的映射
        const adjacentPoints = {
            0: [1, 7, 8], 1: [0, 2, 9], 2: [1, 3, 10], 3: [2, 4, 11],
            4: [3, 5, 12], 5: [4, 6, 13], 6: [5, 7, 14], 7: [6, 0, 15],
            8: [0, 9, 15, 16], 9: [1, 8, 10, 17], 10: [2, 9, 11, 18],
            11: [3, 10, 12, 19], 12: [4, 11, 13, 20], 13: [5, 12, 14, 21],
            14: [6, 13, 15, 22], 15: [7, 14, 8, 23], 16: [8, 17, 23],
            17: [9, 16, 18], 18: [10, 17, 19], 19: [11, 18, 20],
            20: [12, 19, 21], 21: [13, 20, 22], 22: [14, 21, 23],
            23: [15, 22, 16]
        };

        return adjacentPoints[fromIndex].includes(toIndex);
    }

    // 处理移动阶段的点击
    function handleMovingPhase(point) {
        if (isCapturing) return; // 吃子模式下不能移动

        if (!selectedPiece) {
            if (point.classList.contains(currentPlayer)) {
                selectedPiece = point;
                point.classList.add('selected');
            }
        } else {
            if (isValidMove(selectedPiece, point)) {
                point.classList.add(currentPlayer);
                selectedPiece.classList.remove(currentPlayer, 'selected');
                selectedPiece = null;

                // 检查是否形成三连
                if (checkLine()) {
                    enableCapture();
                    return; // 等待选择要吃掉的子
                }

                if (!hasValidMoves(currentPlayer === 'player1' ? 'player2' : 'player1')) {
                    showWinDialog(`${currentPlayer === 'player1' ? '玩家一' : '玩家二'}胜利！对方无棋可走`);
                    return;
                }

                switchPlayer();
                updateGameStatus();
            } else {
                selectedPiece.classList.remove('selected');
                selectedPiece = null;
            }
        }
    }

    // 检查是否有可移动的位置
    function hasValidMoves(player) {
        const playerPieces = Array.from(points).filter(point =>
            point.classList.contains(player)
        );

        return playerPieces.some(piece => {
            return Array.from(points).some(target => {
                if (target.classList.contains('player1') ||
                    target.classList.contains('player2')) {
                    return false;
                }
                return isValidMove(piece, target);
            });
        });
    }

    // 显示胜利对话框
    function showWinDialog(message) {
        winMessage.textContent = message;
        winDialog.style.display = 'flex';
    }

    // 隐藏胜利对话框
    function hideWinDialog() {
        winDialog.style.display = 'none';
    }

    // 重置游戏
    function resetGame() {
        points.forEach(point => {
            point.classList.remove('player1', 'player2', 'selected', 'capturable');
            point.removeEventListener('click', capturePiece);
        });
        currentPlayer = 'player1';
        gamePhase = 'placing';
        player1InitCount = PIECES_PER_PLAYER;
        player2InitCount = PIECES_PER_PLAYER;
        selectedPiece = null;
        isCapturing = false;
        hideWinDialog();
        updateGameStatus();
    }

    // 绑定事件
    board.addEventListener('click', (e) => {
        if (e.target.classList.contains('point')) {
            if (gamePhase === 'placing') {
                if (isCapturing) {
                    capturePiece(e);
                }
                else {
                    placePiece(e.target);
                }
            } else if (gamePhase === 'moving') {
                if (isCapturing) {
                    capturePiece(e);
                } else {
                    handleMovingPhase(e.target);
                }
            }
        }
    });

    resetButton.addEventListener('click', resetGame);
    playAgainButton.addEventListener('click', resetGame);
    closeDialogButton.addEventListener('click', hideWinDialog);
    winDialog.addEventListener('click', (e) => {
        if (e.target === winDialog) {
            hideWinDialog();
        }
    });

    // 初始化游戏状态
    updateGameStatus();
});
