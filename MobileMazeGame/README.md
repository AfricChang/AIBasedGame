# 迷踪微光 (Mobile Maze Game)

更新时间：2026-07-01

一款为移动端设计的 2D 网格迷宫游戏，核心玩法是"有限视野 + 渐进式探索 + 触屏移动"。在迷雾中摸索出口，利用信标、钥匙和传送门完成 20 个渐进式迷宫挑战。

## 快速开始

### 本地开发

使用 Node.js 内置静态服务器启动：

```powershell
node dev-server.js
```

默认监听 `http://127.0.0.1:8123`，可通过参数指定根目录和端口：

```powershell
node dev-server.js <root> <port>
```

### 运行测试

```powershell
npm test
```

测试使用 Node.js 内置 `node:test`，无需第三方框架。测试覆盖关卡可解性、星级评分、存档数据规范化、Buff 系统、视野系统、存档兼容性等。

## 技术栈

- **渲染**：HTML5 Canvas（双层离屏渲染：地图层 + 玩家层，脏矩形增量更新）
- **语言**：原生 JavaScript ES Modules
- **UI**：HTML + CSS（深色玻璃拟态风格，移动端优先响应式布局）
- **音频**：Web Audio API 程序化音效合成（无外部音频资源）
- **存档**：localStorage（带版本兼容和数据规范化）
- **迷宫生成**：DFS 递归回溯 + Prim 算法，基于种子的确定性随机
- **测试**：node:test + node:assert

## 游戏特性

### 核心玩法

- **有限视野迷雾**：玩家周围圆形视野，边缘渐变衰减；离开后进入"已探索"半记忆状态，超时则完全隐没
- **视野记忆**：已探索区域在设定时间内保持半可见状态，可在设置中开关
- **网格步进移动**：格子间平滑插值移动，支持泥地减速和信标加速
- **多端输入**：触屏滑动 + 键盘方向键/WASD + 长按连续移动
- **三星评级**：根据通关时间和步数评定 1-3 星，独立追踪最佳时间/步数/星级

### 关卡机制

| 机制 | 说明 |
|------|------|
| 钥匙与门 | 单钥门（L05）、双钥门（L12/L19/L20） |
| 信标 Buff | 点亮全图视野，高级信标附加疾行效果（L06/L15/L20） |
| 泥沼地块 | 移动速度降低 45%（L07） |
| 传送门 | 成对双向传送，支持链式传送（L08/L16/L19/L20） |
| 单向门 | 只允许单向通过的通道门（L09） |
| 暗雾陷阱 | 踩到后视野半径暂时 -1（L11） |
| 压板机关 | 踩下后解锁出口门（L14/L20） |
| 限时挑战 | 倒计时归零即失败（L10/L18/L19/L20） |
| 隐线捷径 | 额外环路注入鼓励探索（L13） |

### 20 关难度曲线

- **L01-L04 入门期**：9×9~11×13，视野 4→3，教学 + 基础探索
- **L05-L09 机制解锁期**：12×12~14×14，逐一引入钥匙、信标、泥地、传送、单向门
- **L10-L14 加压期**：14×15~16×17，限时、暗雾陷阱、双钥、压板，视野记忆递减
- **L15-L17 高压期**：17×17~18×18，Prim 生成器、多信标管理、传送链、极低视野（半径 2）
- **L18-L20 终局**：18×19~20×20，复合机制 + 限时，L20 为全机制综合挑战

### 目标类型

- `reach-exit`：抵达出口
- `collect-key-and-exit`：收集 1 把钥匙后抵达出口
- `collect-two-keys-and-exit`：收集 2 把钥匙后抵达出口
- `activate-plate-and-exit`：激活压板后抵达出口
- `final-relay`：收集 2 把钥匙 + 激活压板后抵达出口（终局专用）

## 目录结构

```
MobileMazeGame/
├── index.html          # 主页面：菜单、关卡选择、设置、游戏画布、弹窗
├── game.js             # 游戏引擎核心（~2300 行）：迷宫生成/渲染/逻辑/音频/存档
├── levels.js           # 20 关关卡数据定义
├── style.css           # 完整 UI 样式（深色主题 + 响应式）
├── dev-server.js       # Node.js 静态文件服务器
├── package.json        # 项目配置
├── favicon.ico         # 站点图标
├── data/
│   └── level-plan.json # 关卡规划数据（与 levels.js 同步）
├── docs/
│   ├── README.md
│   ├── research-report.md   # 开源调研报告
│   ├── design-spec.md       # 系统设计说明书
│   └── exec-plan.md         # 开发执行计划
├── tests/
│   └── game.test.mjs   # 自动化测试（关卡可解性/评分/存档/Buff/视野）
├── src/                # 预留源码目录（当前源码在根目录）
├── android-app/        # Android Cordova 打包配置
├── build-release-apk.bat
├── build-standalone-apk.bat
└── sync-to-game-app.bat
```

## 核心架构

### 主要类

