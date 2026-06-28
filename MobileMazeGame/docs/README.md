# 移动端 2D 迷宫游戏设计文档索引

更新时间：2026-06-28

本文档集用于本项目的“设计先行”评审阶段，当前不包含开发实现代码。

## 文档清单

1. `research-report.md`
   - 开源 2D 迷宫游戏与相关技术方案调研
   - 可复用算法、框架与采用建议

2. `design-spec.md`
   - 系统架构
   - 核心算法
   - 数据结构
   - UI/UX 规范
   - 20 关关卡设计
   - API 接口定义

3. `exec-plan.md`
   - 设计评审后的开发执行计划
   - 阶段目标、验收标准、测试策略、风险控制

## 当前结论摘要

- 技术栈识别结果：当前仓库属于 `Web + 原生 HTML/CSS/JavaScript` 项目，并带有 `Cordova Android` 封装层。
- 推荐落地方式：优先采用 `原生 Canvas + ES Modules + HTML/CSS UI`，避免在现阶段引入重型第三方框架。
- 迷宫项目建议统一收敛到顶层 `MobileMazeGame/` 目录，后续以该目录作为单一开发源。

## 相关数据

- 关卡规格草案：`../data/level-plan.json`
- 项目目录说明：`../README.md`
