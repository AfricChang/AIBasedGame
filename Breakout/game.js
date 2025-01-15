// 获取画布元素
const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

// 游戏状态
let score = 0;
let highScore = localStorage.getItem('breakoutHighScore') || 0;
let lives = 3;
let paused = false;
let gameStarted = false;
let gameOver = false;
let currentDifficulty = localStorage.getItem('difficulty') || 'normal';

// 移动控制状态
let rightPressed = false;
let leftPressed = false;
let isMobileControl = false;  // 用于区分是否是移动端控制

// 速度设置
const PADDLE_SPEED = 5;        // 键盘控制速度
const MOBILE_PADDLE_SPEED = 2; // 移动端控制速度

// 设置画布大小
function resizeCanvas() {
    const container = canvas.parentElement;
    const maxWidth = 480;
    const width = Math.min(container.clientWidth - 40, maxWidth);
    const height = width * (3/4);  // 改为3/4的宽高比，使画面更高
    
    canvas.width = width;
    canvas.height = height;
    
    // 重置球和挡板位置
    if (gameStarted) {
        resetBallAndPaddle();
    }
}

// 游戏配置
const difficultySettings = {
    easy: {
        ballSpeed: 2,
        paddleWidth: 100,
        lives: 5,
        description: '球速慢，挡板较宽，5条生命'
    },
    normal: {
        ballSpeed: 2.5,
        paddleWidth: 75,
        lives: 3,
        description: '中等速度，标准挡板，3条生命'
    },
    hard: {
        ballSpeed: 3,
        paddleWidth: 50,
        lives: 2,
        description: '球速较快，窄挡板，2条生命'
    }
};

// 球对象
const ball = {
    x: canvas.width/2,
    y: canvas.height,  // 让球的起始位置离底部更远，从50改为0
    dx: 4,
    dy: -4,
    radius: 8
};

// 挡板对象
const paddle = {
    width: 75,
    height: 10,
    x: (canvas.width-75)/2
};

// 砖块配置
const brickRowCount = 5;
const brickColumnCount = 8;
const brickWidth = 50;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 0;     // 增加顶部偏移，从50改为0
const brickOffsetLeft = 30;

// 砖块颜色
const brickColors = [
    '#FF5252', // 红色
    '#FF9800', // 橙色
    '#FFEB3B', // 黄色
    '#4CAF50', // 绿色
    '#2196F3'  // 蓝色
];

// 初始化砖块
let bricks = [];
function initializeBricks() {
    const containerWidth = canvas.width - 40;
    const brickWidth = (containerWidth - (brickColumnCount + 1) * brickPadding) / brickColumnCount;
    
    for(let c=0; c < brickColumnCount; c++) {
        bricks[c] = [];
        for(let r=0; r < brickRowCount; r++) {
            bricks[c][r] = { 
                x: 0, 
                y: 0, 
                status: 1,
                color: brickColors[r]
            };
        }
    }
}

// 事件监听器
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("mousemove", mouseMoveHandler, false);
canvas.addEventListener("touchmove", touchMoveHandler, false);

// 初始化画布大小
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 按钮事件监听
const playButton = document.getElementById('playButton');
const restartButton = document.getElementById('restartButton');
const instructionsButton = document.getElementById('instructionsButton');
const settingsButton = document.getElementById('settingsButton');
const backButtons = document.querySelectorAll('.back-button');
const difficultySelect = document.getElementById('difficulty');
const difficultyDesc = document.getElementById('difficultyDesc');

// 更新难度描述
function updateDifficultyDescription() {
    const desc = difficultySettings[currentDifficulty].description;
    if (difficultyDesc) {
        difficultyDesc.textContent = desc;
    }
}

// 菜单控制
function showScreen(screenId) {
    document.querySelectorAll('.menu-screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    if (screenId) {
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.add('active');
        }
    }
}

// 事件处理函数
function keyDownHandler(e) {
    if(e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = true;
        isMobileControl = false;
    }
    else if(e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = true;
        isMobileControl = false;
    }
    else if(e.key === "p" || e.key === "P") {
        togglePause();
    }
}