| 类 | 文件 | 职责 |
|----|------|------|
| `MobileMazeGame` | [game.js](file:///e:/AI/web/AIBasedGame/MobileMazeGame/game.js#L480-L2302) | 游戏主控制器：UI 绑定、游戏循环、关卡管理、渲染、移动逻辑、碰撞、胜负判定 |
| `SeededRandom` | [game.js](file:///e:/AI/web/AIBasedGame/MobileMazeGame/game.js#L162-L191) | 线性同余种子随机数生成器，确保迷宫生成确定性可复现 |
| `BuffSystem` | [game.js](file:///e:/AI/web/AIBasedGame/MobileMazeGame/game.js#L193-L265) | Buff/Debuff 管理：添加、过期计时、修饰符合成（全图视野/视野加成/移速倍率） |
| `StorageService` | [game.js](file:///e:/AI/web/AIBasedGame/MobileMazeGame/game.js#L267-L285) | localStorage 存档读写，带版本兼容和数据规范化 |
| `AudioService` | [game.js](file:///e:/AI/web/AIBasedGame/MobileMazeGame/game.js#L287-L478) | Web Audio API 程序化音效：UI/移动/拾取/开门/传送/胜负等 12 种音效 |

### 导出模块

[game.js](file:///e:/AI/web/AIBasedGame/MobileMazeGame/game.js#L2310-L2327) 导出以下供测试使用的模块：
`MobileMazeGame`, `SeededRandom`, `BuffSystem`, `StorageService`, `AudioService`, `DEFAULT_SAVE`, `DIRS`, `calculateLevelRating`, `cellKey`, `edgeKey`, `parseEdgeKey`, `clamp`, `formatTime`, `deepCloneSave`, `normalizeSaveData`, `mergeCompletionRecord`

### 渲染管线

1. **双层 Canvas**：`mapLayer`（静态地图，脏矩形增量绘制）+ 主 Canvas（玩家位置动画）
2. **视野计算**：以玩家为中心的圆形欧式距离判定，带非线性衰减
3. **视野记忆**：`lastSeenMs` 时间戳追踪，每 250ms 检测过期
4. **增量更新**：`markDirtyCell` 标记变更格子，批量重绘周围 3×3 邻域，超过 45% 格子脏时全量重绘
5. **迷宫生成**：DFS/Prim 算法生成完美迷宫后，按关卡难度注入环路（1.5%~4%），BFS 求最远两点作为起点/终点

### 存档数据结构

```javascript
{
  settings: {
    vibration: true,      // 触觉反馈
    sound: true,          // 音效开关
    rememberFog: true     // 视野记忆
  },
  progress: {
    unlockedLevel: 1,     // 最高解锁关卡
    completedLevels: {
      [levelId]: {
        bestTimeMs: number,  // 最佳时间（毫秒）
        bestMoves: number,   // 最少步数
        stars: 1|2|3         // 最高星级
      }
    }
  }
}
```

存档键名：`mobileMazeGame.save.v1`，支持旧版本字段自动迁移（如 `sfxEnabled`/`musicEnabled` → `sound`）。

## 设置选项

- **触觉反馈**：碰撞/拾取/激活压板时的设备振动
- **音效**：程序化合成的交互音效
- **视野记忆**：关闭后离开视野的格子立即隐没，增加难度

## 操作方式

| 操作 | 方式 |
|------|------|
| 移动 | 触屏滑动（上下左右）/ 方向键 / WASD |
| 连续移动 | 长按方向键（首次延迟 240ms，重复间隔 95ms） |
| 暂停 | 点击"暂停"按钮 / ESC 键 |
| 返回 | 各面板左上角返回按钮 |

## 文档入口

1. [docs/research-report.md](file:///e:/AI/web/AIBasedGame/MobileMazeGame/docs/research-report.md) - 开源调研报告
2. [docs/design-spec.md](file:///e:/AI/web/AIBasedGame/MobileMazeGame/docs/design-spec.md) - 系统设计说明书
3. [docs/exec-plan.md](file:///e:/AI/web/AIBasedGame/MobileMazeGame/docs/exec-plan.md) - 开发执行计划
4. [data/level-plan.json](file:///e:/AI/web/AIBasedGame/MobileMazeGame/data/level-plan.json) - 关卡规划数据

## 测试覆盖

测试文件 [tests/game.test.mjs](file:///e:/AI/web/AIBasedGame/MobileMazeGame/tests/game.test.mjs) 覆盖：

- 20 关数据完整性校验（ID/字段/生成器类型）
- **全 20 关可解性验证**（BFS 状态空间搜索，验证钥匙/压板/传送/单向门约束下存在通关路径）
- 目标步数合理性（最优路径 ≤ targetMoves）
- 星级评分计算（时间/步数双目标）
- 最佳记录合并（时间/步数/星级独立追踪）
- 机制标签与关卡特性一致性校验（钥匙/传送/信标/泥地/陷阱/压板/限时）
- 单向门方向性
- 视野系统（全图揭示/记忆模式/记忆过期/关闭记忆）
- Buff 系统（刷新/过期/修饰符合成）
- 存档系统（旧版本迁移/异常数据恢复/边界值规范化）
- 渲染脏标记机制
- 禁用音效时不创建 AudioContext
