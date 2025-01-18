function showConfirmDialog(options) {
    const { title, content, confirmText, cancelText, onConfirm, onCancel } = options;

    // 创建对话框容器
    const dialogContainer = document.createElement('div');
    dialogContainer.className = 'dialog-container';
    dialogContainer.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;

    // 创建对话框内容
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 10px;
        max-width: 80%;
        min-width: 300px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    `;

    // 添加标题
    const titleElement = document.createElement('h2');
    titleElement.textContent = title;
    titleElement.style.cssText = `
        margin: 0 0 15px 0;
        font-size: 1.2em;
    `;

    // 添加内容
    const contentElement = document.createElement('p');
    contentElement.textContent = content;
    contentElement.style.cssText = `
        margin: 0 0 20px 0;
    `;

    // 创建按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
        display: flex;
        justify-content: flex-end;
        gap: 10px;
    `;

    // 创建确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.textContent = confirmText;
    confirmButton.style.cssText = `
        padding: 8px 16px;
        border: none;
        border-radius: 5px;
        background: #4CAF50;
        color: white;
        cursor: pointer;
    `;
    confirmButton.onclick = () => {
        document.body.removeChild(dialogContainer);
        if (onConfirm) onConfirm();
    };

    // 创建取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.textContent = cancelText;
    cancelButton.style.cssText = `
        padding: 8px 16px;
        border: none;
        border-radius: 5px;
        background: #f44336;
        color: white;
        cursor: pointer;
    `;
    cancelButton.onclick = () => {
        document.body.removeChild(dialogContainer);
        if (onCancel) onCancel();
    };

    // 组装对话框
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    dialog.appendChild(titleElement);
    dialog.appendChild(contentElement);
    dialog.appendChild(buttonContainer);
    dialogContainer.appendChild(dialog);

    // 添加到页面
    document.body.appendChild(dialogContainer);
}