function keyUpHandler(e) {
    if(e.key === "Right" || e.key === "ArrowRight") {
        rightPressed = false;
    }
    else if(e.key === "Left" || e.key === "ArrowLeft") {
        leftPressed = false;
    }
}

function mouseMoveHandler(e) {
    if (gameStarted && !gameOver && !paused) {
        const relativeX = e.clientX - canvas.offsetLeft;
        if(relativeX > paddle.width/2 && relativeX < canvas.width - paddle.width/2) {
            paddle.x = relativeX - paddle.width/2;
        }
    }
}

function touchMoveHandler(e) {
    if (gameStarted && !gameOver && !paused) {
        e.preventDefault();
        const relativeX = e.touches[0].clientX - canvas.offsetLeft;
        if(relativeX > paddle.width/2 && relativeX < canvas.width - paddle.width/2) {
            paddle.x = relativeX - paddle.width/2;
        }
    }
}

// 游戏功能函数
function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI*2);
    ctx.fillStyle = "#FFF";
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddle.x, canvas.height-paddle.height, paddle.width, paddle.height);
    ctx.fillStyle = "#4CAF50";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    const brickWidth = (canvas.width - (brickColumnCount + 1) * brickPadding) / brickColumnCount;
    
    for(let c=0; c < brickColumnCount; c++) {
        for(let r=0; r < brickRowCount; r++) {
            if(bricks[c][r].status === 1) {
                const brickX = (c * (brickWidth + brickPadding)) + brickPadding;
                const brickY = (r * (brickHeight + brickPadding)) + brickPadding + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                
                ctx.beginPath();
                ctx.rect(brickX, brickY, brickWidth, brickHeight);
                ctx.fillStyle = bricks[c][r].color;
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function updateScore() {
    // 获取分数和生命值的容器
    const scoreSpan = document.getElementById('score');
    const livesSpan = document.getElementById('lives');
    
    if (scoreSpan) {
        scoreSpan.textContent = score;
        // 更新分数文本
        const scoreText = document.querySelector('.score');
        if (scoreText) {
            scoreText.innerHTML = `${t('score')}: <span id="score">${score}</span>`;
        }
    }
    
    if (livesSpan) {
        livesSpan.textContent = lives;
        // 更新生命值文本
        const livesText = document.querySelector('.lives');
        if (livesText) {
            livesText.innerHTML = `${t('lives')}: <span id="lives">${lives}</span>`;
        }
    }
}

function collisionDetection() {
    const brickWidth = (canvas.width - (brickColumnCount + 1) * brickPadding) / brickColumnCount;
    
    for(let c=0; c < brickColumnCount; c++) {
        for(let r=0; r < brickRowCount; r++) {
            const b = bricks[c][r];
            if(b.status === 1) {
                if(ball.x > b.x && ball.x < b.x + brickWidth && ball.y > b.y && ball.y < b.y + brickHeight) {
                    ball.dy = -ball.dy;
                    b.status = 0;
                    score += 10;
                    updateScore();
                    
                    if(score === brickRowCount * brickColumnCount * 10) {
                        showGameOver(true);
                    }
                }
            }
        }
    }
}

function resetGame() {
    const settings = difficultySettings[currentDifficulty];
    score = 0;
    lives = settings.lives;
    paddle.width = settings.paddleWidth;
    ball.dx = ball.dx > 0 ? settings.ballSpeed : -settings.ballSpeed;
    ball.dy = -settings.ballSpeed;
    
    gameOver = false;
    paused = false;
    
    initializeBricks();
    resetBallAndPaddle();
    updateScore();
}

function resetBallAndPaddle() {
    ball.x = canvas.width/2;
    ball.y = canvas.height;  // 让球的起始位置离底部更远，从50改为0
    paddle.x = (canvas.width-paddle.width)/2;
}

function showGameOver(won = false) {
    gameOver = true;
    gameStarted = false;
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('breakoutHighScore', highScore);
    }
    
    const finalScoreElement = document.getElementById('finalScore');
    const highScoreElement = document.getElementById('highScore');
    
    if (finalScoreElement && highScoreElement) {
        finalScoreElement.textContent = score;
        highScoreElement.textContent = highScore;
    }
    
    showScreen('gameOverScreen');
}

function togglePause() {
    if (gameStarted && !gameOver) {
        paused = !paused;
        if (!paused) {
            requestAnimationFrame(draw);
        }
    }
}

function draw() {
    if (!gameStarted || gameOver) return;

    if (!paused) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        drawBricks();
        drawBall();
        drawPaddle();
        collisionDetection();

        // 球碰到墙壁
        if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
            ball.dx = -ball.dx;
        }

        // 球碰到顶部
        if (ball.y + ball.dy < ball.radius) {
            ball.dy = -ball.dy;
        }
        // 球碰到底部
        else if (ball.y + ball.dy > canvas.height - ball.radius) {
            // 球碰到挡板
            if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
                // 根据球击中挡板的位置改变反弹角度，但减小角度变化
                let hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
                ball.dx = hitPoint * 3;
                ball.dy = -ball.dy;
            }
            else {
                lives--;
                updateScore();

                if (!lives) {
                    showGameOver(false);
                    return;
                }
                else {
                    resetBallAndPaddle();
                }
            }
        }

        // 移动挡板，区分移动端和键盘控制的速度
        const currentSpeed = isMobileControl ? MOBILE_PADDLE_SPEED : PADDLE_SPEED;
        
        if (rightPressed && paddle.x < canvas.width - paddle.width) {
            paddle.x += currentSpeed;
        }
        else if (leftPressed && paddle.x > 0) {
            paddle.x -= currentSpeed;
        }

        // 移动球
        ball.x += ball.dx;
        ball.y += ball.dy;
    }

    // 绘制暂停状态
    if (paused) {
        ctx.font = "30px Arial";
        ctx.fillStyle = "#FFF";
        ctx.textAlign = "center";
        ctx.fillText(t('paused'), canvas.width / 2, canvas.height / 2);
    }

    requestAnimationFrame(draw);
}

