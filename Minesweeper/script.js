class Minesweeper {
    constructor() {
        this.board = null;
        this.rows = 0;
        this.cols = 0;
        this.mines = 0;
        this.flags = 0;
        this.time = 0;
        this.timer = null;
        this.gameOver = false;
        this.firstClick = true;
        this.language = 'en';
        this.difficulty = 'medium';
        
        this.i18n = {
            en: {
                title: "Minesweeper",
                easy: "Easy",
                medium: "Medium",
                hard: "Hard",
                newGame: "New Game",
                flags: "Flags",
                time: "Time",
                win: "You Win!",
                lose: "Game Over",
                restart: "Restart",
                instructions: "How to Play",
                instructionsPC: "• Left click: Reveal a cell\n• Right click: Place/Remove a flag",
                instructionsMobile: "• Tap: Reveal a cell\n• Long press: Place/Remove a flag",
                close: "Close"
            },
            zh: {
                title: "扫雷游戏",
                easy: "简单",
                medium: "中等",
                hard: "困难",
                newGame: "新游戏",
                flags: "旗帜",
                time: "时间",
                win: "你赢了！",
                lose: "游戏结束",
                restart: "重新开始",
                instructions: "游戏说明",
                instructionsPC: "• 鼠标左键：揭开方块\n• 鼠标右键：放置/移除旗帜",
                instructionsMobile: "• 点击：揭开方块\n• 长按：放置/移除旗帜",
                close: "关闭"
            }
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setLanguage('en');
        this.startNewGame();
    }

    setupEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => this.startNewGame());
        document.getElementById('difficulty').addEventListener('change', (e) => {
            this.difficulty = e.target.value;
            this.startNewGame();
        });
        document.getElementById('language').addEventListener('change', (e) => {
            this.setLanguage(e.target.value);
        });

        // 添加游戏说明事件监听
        const instructionsModal = document.getElementById('instructions-modal');
        document.getElementById('show-instructions').addEventListener('click', () => {
            instructionsModal.style.display = 'flex';
        });
        document.getElementById('close-instructions').addEventListener('click', () => {
            instructionsModal.style.display = 'none';
        });
        
        // 点击模态框外部关闭
        instructionsModal.addEventListener('click', (e) => {
            if (e.target === instructionsModal) {
                instructionsModal.style.display = 'none';
            }
        });
    }

    setLanguage(lang) {
        this.language = lang;
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.i18n[lang][key] || key;
        });
    }

    startNewGame() {
        this.gameOver = false;
        this.firstClick = true;
        this.flags = 0;
        this.time = 0;
        clearInterval(this.timer);
        this.updateTimer();
        
        this.setDifficulty();
        this.generateBoard();
        this.renderBoard();
    }

    setDifficulty() {
        switch(this.difficulty) {
            case 'easy':
                this.rows = 8;
                this.cols = 8;
                this.mines = 10;
                break;
            case 'medium':
                this.rows = 12;
                this.cols = 12;
                this.mines = 20;
                break;
            case 'hard':
                this.rows = 16;
                this.cols = 16;
                this.mines = 40;
                break;
        }
    }

    generateBoard() {
        this.board = Array.from({ length: this.rows }, () => 
            Array.from({ length: this.cols }, () => ({
                isMine: false,
                revealed: false,
                flagged: false,
                adjacentMines: 0
            }))
        );
    }

    renderBoard() {
        const boardElement = document.querySelector('.game-board');
        boardElement.innerHTML = '';
        boardElement.style.gridTemplateColumns = `repeat(${this.cols}, var(--cell-size))`;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                // 添加点击事件
                cell.addEventListener('click', () => this.handleCellClick(row, col));
                
                // 添加右键点击事件
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    this.toggleFlag(row, col);
                });
                
                // 添加触摸事件
                let longPressTimer;
                let isMoved = false;
                
                cell.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    isMoved = false;
                    longPressTimer = setTimeout(() => {
                        if (!isMoved) {
                            this.toggleFlag(row, col);
                        }
                    }, 500);
                });
                
                cell.addEventListener('touchmove', () => {
                    isMoved = true;
                    clearTimeout(longPressTimer);
                });
                
                cell.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    clearTimeout(longPressTimer);
                    if (!isMoved) {
                        // 如果没有移动且不是长按，则视为点击
                        this.handleCellClick(row, col);
                    }
                });
                
                boardElement.appendChild(cell);
            }
        }
    }

    handleCellClick(row, col) {
        if (this.gameOver || this.board[row][col].flagged) return;
        
        if (this.firstClick) {
            this.placeMines(row, col);
            this.calculateAdjacentMines();
            this.startTimer();
            this.firstClick = false;
        }

        if (this.board[row][col].isMine) {
            this.gameOver = true;
            this.revealAllMines();
            this.showGameOverModal(false);
            return;
        }

        this.revealCell(row, col);
        if (this.checkWin()) {
            this.gameOver = true;
            this.showGameOverModal(true);
        }
    }

    showGameOverModal(won) {
        const modal = document.getElementById('game-over-modal');
        const modalContent = modal.querySelector('.modal-content');
        const title = document.getElementById('game-result-title');
        const finalTime = document.getElementById('final-time');
        const finalFlags = document.getElementById('final-flags');
        
        // Set modal content
        title.textContent = this.i18n[this.language][won ? 'win' : 'lose'];
        finalTime.textContent = this.time;
        finalFlags.textContent = this.flags;
        
        // Set modal class
        modalContent.classList.remove('win', 'lose');
        modalContent.classList.add(won ? 'win' : 'lose');
        
        // Show modal
        modal.style.display = 'flex';
        
        // Setup button event listeners
        document.getElementById('play-again').onclick = () => {
            modal.style.display = 'none';
            this.startNewGame();
        };
        
        document.getElementById('main-menu').onclick = () => {
            modal.style.display = 'none';
            this.setLanguage(this.language); // Refresh language
        };
    }

    placeMines(safeRow, safeCol) {
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            if (!this.board[row][col].isMine && 
                !(row === safeRow && col === safeCol)) {
                this.board[row][col].isMine = true;
                minesPlaced++;
            }
        }
    }

    calculateAdjacentMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (!this.board[row][col].isMine) {
                    this.board[row][col].adjacentMines = this.countAdjacentMines(row, col);
                }
            }
        }
    }

    countAdjacentMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows &&
                    newCol >= 0 && newCol < this.cols &&
                    this.board[newRow][newCol].isMine) {
                    count++;
                }
            }
        }
        return count;
    }

    revealCell(row, col) {
        const cell = this.board[row][col];
        if (cell.revealed) return;
        
        cell.revealed = true;
        const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cellElement.classList.add('revealed');
        
        if (cell.adjacentMines > 0) {
            cellElement.textContent = cell.adjacentMines;
        } else {
            // Reveal adjacent cells if no adjacent mines
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    const newRow = row + i;
                    const newCol = col + j;
                    if (newRow >= 0 && newRow < this.rows &&
                        newCol >= 0 && newCol < this.cols) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
    }

    toggleFlag(row, col) {
        if (this.gameOver || this.board[row][col].revealed) return;
        
        const cell = this.board[row][col];
        cell.flagged = !cell.flagged;
        this.flags += cell.flagged ? 1 : -1;
        
        const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
        cellElement.classList.toggle('flagged');
        
        document.getElementById('flag-count').textContent = this.flags;
    }

    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col].isMine) {
                    const cellElement = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
                    cellElement.classList.add('mine');
                }
            }
        }
    }

    checkWin() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.board[row][col];
                if (!cell.isMine && !cell.revealed) {
                    return false;
                }
            }
        }
        return true;
    }

    startTimer() {
        this.timer = setInterval(() => {
            this.time++;
            this.updateTimer();
        }, 1000);
    }

    updateTimer() {
        document.getElementById('timer').textContent = this.time;
    }
}

// Initialize game
const game = new Minesweeper();
