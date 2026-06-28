# 移动端 2D 迷宫游戏开源调研报告

更新时间：2026-06-28

## 1. 调研目标

本轮调研聚焦以下问题：

1. 当前仓库更适合沿用什么 Web 游戏技术路线。
2. 迷宫生成、可见区域揭示、移动端输入控制有哪些成熟方案。
3. 哪些开源实现值得借鉴，哪些方案不适合直接引入。

## 2. 当前仓库现状结论

经本地代码结构分析，仓库现状如下：

- 主体为多个独立小游戏目录，普遍采用 `HTML + CSS + JavaScript` 直接运行。
- 存在 `game-app/package.json`，表明已有 `Cordova Android` 打包层。
- 现有游戏实现风格偏轻量，未形成统一的重型前端框架或游戏引擎依赖。
- 已有项目普遍强调移动端适配、触摸操作和浏览器直开体验。

由此可得结论：

- 直接引入大型框架会抬高接入和维护成本。
- 新迷宫项目应优先采用与现有仓库一致的轻量方案。

## 3. 开源实现与资料调研

### 3.1 Phaser 官方文档

Phaser 官方文档说明：

- Phaser 是一个面向桌面和移动浏览器的开源 HTML5 游戏框架。
- 输入系统统一了鼠标、触摸等输入来源。
- 缩放管理器支持 `FIT` 等缩放模式，适合多分辨率适配。

可借鉴点：

- 场景切换模型清晰，适合复杂游戏菜单流转。
- 统一输入和缩放能力对移动端项目很友好。

不建议本项目首版直接采用的原因：

- 当前仓库主要是原生 JS 小游戏，Phaser 会引入新的工程范式和包管理依赖。
- 本项目需求以网格、菜单、视野遮罩和触控为主，原生 Canvas 足以覆盖。
- 现阶段需要优先控制复杂度，降低评审后落地风险。

### 3.2 rot.js 官方文档

rot.js 文档显示：

- 提供多种地图生成器，包括 `Digger`、`DividedMaze`、`EllerMaze`、`IceyMaze`、`Uniform` 等。
- 提供 `precise-shadowcasting` 等 FOV 模块。

可借鉴点：

- 迷宫生成器体系很完整，适合作为关卡风格设计参考。
- FOV 模块说明了“视野计算系统”应保持独立抽象，便于后续替换算法。

不建议本项目首版直接引入的原因：

- 当前需求的地图是规则网格迷宫，不需要完整 roguelike 工具包。
- 直接引库会增加代码体积与适配工作。
- 我们可以借鉴其模块抽象思路，自行实现更轻量的 `Grid FOV + Seeded Maze` 方案。

### 3.3 开源迷宫项目样本

#### `pranit144/MazeCraze`

特点：

- 原生 `HTML/CSS/JavaScript + Canvas`
- 使用 DFS 生成可解迷宫
- 提供响应式界面

价值：

- 证明轻量 Web 技术栈足以完成基础迷宫玩法。
- 可借鉴其“迷宫生成与渲染在同一轻量项目中实现”的工程体量。

不足：

- 更偏桌面键盘输入。
- 缺少完整菜单流、Buff 体系和渐进可见区域设计。

#### `WJXHenry/Phaser-Maze-Game`

特点：

- 基于 Phaser 的迷宫游戏
- 场景和工程组织更规范

价值：

- 适合作为“如果后期复杂度继续提升，是否切换到引擎”的备选参考。

不足：

- 对当前仓库技术风格来说偏重。

#### `davefogo/maze-game`

特点：

- 原生 Canvas
- 使用 Matter.js 表现迷宫

价值：

- 说明物理库可以构造迷宫体验。

不足：

- 本项目是严格网格移动，不需要物理引擎。
- 物理模拟会引入移动不确定性，不利于移动端触屏精确控制。

#### `ZufengW/canvas-maze`

特点：

- 原生 Canvas
- 从图像生成可交互迷宫

价值：

- 说明渲染层可与迷宫数据层解耦。
- 提醒我们在设计中保留“手工布局导入”能力。

不足：

- 更偏基于图片的迷宫生成，不完全贴合本项目的关卡化设计。

#### `GameHelix/maze_generator`

特点：

- Canvas 渲染
- 提供 DFS、Prim、BFS、移动端触摸、计时和 D-pad

价值：

- 证明移动端 `滑动 + 屏幕方向键` 的双控制模式是可行的。
- 其 `BFS` 用于提示路径的思路，可迁移到我们的关卡验证和辅助系统。

不足：

- 使用 `Next.js + React + TypeScript`，对当前仓库来说过重。

## 4. 核心技术方案比选

### 4.1 渲染与工程方案

方案 A：原生 Canvas + ES Modules + HTML/CSS UI

- 优点：与当前仓库最一致，依赖少，便于接入 Cordova。
- 缺点：需要自行组织场景、状态和事件。

