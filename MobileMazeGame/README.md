# MobileMazeGame

更新时间：2026-06-28

本目录用于存放移动端 2D 迷宫游戏的全部设计与后续开发内容。

当前阶段已完成：

- 开源调研报告
- 系统设计说明书
- 开发执行计划
- 20 关结构化关卡规划

## 目录说明

- `docs/`
  - 设计与调研文档
- `data/`
  - 关卡规划和后续数据文件
- `src/`
  - 预留给后续正式开发源码

## 文档入口

1. `docs/research-report.md`
2. `docs/design-spec.md`
3. `docs/exec-plan.md`
4. `data/level-plan.json`

## 开发命令

```powershell
npm test
```

当前测试使用 Node.js 内置 `node:test`，不依赖第三方测试框架。

## 当前结论摘要

- 技术栈建议：`原生 Canvas + ES Modules + HTML/CSS UI`
- 部署建议：`单一源码、双入口壳层`
- 难度节奏建议：`视野递减 + 机制递增 + 地图复杂度提升`
