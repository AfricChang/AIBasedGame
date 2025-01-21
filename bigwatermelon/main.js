// 等待页面加载完成
window.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('DOM Content Loaded');
        
        // 检查Matter.js是否加载
        if (typeof Matter === 'undefined') {
            throw new Error('Matter.js not loaded');
        }
        
        // 检查Game类是否存在
        if (typeof Game === 'undefined') {
            throw new Error('Game class not loaded');
        }
        
        // 检查canvas是否存在
        const canvas = document.getElementById('GameCanvas');
        if (!canvas) {
            throw new Error('Canvas element not found');
        }
        
        console.log('Starting game initialization...');
        // 初始化游戏
        new Game();
    } catch (error) {
        console.error('Error starting game:', error);
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.textContent = '加载失败: ' + error.message;
            loadingText.style.color = 'red';
        }
    }
});