方案 B：Phaser 3/4

- 优点：输入、缩放、场景能力成熟。
- 缺点：接入成本更高，项目复杂度被动上升。

结论：

- 首版采用方案 A。
- 架构上保留 `RendererAdapter`、`InputAdapter` 和 `SceneController` 抽象，若未来玩法复杂度显著上升，再评估 Phaser 化。

### 4.2 迷宫生成方案

候选：

- `DFS / Recursive Backtracker`
- `Prim`
- `Divided Maze`
- `Eller Maze`

评估：

- DFS 生成长走廊、方向感强，适合前中期关卡。
- Prim 分支更多，适合中后期提升复杂度。
- Divided Maze 结构感强，适合做对称、分区型关卡。
- Eller 更适合大尺寸规则迷宫，但首版 20 关不必全量引入。

结论：

- 首版主生成器采用 `Seeded DFS`。
- 中后期关卡通过“回路注入、房间雕刻、关键点摆放、传送门/机关修饰”增强差异。
- 校验阶段统一使用 `BFS` 验证可达性、路径长度和关键目标顺序。

### 4.3 视野揭示方案

候选：

- 简单半径圆/方形揭示
- BFS 扩散式格子视野
- 精确 Shadowcasting

评估：

- 简单半径揭示实现最轻，但会穿墙透视，不符合迷宫沉浸感。
- BFS 扩散视野天然符合网格地图和墙阻挡规则，开发成本可控。
- 精确 Shadowcasting 更强，但对当前二维正交迷宫略偏重。

结论：

- 首版采用 `Grid Raycast / BFS Hybrid FOV`：
  - 以角色为中心；
  - 仅在半径范围内沿可达方向扩散；
  - 墙体会阻断其后的可见性；
  - 已探索区域保留“已发现但不可见”的暗显状态。
- 预留 `VisibilityStrategy` 接口，后续如需升级到 shadowcasting，可无缝替换。

### 4.4 移动端输入方案

候选：

- 虚拟摇杆
- 四向 D-pad
- 滑动判向

评估：

- 虚拟摇杆适合连续移动，但本项目是离散网格，容易产生误触或角度歧义。
- 四向 D-pad 精度高，但单手操作覆盖范围有限。
- 滑动判向与网格移动天然匹配，触屏学习成本低。

结论：

- 主控制：`滑动判向`
- 辅控制：`固定四向按钮`
- 不将虚拟摇杆作为首发默认方案，但保留后续实验接口

## 5. 采用建议

建议采纳：

1. `原生 Canvas + ES Modules + HTML/CSS UI`
2. `requestAnimationFrame` 作为主渲染循环
3. `Pointer Events + touch-action` 作为统一移动端输入基础
4. `localStorage` 保存设置、关卡成绩和解锁状态
5. `Seeded DFS + BFS 校验`
6. `可插拔 VisibilityStrategy + BuffSystem`

建议暂不采纳：

1. 首版直接引入 Phaser
2. 首版直接引入 rot.js 运行库
3. 首版引入物理引擎
4. 首版使用连续摇杆移动作为唯一主操作

## 6. 对本项目的最终建议

本项目最合适的落地路线是：

- 以轻量原生 Web 游戏为主线；
- 保留移动端优先的 UI 和输入设计；
- 用模块化架构解决扩展性，而不是靠引擎堆叠复杂度；
- 关卡采用“手工参数化设计 + 可复用生成器 + 验证器”的混合策略；
- 先完成 20 关结构化关卡数据，再进入编码实现。

## 7. 参考来源

1. Phaser 文档首页  
   https://docs.phaser.io/

2. Phaser Input 概念文档  
   https://docs.phaser.io/phaser/concepts/input

3. Phaser Scale Manager 概念文档  
   https://docs.phaser.io/phaser/concepts/scale-manager

4. rot.js 文档索引  
   https://ondras.github.io/rot.js/doc/

5. rot.js 地图模块  
   https://ondras.github.io/rot.js/doc/modules/map.html

6. rot.js Precise Shadowcasting 模块  
   https://ondras.github.io/rot.js/doc/modules/fov_precise_shadowcasting.html

7. MDN Pointer Events  
   https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events

8. MDN `touch-action`  
   https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action

9. MDN `requestAnimationFrame`  
   https://developer.mozilla.org/en-US/docs/Web/API/Window/requestAnimationFrame

10. MDN `localStorage`  
    https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

11. `pranit144/MazeCraze`  
    https://github.com/pranit144/MazeCraze

12. `WJXHenry/Phaser-Maze-Game`  
    https://github.com/WJXHenry/Phaser-Maze-Game

13. `davefogo/maze-game`  
    https://github.com/davefogo/maze-game

14. `ZufengW/canvas-maze`  
    https://github.com/ZufengW/canvas-maze

15. `GameHelix/maze_generator`  
    https://github.com/GameHelix/maze_generator