// 初始化游戏
function startGame() {
    gameStarted = true;
    resetGame();
    showScreen(null);
    requestAnimationFrame(draw);
}

// 事件监听
if (playButton) playButton.addEventListener('click', startGame);
if (restartButton) restartButton.addEventListener('click', startGame);

if (instructionsButton) {
    instructionsButton.addEventListener('click', () => {
        showScreen('instructionsScreen');
    });
}

if (settingsButton) {
    settingsButton.addEventListener('click', () => {
        showScreen('settingsScreen');
        updateDifficultyDescription();
    });
}

backButtons.forEach(button => {
    button.addEventListener('click', () => {
        const targetScreen = button.getAttribute('data-screen');
        showScreen(targetScreen);
    });
});

if (difficultySelect) {
    difficultySelect.addEventListener('change', (e) => {
        currentDifficulty = e.target.value;
        localStorage.setItem('difficulty', currentDifficulty);
        updateDifficultyDescription();
    });
}

// 移动端控制
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');

if (leftButton && rightButton) {
    leftButton.addEventListener('touchstart', () => {
        leftPressed = true;
        isMobileControl = true;
    });
    leftButton.addEventListener('touchend', () => {
        leftPressed = false;
        isMobileControl = false;
    });
    rightButton.addEventListener('touchstart', () => {
        rightPressed = true;
        isMobileControl = true;
    });
    rightButton.addEventListener('touchend', () => {
        rightPressed = false;
        isMobileControl = false;
    });

    // 防止移动端滑动时触发页面滚动
    leftButton.addEventListener('touchmove', (e) => e.preventDefault());
    rightButton.addEventListener('touchmove', (e) => e.preventDefault());
}

// 初始化
initializeBricks();
updateScore();
if (difficultySelect) {
    difficultySelect.value = currentDifficulty;
}
updateDifficultyDescription();
showScreen('mainMenu');
