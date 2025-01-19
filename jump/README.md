# 跳一跳游戏需求文档 (Jump Jump Game Requirements)

## 基本要求 (Basic Requirements)

### 1. 移动端支持 (Mobile Support)
- 游戏需要支持手机端游玩
- 确保触摸控制响应准确

### 2. 多语言支持 (Multi-language Support)
- 支持中文和英文语言切换
- 包括游戏界面所有文本内容

### 3. 返回按钮设计 (Back Button Design)
- 在游戏主界面左上角添加返回按钮
- 使用向左的箭头图标表示
- 点击后返回到主菜单(index.html)

### 4. 返回确认功能 (Return Confirmation)
- 点击返回按钮时显示确认对话框
- 使用common文件夹中的对话框组件
- 用户需确认是否返回主菜单

### 5. 文件结构 (File Structure)
游戏代码将分为三个主要文件：
- HTML文件：游戏的结构和内容
- JavaScript文件：游戏逻辑和交互
- CSS文件：游戏样式和布局

## 实现的功能和技术细节 (Implemented Features and Technical Details)

### 1. 游戏机制 (Game Mechanics)
- 按压蓄力、松开跳跃的核心玩法
- 完美落地奖励机制
- 连击系统（Perfect Combo）
- 实时分数统计和最高分记录
- 游戏结束判定和重新开始功能

### 2. 视觉效果 (Visual Effects)
- 3D场景渲染，使用Three.js引擎
- 流畅的动画效果（跳跃、旋转、缩放）
- 动态能量条显示
- 完美落地特效
- 响应式设计，适配不同屏幕尺寸

### 3. 音频系统 (Audio System)
- 完整的音效系统
- 支持以下音效：
  - 跳跃音效
  - 落地音效
  - 完美落地音效
  - 连击音效（8级连击音效）
  - 游戏结束音效

### 4. 界面设计 (UI Design)
- 简洁现代的界面风格
- 实时分数显示
- 最高分记录
- 游戏说明提示
- 能量条动画
- 游戏结束界面
- 返回主菜单按钮

### 5. 移动端支持 (Mobile Support)
- 触摸屏操作优化
- 移动端视角和相机参数调整
- 禁用默认触摸行为
- 响应式UI布局

### 6. 技术实现 (Technical Implementation)
- 使用Three.js进行3D渲染
- 使用GSAP进行动画处理
- LocalStorage保存最高分
- 响应式设计适配各种设备
- 模块化的代码结构

## 文件结构 (File Structure)
```
jump/
├── index.html      # 游戏主页面
├── game.js         # 游戏核心逻辑
├── style.css       # 样式表
└── audio/          # 音效文件目录
    ├── fall.mp3
    ├── success.mp3
    ├── scale_intro.mp3
    ├── scale_loop.mp3
    └── combo1-8.mp3
```

## 开发说明 (Development Notes)

### 配置参数 (Configuration)
游戏的主要参数都在`config`对象中配置：
- blockSize: 方块大小
- blockHeight: 方块高度
- minDistance: 最小跳跃距离
- maxDistance: 最大跳跃距离
- jumpForce: 跳跃力度
- maxHoldTime: 最大蓄力时间
- cameraHeight: 相机高度
- cameraAngle: 相机角度

### 设备适配 (Device Adaptation)
- 自动检测设备类型
- 针对移动端和PC端分别优化参数
- 自适应屏幕尺寸

### 性能优化 (Performance Optimization)
- 使用requestAnimationFrame进行动画循环
- 优化Three.js渲染性能
- 资源预加载
- 内存管理优化

## 注意事项 (Notes)
- 确保服务器支持音频文件格式
- 需要现代浏览器支持（WebGL）
- 建议使用HTTPS服务以确保音频功能正常工作
- 移动端需要用户首次交互才能播放音效
- 确保代码结构清晰，便于维护
- 保持良好的用户体验
- 确保游戏性能流畅

## TODO
- 跳跃动画优化；
- 随机生成圆柱等其他跳板；
- 角色优化，现在太丑了；
- 蓄力时跳板以及角色变形动画；
- 播放音乐额外奖励；
