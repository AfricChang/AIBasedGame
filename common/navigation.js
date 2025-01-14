// 在页面加载时添加对话框HTML
document.addEventListener('DOMContentLoaded', function() {
    const dialogHTML = `
        <div class="dialog-overlay"></div>
        <div class="confirm-dialog">
            <p data-en="Return to main menu? Current progress will not be saved." 
               data-zh="确定要返回主菜单吗？当前进度将不会保存。"></p>
            <div class="confirm-dialog-buttons">
                <button class="confirm-yes" data-en="Yes" data-zh="确定"></button>
                <button class="confirm-no" data-en="No" data-zh="取消"></button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', dialogHTML);

    // 绑定事件
    const overlay = document.querySelector('.dialog-overlay');
    const dialog = document.querySelector('.confirm-dialog');
    const yesButton = dialog.querySelector('.confirm-yes');
    const noButton = dialog.querySelector('.confirm-no');

    yesButton.addEventListener('click', () => {
        window.location.href = '../index.html';
    });

    noButton.addEventListener('click', () => {
        overlay.style.display = 'none';
        dialog.style.display = 'none';
    });

    overlay.addEventListener('click', () => {
        overlay.style.display = 'none';
        dialog.style.display = 'none';
    });
});

function confirmExit() {
    const overlay = document.querySelector('.dialog-overlay');
    const dialog = document.querySelector('.confirm-dialog');
    const currentLang = document.documentElement.lang || 'en';
    
    // 更新按钮文本
    dialog.querySelector('.confirm-yes').textContent = 
        currentLang === 'zh' ? '确定' : 'Yes';
    dialog.querySelector('.confirm-no').textContent = 
        currentLang === 'zh' ? '取消' : 'No';
    
    // 更新提示文本
    dialog.querySelector('p').textContent = 
        currentLang === 'zh' 
            ? '确定要返回主菜单吗？当前进度将不会保存。'
            : 'Return to main menu? Current progress will not be saved.';
    
    overlay.style.display = 'block';
    dialog.style.display = 'block';
}
