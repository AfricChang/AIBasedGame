// 翻译文本
const translations = {
    zh: {
        score: "分数",
        lives: "生命",
        paused: "已暂停",
        gameOver: "游戏结束",
        finalScore: "最终得分",
        highScore: "最高分",
        playAgain: "再玩一次",
        mainMenu: "主菜单",
        startGame: "开始游戏",
        instructions: "游戏说明",
        settings: "设置",
        back: "返回",
        difficulty: "难度",
        easy: "简单",
        normal: "普通",
        hard: "困难",
        sound: "声音",
        on: "开",
        off: "关",
        language: "语言",
        title: "打砖块游戏",
        difficultySelect: "难度选择",
        instructionsText: [
            "• 使用键盘左右方向键或鼠标移动挡板",
            "• 不要让球落到底部",
            "• 击碎所有砖块即可获胜",
            "• 手机端可使用底部按钮控制"
        ],
        backToMain: "返回主菜单",
        currentScore: "本局得分"
    },
    en: {
        score: "Score",
        lives: "Lives",
        paused: "Paused",
        gameOver: "Game Over",
        finalScore: "Final Score",
        highScore: "High Score",
        playAgain: "Play Again",
        mainMenu: "Main Menu",
        startGame: "Start Game",
        instructions: "Instructions",
        settings: "Settings",
        back: "Back",
        difficulty: "Difficulty",
        easy: "Easy",
        normal: "Normal",
        hard: "Hard",
        sound: "Sound",
        on: "On",
        off: "Off",
        language: "Language",
        title: "Breakout Game",
        difficultySelect: "Select Difficulty",
        instructionsText: [
            "• Use left/right arrow keys or mouse to move the paddle",
            "• Don't let the ball fall to the bottom",
            "• Break all bricks to win",
            "• Use bottom buttons on mobile devices"
        ],
        backToMain: "Back to Main Menu",
        currentScore: "Current Score"
    }
};

// 当前语言
let currentLang = localStorage.getItem('language') || 'zh';

// 获取翻译文本
function t(key) {
    return translations[currentLang][key] || key;
}

// 安全地更新元素文本
function safeSetText(element, text) {
    if (element) {
        element.textContent = text;
    }
}

// 安全地更新元素 HTML
function safeSetHTML(element, html) {
    if (element) {
        element.innerHTML = html;
    }
}

// 更新所有文本
function updateTexts() {
    // 更新标题
    const titleElement = document.querySelector('h1');
    safeSetText(titleElement, t('title'));
    
    // 更新分数和生命
    const scoreElement = document.querySelector('.score');
    const livesElement = document.querySelector('.lives');
    const scoreSpan = document.getElementById('score');
    const livesSpan = document.getElementById('lives');
    
    if (scoreElement && scoreSpan) {
        safeSetHTML(scoreElement, `${t('score')}: <span id="score">${scoreSpan.textContent}</span>`);
    }
    if (livesElement && livesSpan) {
        safeSetHTML(livesElement, `${t('lives')}: <span id="lives">${livesSpan.textContent}</span>`);
    }
    
    // 更新按钮文本
    const playButton = document.getElementById('playButton');
    const instructionsButton = document.getElementById('instructionsButton');
    const settingsButton = document.getElementById('settingsButton');
    
    safeSetText(playButton, t('startGame'));
    safeSetText(instructionsButton, t('instructions'));
    safeSetText(settingsButton, t('settings'));
    
    // 更新游戏说明
    const instructionsScreen = document.getElementById('instructionsScreen');
    if (instructionsScreen) {
        const instructionsTitle = instructionsScreen.querySelector('h2');
        const instructionsList = instructionsScreen.querySelector('.instructions');
        
        safeSetText(instructionsTitle, t('instructions'));
        if (instructionsList) {
            safeSetHTML(instructionsList, t('instructionsText').map(text => `<p>${text}</p>`).join(''));
        }
    }
    
    // 更新设置界面
    const settingsScreen = document.getElementById('settingsScreen');
    if (settingsScreen) {
        const settingsTitle = settingsScreen.querySelector('h2');
        safeSetText(settingsTitle, t('settings'));
        
        const labels = settingsScreen.querySelectorAll('label');
        if (labels.length >= 2) {
            const difficultyLabel = labels[0].childNodes[0];
            const languageLabel = labels[1].childNodes[0];
            
            if (difficultyLabel) difficultyLabel.textContent = t('difficultySelect') + ': ';
            if (languageLabel) languageLabel.textContent = t('language') + ': ';
        }
        
        // 更新难度选项
        const difficultySelect = document.getElementById('difficulty');
        if (difficultySelect) {
            Array.from(difficultySelect.options).forEach(option => {
                option.textContent = t(option.value);
            });
        }
    }
    
    // 更新游戏结束界面
    const gameOverScreen = document.getElementById('gameOverScreen');
    if (gameOverScreen) {
        const gameOverTitle = gameOverScreen.querySelector('h2');
        safeSetText(gameOverTitle, t('gameOver'));
        
        const scoreTexts = gameOverScreen.querySelectorAll('.score-display p');
        if (scoreTexts.length >= 2) {
            const finalScoreText = scoreTexts[0].childNodes[0];
            const highScoreText = scoreTexts[1].childNodes[0];
            
            if (finalScoreText) finalScoreText.textContent = t('currentScore') + ': ';
            if (highScoreText) highScoreText.textContent = t('highScore') + ': ';
        }
        
        const restartButton = document.getElementById('restartButton');
        safeSetText(restartButton, t('playAgain'));
    }
    
    // 更新所有返回按钮
    document.querySelectorAll('.back-button').forEach(button => {
        if (button.getAttribute('data-screen') === 'mainMenu') {
            safeSetText(button, button.classList.contains('menu-button') ? t('backToMain') : t('back'));
        } else {
            safeSetText(button, t('back'));
        }
    });
}

// 监听语言选择
const languageSelect = document.getElementById('language');
if (languageSelect) {
    // 设置初始语言
    languageSelect.value = currentLang;
    
    languageSelect.addEventListener('change', (e) => {
        currentLang = e.target.value;
        localStorage.setItem('language', currentLang);
        updateTexts();
    });
}

// 初始化时更新文本
document.addEventListener('DOMContentLoaded', () => {
    updateTexts();
});
