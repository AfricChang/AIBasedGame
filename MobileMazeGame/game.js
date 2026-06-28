import { LEVELS } from "./levels.js";

const STORAGE_KEY = "mobileMazeGame.save.v1";
const DIRS = {
    up: { dr: -1, dc: 0, wall: "top", opposite: "bottom" },
    right: { dr: 0, dc: 1, wall: "right", opposite: "left" },
    down: { dr: 1, dc: 0, wall: "bottom", opposite: "top" },
    left: { dr: 0, dc: -1, wall: "left", opposite: "right" }
};

const DEFAULT_SAVE = {
    settings: {
        showDpad: true,
        vibration: true,
        rememberFog: true
    },
    progress: {
        unlockedLevel: 1,
        completedLevels: {}
    }
};

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function cellKey(row, col) {
    return `${row},${col}`;
}

function edgeKey(fromRow, fromCol, toRow, toCol) {
    return `${fromRow},${fromCol}->${toRow},${toCol}`;
}

function formatTime(ms) {
    const totalTenths = Math.floor(ms / 100);
    const tenths = totalTenths % 10;
    const totalSeconds = Math.floor(totalTenths / 10);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`;
}

function deepCloneSave(save) {
    return JSON.parse(JSON.stringify(save));
}

class SeededRandom {
    constructor(seed) {
        this.seed = seed % 2147483647;
        if (this.seed <= 0) {
            this.seed += 2147483646;
        }
    }

    next() {
        this.seed = (this.seed * 16807) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }

    nextInt(max) {
        return Math.floor(this.next() * max);
    }

    pick(list) {
        return list[this.nextInt(list.length)];
    }

    shuffle(list) {
        const clone = [...list];
        for (let index = clone.length - 1; index > 0; index -= 1) {
            const swapIndex = this.nextInt(index + 1);
            [clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]];
        }
        return clone;
    }
}

class BuffSystem {
    constructor() {
        this.buffs = [];
    }

    add(buff) {
        const existing = this.buffs.find((item) => item.id === buff.id);
        if (existing) {
            if (buff.stackMode === "refresh") {
                existing.remainingMs = Math.max(existing.remainingMs, buff.durationMs);
            }
            return existing;
        }

        const instance = {
            ...buff,
            remainingMs: buff.durationMs
        };
        this.buffs.push(instance);
        return instance;
    }

    tick(deltaMs) {
        if (!this.buffs.length) {
            return [];
        }

        const expired = [];
        this.buffs = this.buffs.filter((buff) => {
            buff.remainingMs -= deltaMs;
            if (buff.remainingMs <= 0) {
                expired.push(buff);
                return false;
            }
            return true;
        });
        return expired;
    }

    clear() {
        this.buffs = [];
    }

    getActiveModifiers() {
        return this.buffs.reduce((accumulator, buff) => {
            const modifiers = buff.modifiers || {};
            if (modifiers.revealAll) {
                accumulator.revealAll = true;
            }
            if (modifiers.visionBonus) {
                accumulator.visionBonus += modifiers.visionBonus;
            }
            if (modifiers.moveDurationMultiplier) {
                accumulator.moveDurationMultiplier *= modifiers.moveDurationMultiplier;
            }
            return accumulator;
        }, {
            revealAll: false,
            visionBonus: 0,
            moveDurationMultiplier: 1
        });
    }

    getLabel() {
        if (!this.buffs.length) {
            return "无";
        }

        return this.buffs
            .map((buff) => `${buff.label} ${Math.ceil(buff.remainingMs / 1000)}s`)
            .join(" / ");
    }
}

class StorageService {
    load() {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return deepCloneSave(DEFAULT_SAVE);
            }

            return {
                settings: {
                    ...DEFAULT_SAVE.settings,
                    ...(JSON.parse(raw).settings || {})
                },
                progress: {
                    ...DEFAULT_SAVE.progress,
                    ...(JSON.parse(raw).progress || {})
                }
            };
        } catch (error) {
            console.warn("Failed to load save data:", error);
            return deepCloneSave(DEFAULT_SAVE);
        }
    }

    save(saveData) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(saveData));
    }
}

class MobileMazeGame {
    constructor() {
        this.storage = new StorageService();
        this.saveData = this.storage.load();
        this.currentScreen = "mainMenu";
        this.currentLevelId = 1;
        this.runtime = null;
        this.buffSystem = new BuffSystem();
        this.lastFrameTime = performance.now();
        this.pendingDirection = null;
        this.heldDirection = null;
        this.heldDirectionSource = null;
        this.heldRepeatReadyAt = 0;
        this.messageTimeout = null;
        this.swipeStart = null;
        this.resultMode = "next";
        this.lastHudRenderMs = -1;

        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.elements = this.collectElements();

        this.bindUI();
        this.applySettingsToUI();
        this.renderLevelGrid();
        this.updateProgressMeta();
        this.resizeCanvas();

        window.addEventListener("resize", () => this.resizeCanvas());
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    collectElements() {
        return {
            screens: {
                mainMenu: document.getElementById("mainMenu"),
                levelSelectScreen: document.getElementById("levelSelectScreen"),
                settingsScreen: document.getElementById("settingsScreen"),
                aboutScreen: document.getElementById("aboutScreen"),
                gameScreen: document.getElementById("gameScreen")
            },
            progressMeta: document.getElementById("progressMeta"),
            levelGrid: document.getElementById("levelGrid"),
            levelTitle: document.getElementById("levelTitle"),
            objectiveLabel: document.getElementById("objectiveLabel"),
            timerLabel: document.getElementById("timerLabel"),
            visionLabel: document.getElementById("visionLabel"),
            moveCountLabel: document.getElementById("moveCountLabel"),
            buffLabel: document.getElementById("buffLabel"),
            swipeHint: document.getElementById("swipeHint"),
            dpad: document.getElementById("dpad"),
            pauseOverlay: document.getElementById("pauseOverlay"),
            resultOverlay: document.getElementById("resultOverlay"),
            resultTitle: document.getElementById("resultTitle"),
            resultSummary: document.getElementById("resultSummary"),
            resultTime: document.getElementById("resultTime"),
            resultMoves: document.getElementById("resultMoves"),
            resultPrimaryBtn: document.getElementById("resultPrimaryBtn"),
            resultSecondaryBtn: document.getElementById("resultSecondaryBtn"),
            resultMenuBtn: document.getElementById("resultMenuBtn"),
            settings: {
                showDpad: document.getElementById("showDpadSetting"),
                vibration: document.getElementById("vibrationSetting"),
                rememberFog: document.getElementById("rememberFogSetting")
            }
        };
    }

    bindUI() {
        document.getElementById("startGameBtn").addEventListener("click", () => {
            this.startLevel(this.saveData.progress.unlockedLevel);
        });
        document.getElementById("levelSelectBtn").addEventListener("click", () => this.showScreen("levelSelectScreen"));
        document.getElementById("settingsBtn").addEventListener("click", () => this.showScreen("settingsScreen"));
        document.getElementById("aboutBtn").addEventListener("click", () => this.showScreen("aboutScreen"));
        document.querySelectorAll(".back-btn").forEach((button) => {
            button.addEventListener("click", () => {
                this.showScreen(button.dataset.target);
            });
        });

        document.getElementById("pauseBtn").addEventListener("click", () => this.pauseGame());
        document.getElementById("resumeBtn").addEventListener("click", () => this.resumeGame());
        document.getElementById("restartBtn").addEventListener("click", () => this.restartLevel());
        document.getElementById("leaveToMenuBtn").addEventListener("click", () => this.leaveToMenu());

        this.elements.resultPrimaryBtn.addEventListener("click", () => {
            if (this.resultMode === "next") {
                const nextLevel = clamp(this.currentLevelId + 1, 1, LEVELS.length);
                this.startLevel(nextLevel);
            } else {
                this.restartLevel();
            }
        });
        this.elements.resultSecondaryBtn.addEventListener("click", () => this.restartLevel());
        this.elements.resultMenuBtn.addEventListener("click", () => {
            this.hideOverlay(this.elements.resultOverlay);
            this.showScreen("levelSelectScreen");
        });

        this.elements.settings.showDpad.addEventListener("change", () => this.saveSetting("showDpad", this.elements.settings.showDpad.checked));
        this.elements.settings.vibration.addEventListener("change", () => this.saveSetting("vibration", this.elements.settings.vibration.checked));
        this.elements.settings.rememberFog.addEventListener("change", () => {
            this.saveSetting("rememberFog", this.elements.settings.rememberFog.checked);
            if (this.runtime) {
                this.computeVisibility();
            }
        });

        document.addEventListener("keydown", (event) => {
            const mapping = {
                ArrowUp: "up",
                ArrowRight: "right",
                ArrowDown: "down",
                ArrowLeft: "left",
                w: "up",
                d: "right",
                s: "down",
                a: "left"
            };

            const dir = mapping[event.key];
            if (dir) {
                event.preventDefault();
                this.setHeldDirection(dir, "keyboard", performance.now());
                if (!event.repeat) {
                    this.requestMove(dir);
                }
            }

            if (event.key === "Escape") {
                if (this.runtime?.state === "playing") {
                    this.pauseGame();
                } else if (this.runtime?.state === "paused") {
                    this.resumeGame();
                }
            }
        });

        document.addEventListener("keyup", (event) => {
            const mapping = {
                ArrowUp: "up",
                ArrowRight: "right",
                ArrowDown: "down",
                ArrowLeft: "left",
                w: "up",
                d: "right",
                s: "down",
                a: "left"
            };

            const dir = mapping[event.key];
            if (dir && this.heldDirectionSource === "keyboard" && this.heldDirection === dir) {
                this.clearHeldDirection();
            }
        });

        this.elements.dpad.querySelectorAll(".dpad-btn").forEach((button) => {
            const direction = button.dataset.dir;
            button.addEventListener("pointerdown", (event) => {
                event.preventDefault();
                this.setHeldDirection(direction, "dpad", performance.now());
                this.requestMove(direction);
            });
            button.addEventListener("pointerup", () => {
                if (this.heldDirectionSource === "dpad" && this.heldDirection === direction) {
                    this.clearHeldDirection();
                }
            });
            button.addEventListener("pointerleave", () => {
                if (this.heldDirectionSource === "dpad" && this.heldDirection === direction) {
                    this.clearHeldDirection();
                }
            });
            button.addEventListener("pointercancel", () => {
                if (this.heldDirectionSource === "dpad" && this.heldDirection === direction) {
                    this.clearHeldDirection();
                }
            });
        });

        this.canvas.addEventListener("pointerdown", (event) => {
            this.swipeStart = { x: event.clientX, y: event.clientY };
        });

        this.canvas.addEventListener("pointerup", (event) => {
            if (!this.swipeStart) {
                return;
            }

            const deltaX = event.clientX - this.swipeStart.x;
            const deltaY = event.clientY - this.swipeStart.y;
            this.swipeStart = null;
            const absX = Math.abs(deltaX);
            const absY = Math.abs(deltaY);

            if (Math.max(absX, absY) < 20) {
                return;
            }

            if (absX > absY) {
                this.requestMove(deltaX > 0 ? "right" : "left");
            } else {
                this.requestMove(deltaY > 0 ? "down" : "up");
            }
        });

        this.canvas.addEventListener("pointercancel", () => {
            this.swipeStart = null;
        });
    }

    setHeldDirection(direction, source, now = performance.now()) {
        this.heldDirection = direction;
        this.heldDirectionSource = source;
        this.heldRepeatReadyAt = now + 240;
    }

    clearHeldDirection() {
        this.heldDirection = null;
        this.heldDirectionSource = null;
        this.heldRepeatReadyAt = 0;
    }

    saveSetting(key, value) {
        this.saveData.settings[key] = value;
        this.storage.save(this.saveData);
        this.applySettingsToUI();
    }

    applySettingsToUI() {
        this.elements.settings.showDpad.checked = !!this.saveData.settings.showDpad;
        this.elements.settings.vibration.checked = !!this.saveData.settings.vibration;
        this.elements.settings.rememberFog.checked = !!this.saveData.settings.rememberFog;
        this.elements.dpad.classList.toggle("hidden", !this.saveData.settings.showDpad);
    }

    resizeCanvas() {
        const viewport = document.getElementById("gameViewport");
        if (!viewport || viewport.clientWidth === 0 || viewport.clientHeight === 0) {
            return false;
        }

        const width = viewport.clientWidth;
        const height = Math.max(280, viewport.clientHeight);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        this.canvas.width = Math.floor(width * dpr);
        this.canvas.height = Math.floor(height * dpr);
        this.canvas.style.width = `${width}px`;
        this.canvas.style.height = `${height}px`;
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        return true;
    }

    showScreen(screenId) {
        Object.values(this.elements.screens).forEach((screen) => {
            screen.classList.remove("active");
        });
        this.elements.screens[screenId].classList.add("active");
        this.currentScreen = screenId;

        if (screenId === "gameScreen") {
            requestAnimationFrame(() => {
                this.resizeCanvas();
                requestAnimationFrame(() => this.resizeCanvas());
            });
        }
    }

    showOverlay(overlay) {
        overlay.classList.add("active");
    }

    hideOverlay(overlay) {
        overlay.classList.remove("active");
    }

    updateProgressMeta() {
        this.elements.progressMeta.textContent = `已解锁 ${this.saveData.progress.unlockedLevel} / ${LEVELS.length}`;
    }

    renderLevelGrid() {
        this.elements.levelGrid.innerHTML = "";
        LEVELS.forEach((level) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "level-card";
            if (level.id > this.saveData.progress.unlockedLevel) {
                card.classList.add("locked");
                card.disabled = true;
            }

            const completed = this.saveData.progress.completedLevels[level.id];
            card.innerHTML = `
                <strong>${level.code} ${level.name}</strong>
                <small>${level.rows}x${level.cols} · 视野 ${level.visionRadius} · ${this.getObjectiveText(level)}</small>
                <span>${completed ? `最佳 ${formatTime(completed.bestTimeMs)}` : "尚未通关"}</span>
            `;
            card.addEventListener("click", () => this.startLevel(level.id));
            this.elements.levelGrid.appendChild(card);
        });
    }

    getObjectiveText(level) {
        const objectiveMap = {
            "reach-exit": "抵达出口",
            "collect-key-and-exit": "拿钥匙再离开",
            "collect-two-keys-and-exit": "收集两把钥匙",
            "activate-plate-and-exit": "启动压板后离开",
            "final-relay": "完成终局联动"
        };
        return objectiveMap[level.objective] || "完成挑战";
    }

    startLevel(levelId) {
        const level = LEVELS.find((item) => item.id === levelId);
        if (!level) {
            return;
        }

        this.currentLevelId = levelId;
        this.buffSystem.clear();
        this.pendingDirection = null;
        this.clearHeldDirection();
        this.hideOverlay(this.elements.pauseOverlay);
        this.hideOverlay(this.elements.resultOverlay);
        this.runtime = this.createLevelRuntime(level);
        this.updateHUD();
        this.showScreen("gameScreen");
        requestAnimationFrame(() => {
            this.resizeCanvas();
            this.computeVisibility();
        });
        this.flashMessage("");
    }

    restartLevel() {
        this.startLevel(this.currentLevelId);
    }

    leaveToMenu() {
        this.hideOverlay(this.elements.pauseOverlay);
        if (this.runtime) {
            this.runtime.state = "idle";
        }
        this.clearHeldDirection();
        this.showScreen("mainMenu");
    }

    pauseGame() {
        if (!this.runtime || this.runtime.state !== "playing") {
            return;
        }
        this.runtime.state = "paused";
        this.showOverlay(this.elements.pauseOverlay);
    }

    resumeGame() {
        if (!this.runtime || this.runtime.state !== "paused") {
            return;
        }
        this.runtime.state = "playing";
        this.hideOverlay(this.elements.pauseOverlay);
    }

    requestMove(direction) {
        if (!this.runtime || this.currentScreen !== "gameScreen") {
            return;
        }

        if (this.runtime.state === "paused" || this.runtime.state === "won" || this.runtime.state === "lost") {
            return;
        }

        if (this.runtime.player.moving) {
            this.pendingDirection = direction;
            return;
        }

        this.tryMove(direction);
    }

    tryMove(direction) {
        const runtime = this.runtime;
        const dir = DIRS[direction];
        if (!dir) {
            return;
        }

        const { row, col } = runtime.player;
        const currentCell = runtime.grid[row][col];
        if (currentCell.walls[dir.wall]) {
            this.bumpFeedback();
            return;
        }

        const nextRow = row + dir.dr;
        const nextCol = col + dir.dc;
        if (!this.inBounds(runtime, nextRow, nextCol)) {
            this.bumpFeedback();
            return;
        }

        const blockedByOneWay = runtime.features.oneWayBlocked.has(edgeKey(nextRow, nextCol, row, col));
        if (blockedByOneWay) {
            this.flashMessage("单向门阻止了回头路");
            this.bumpFeedback();
            return;
        }

        const nextKey = cellKey(nextRow, nextCol);
        const door = runtime.features.doors.get(nextKey);
        if (door && !door.open) {
            if (runtime.player.keys >= door.requiredKeys && (!door.requiresPlate || runtime.player.plateActivated)) {
                door.open = true;
                this.flashMessage(door.requiredKeys > 1 ? "双钥门开启" : "门已开启");
            } else {
                this.flashMessage(door.requiresPlate ? "需要先激活压板" : "钥匙不足，门无法开启");
                this.bumpFeedback();
                return;
            }
        }

        if (!runtime.started) {
            runtime.started = true;
        }

        const modifiers = this.buffSystem.getActiveModifiers();
        const currentTile = runtime.grid[row][col].tile;
        const slowMultiplier = currentTile === "mud" ? 1.45 : 1;
        const duration = clamp(Math.round(runtime.player.baseMoveDuration * slowMultiplier * modifiers.moveDurationMultiplier), 70, 260);

        runtime.player.moving = {
            fromRow: row,
            fromCol: col,
            toRow: nextRow,
            toCol: nextCol,
            elapsedMs: 0,
            durationMs: duration
        };
        runtime.player.row = nextRow;
        runtime.player.col = nextCol;
        runtime.moveCount += 1;
        this.updateHUD();
    }

    inBounds(runtime, row, col) {
        return row >= 0 && row < runtime.level.rows && col >= 0 && col < runtime.level.cols;
    }

    completeMove() {
        const runtime = this.runtime;
        runtime.player.moving = null;
        this.handleCellEntry(runtime.player.row, runtime.player.col);
        this.computeVisibility();
        this.updateHUD();

        const now = performance.now();
        const nextDirection = this.pendingDirection || (this.heldDirection && now >= this.heldRepeatReadyAt ? this.heldDirection : null);
        this.pendingDirection = null;
        if (nextDirection) {
            this.heldRepeatReadyAt = now + 95;
            this.tryMove(nextDirection);
        }
    }

    handleCellEntry(row, col) {
        const runtime = this.runtime;
        const visited = new Set();
        let currentRow = row;
        let currentCol = col;
        let teleportedThisStep = false;

        while (true) {
            const key = cellKey(currentRow, currentCol);
            if (visited.has(key)) {
                break;
            }
            visited.add(key);

            if (runtime.features.keys.has(key)) {
                runtime.features.keys.delete(key);
                runtime.player.keys += 1;
                this.flashMessage(runtime.player.keys > 1 ? "获得钥匙 x2 目标推进" : "获得钥匙");
                this.softVibrate(35);
            }

            const beacon = runtime.features.beacons.get(key);
            if (beacon && !beacon.used) {
                beacon.used = true;
                this.buffSystem.add({
                    id: `beacon-${key}`,
                    label: beacon.label,
                    durationMs: beacon.durationMs,
                    stackMode: "refresh",
                    modifiers: beacon.modifiers
                });
                this.flashMessage(beacon.message);
                this.softVibrate(25);
            }

            if (runtime.features.darkTraps.has(key)) {
                this.buffSystem.add({
                    id: `dark-${key}`,
                    label: "视野受损",
                    durationMs: 4200,
                    stackMode: "refresh",
                    modifiers: { visionBonus: -1 }
                });
                this.flashMessage("暗雾陷阱让视野缩小了");
            }

            if (runtime.features.plate && runtime.features.plate.key === key && !runtime.player.plateActivated) {
                runtime.player.plateActivated = true;
                this.flashMessage("压板已激活，终门解锁");
                const exitDoor = runtime.features.doors.get(cellKey(runtime.exit.row, runtime.exit.col));
                if (exitDoor) {
                    exitDoor.requiresPlate = false;
                }
                this.softVibrate(45);
            }

            const teleport = runtime.features.teleports.get(key);
            if (!teleportedThisStep && teleport && teleport.target && teleport.uses !== 0) {
                teleport.uses = teleport.uses > 0 ? teleport.uses - 1 : teleport.uses;
                runtime.player.row = teleport.target.row;
                runtime.player.col = teleport.target.col;
                currentRow = teleport.target.row;
                currentCol = teleport.target.col;
                teleportedThisStep = true;
                this.flashMessage("跃迁成功");
                this.softVibrate(20);
                continue;
            }

            break;
        }

        if (this.checkWinCondition()) {
            this.handleLevelComplete();
        }
    }

    checkWinCondition() {
        const runtime = this.runtime;
        if (!runtime) {
            return false;
        }

        const atExit = runtime.player.row === runtime.exit.row && runtime.player.col === runtime.exit.col;
        if (!atExit) {
            return false;
        }

        switch (runtime.level.objective) {
            case "collect-key-and-exit":
                return runtime.player.keys >= 1;
            case "collect-two-keys-and-exit":
                return runtime.player.keys >= 2;
            case "activate-plate-and-exit":
                return runtime.player.plateActivated;
            case "final-relay":
                return runtime.player.keys >= 2 && runtime.player.plateActivated;
            case "reach-exit":
            default:
                return true;
        }
    }

    handleLevelComplete() {
        const runtime = this.runtime;
        runtime.state = "won";
        this.computeVisibility(true);

        const best = this.saveData.progress.completedLevels[this.currentLevelId];
        if (!best || runtime.elapsedMs < best.bestTimeMs) {
            this.saveData.progress.completedLevels[this.currentLevelId] = {
                bestTimeMs: runtime.elapsedMs,
                bestMoves: runtime.moveCount
            };
        }

        this.saveData.progress.unlockedLevel = Math.max(this.saveData.progress.unlockedLevel, Math.min(LEVELS.length, this.currentLevelId + 1));
        this.storage.save(this.saveData);
        this.renderLevelGrid();
        this.updateProgressMeta();

        this.resultMode = this.currentLevelId < LEVELS.length ? "next" : "replay";
        this.elements.resultTitle.textContent = this.currentLevelId < LEVELS.length ? "关卡完成" : "全部通关";
        this.elements.resultSummary.textContent = this.currentLevelId < LEVELS.length
            ? "你在迷雾中找到了正确的出口。"
            : "你已经完成全部 20 个迷宫挑战。";
        this.elements.resultTime.textContent = formatTime(runtime.elapsedMs);
        this.elements.resultMoves.textContent = String(runtime.moveCount);
        this.elements.resultPrimaryBtn.textContent = this.currentLevelId < LEVELS.length ? "下一关" : "再次挑战";
        this.showOverlay(this.elements.resultOverlay);
    }

    handleLevelFailed(message) {
        const runtime = this.runtime;
        if (!runtime || runtime.state === "lost") {
            return;
        }
        runtime.state = "lost";
        this.computeVisibility(true);
        this.resultMode = "replay";
        this.elements.resultTitle.textContent = "挑战失败";
        this.elements.resultSummary.textContent = message;
        this.elements.resultTime.textContent = formatTime(runtime.elapsedMs);
        this.elements.resultMoves.textContent = String(runtime.moveCount);
        this.elements.resultPrimaryBtn.textContent = "再试一次";
        this.showOverlay(this.elements.resultOverlay);
    }

    updateHUD() {
        if (!this.runtime) {
            return;
        }

        const runtime = this.runtime;
        const timerBucket = Math.floor(runtime.elapsedMs / 100);
        const buffLabel = this.buffSystem.getLabel();
        if (
            this.elements.levelTitle.textContent === `${runtime.level.code} ${runtime.level.name}` &&
            this.elements.objectiveLabel.textContent === this.getObjectiveStatusText(runtime) &&
            this.elements.timerLabel.dataset.bucket === String(timerBucket) &&
            this.elements.visionLabel.textContent === String(this.getCurrentVisionRadius()) &&
            this.elements.moveCountLabel.textContent === String(runtime.moveCount) &&
            this.elements.buffLabel.textContent === buffLabel
        ) {
            return;
        }

        this.elements.levelTitle.textContent = `${runtime.level.code} ${runtime.level.name}`;
        this.elements.objectiveLabel.textContent = this.getObjectiveStatusText(runtime);
        this.elements.timerLabel.textContent = runtime.level.timerSec
            ? `${formatTime(runtime.elapsedMs)} / ${runtime.level.timerSec}s`
            : formatTime(runtime.elapsedMs);
        this.elements.timerLabel.dataset.bucket = String(timerBucket);
        this.elements.visionLabel.textContent = String(this.getCurrentVisionRadius());
        this.elements.moveCountLabel.textContent = String(runtime.moveCount);
        this.elements.buffLabel.textContent = buffLabel;
    }

    getObjectiveStatusText(runtime) {
        if (runtime.level.objective === "collect-key-and-exit") {
            return `钥匙 ${runtime.player.keys}/1`;
        }
        if (runtime.level.objective === "collect-two-keys-and-exit") {
            return `钥匙 ${runtime.player.keys}/2`;
        }
        if (runtime.level.objective === "activate-plate-and-exit") {
            return runtime.player.plateActivated ? "压板已激活" : "先激活压板";
        }
        if (runtime.level.objective === "final-relay") {
            return `钥匙 ${runtime.player.keys}/2 · ${runtime.player.plateActivated ? "压板已激活" : "待激活压板"}`;
        }
        return "抵达出口";
    }

    getCurrentVisionRadius() {
        if (!this.runtime) {
            return 0;
        }

        const modifiers = this.buffSystem.getActiveModifiers();
        return clamp(this.runtime.level.visionRadius + modifiers.visionBonus, 1, 8);
    }

    bumpFeedback() {
        this.softVibrate(12);
    }

    softVibrate(duration) {
        if (this.saveData.settings.vibration && navigator.vibrate) {
            navigator.vibrate(duration);
        }
    }

    flashMessage(message) {
        this.elements.swipeHint.textContent = message;
        this.elements.swipeHint.classList.toggle("hidden", !message);
        clearTimeout(this.messageTimeout);
        if (!message) {
            return;
        }
        this.messageTimeout = setTimeout(() => {
            this.elements.swipeHint.textContent = "";
            this.elements.swipeHint.classList.add("hidden");
        }, 1600);
    }

    gameLoop(frameTime) {
        const deltaMs = frameTime - this.lastFrameTime;
        this.lastFrameTime = frameTime;

        if (this.runtime && this.currentScreen === "gameScreen") {
            this.updateRuntime(deltaMs);
            this.render();
        }

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    updateRuntime(deltaMs) {
        const runtime = this.runtime;
        if (!runtime) {
            return;
        }

        if (runtime.state === "playing") {
            if (runtime.started) {
                runtime.elapsedMs += deltaMs;
            }

            if (runtime.level.timerSec && runtime.elapsedMs >= runtime.level.timerSec * 1000) {
                this.handleLevelFailed("倒计时归零，迷宫封锁了出口。");
                return;
            }

            const expired = this.buffSystem.tick(deltaMs);
            if (expired.length) {
                this.computeVisibility();
            }

            if (runtime.player.moving) {
                runtime.player.moving.elapsedMs += deltaMs;
                if (runtime.player.moving.elapsedMs >= runtime.player.moving.durationMs) {
                    this.completeMove();
                }
            }
            const currentBucket = Math.floor(runtime.elapsedMs / 100);
            if (this.lastHudRenderMs !== currentBucket) {
                this.lastHudRenderMs = currentBucket;
                this.updateHUD();
            }
        }
    }

    render() {
        if (!this.runtime) {
            return;
        }

        const runtime = this.runtime;
        const ctx = this.ctx;
        const width = this.canvas.clientWidth;
        const height = this.canvas.clientHeight;
        const padding = 18;
        const cols = runtime.level.cols;
        const rows = runtime.level.rows;
        const cellSize = Math.min((width - padding * 2) / cols, (height - padding * 2) / rows);
        if (!Number.isFinite(cellSize) || cellSize <= 1) {
            return;
        }
        const boardWidth = cellSize * cols;
        const boardHeight = cellSize * rows;
        const offsetX = (width - boardWidth) / 2;
        const offsetY = (height - boardHeight) / 2;

        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = "#07111b";
        ctx.fillRect(0, 0, width, height);

        ctx.save();
        ctx.translate(offsetX, offsetY);

        for (let row = 0; row < rows; row += 1) {
            for (let col = 0; col < cols; col += 1) {
                const cell = runtime.grid[row][col];
                const x = col * cellSize;
                const y = row * cellSize;

                this.drawCell(cell, x, y, cellSize);
                this.drawSpecials(row, col, x, y, cellSize);
                this.drawWalls(cell, x, y, cellSize);
            }
        }

        this.drawPlayer(cellSize);
        ctx.restore();
    }

    drawCell(cell, x, y, size) {
        const ctx = this.ctx;
        const visible = cell.visibility === "visible";
        const explored = cell.visibility === "explored";
        if (size <= 1) {
            return;
        }
        let fill = "#07111b";
        const visibilityStrength = visible ? (cell.visibilityStrength ?? 1) : explored ? 0.22 : 0;

        if (visible) {
            const colors = {
                floor: "#1f3145",
                mud: "#3d3a2a",
                beacon: "#15394a",
                trap: "#372037",
                plate: "#2f3b1d",
                exit: "#223920",
                teleport: "#1a2647",
                key: "#3c3117"
            };
            fill = colors[cell.tile] || "#22384d";
        } else if (explored) {
            fill = "#111a23";
        }

        ctx.fillStyle = fill;
        ctx.fillRect(x, y, size, size);

        if (visible) {
            const fogAlpha = clamp(0.76 - visibilityStrength * 0.7, 0.08, 0.68);
            ctx.fillStyle = `rgba(2, 7, 14, ${fogAlpha})`;
            ctx.fillRect(x, y, size, size);

            const edgeAlpha = clamp(0.03 + visibilityStrength * 0.08, 0.03, 0.11);
            ctx.fillStyle = `rgba(255, 255, 255, ${edgeAlpha})`;
            ctx.fillRect(x, y, size, size * 0.06);
        } else if (explored) {
            ctx.fillStyle = "rgba(2, 7, 14, 0.48)";
            ctx.fillRect(x, y, size, size);
        } else {
            ctx.fillStyle = "rgba(0, 0, 0, 0.86)";
            ctx.fillRect(x, y, size, size);
        }
    }

    drawSpecials(row, col, x, y, size) {
        const ctx = this.ctx;
        const cell = this.runtime.grid[row][col];
        if (cell.visibility === "hidden") {
            return;
        }

        const key = cellKey(row, col);
        const centerX = x + size / 2;
        const centerY = y + size / 2;
        const dimmed = cell.visibility === "explored";
        const visibilityStrength = cell.visibility === "visible" ? (cell.visibilityStrength ?? 1) : 0.3;

        const withAlpha = (alpha) => {
            ctx.globalAlpha = alpha;
        };

        if (this.runtime.features.keys.has(key)) {
            withAlpha(dimmed ? 0.45 : Math.max(0.32, visibilityStrength));
            ctx.fillStyle = "#f8d15f";
            ctx.beginPath();
            ctx.arc(centerX, centerY, size * 0.16, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(centerX - size * 0.05, centerY - size * 0.02, size * 0.28, size * 0.06);
            ctx.globalAlpha = 1;
        }

        const beacon = this.runtime.features.beacons.get(key);
        if (beacon) {
            withAlpha(dimmed ? 0.35 : beacon.used ? 0.45 : Math.max(0.4, visibilityStrength));
            ctx.strokeStyle = "#66d9d2";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size * 0.2, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - size * 0.24);
            ctx.lineTo(centerX, centerY + size * 0.24);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        if (this.runtime.features.teleports.has(key)) {
            withAlpha(dimmed ? 0.35 : Math.max(0.4, visibilityStrength));
            ctx.strokeStyle = "#8da8ff";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size * 0.22, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(centerX, centerY, size * 0.07, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }

        const door = this.runtime.features.doors.get(key);
        if (door && !door.open) {
            withAlpha(dimmed ? 0.4 : Math.max(0.48, visibilityStrength));
            ctx.fillStyle = door.requiresPlate ? "#7ce38b" : "#ff8a3d";
            ctx.fillRect(x + size * 0.2, y + size * 0.22, size * 0.6, size * 0.56);
            ctx.fillStyle = "#0f1721";
            ctx.fillRect(x + size * 0.44, y + size * 0.44, size * 0.1, size * 0.14);
            ctx.globalAlpha = 1;
        }

        if (this.runtime.features.plate && this.runtime.features.plate.key === key) {
            withAlpha(dimmed ? 0.35 : this.runtime.player.plateActivated ? Math.max(0.46, visibilityStrength) : Math.max(0.56, visibilityStrength));
            ctx.fillStyle = this.runtime.player.plateActivated ? "#7ce38b" : "#b8d36c";
            ctx.fillRect(x + size * 0.22, y + size * 0.6, size * 0.56, size * 0.12);
            ctx.globalAlpha = 1;
        }

        if (this.runtime.features.exit.key === key) {
            withAlpha(dimmed ? 0.4 : Math.max(0.5, visibilityStrength));
            ctx.fillStyle = "#8bd8a0";
            ctx.fillRect(x + size * 0.2, y + size * 0.18, size * 0.16, size * 0.62);
            ctx.fillRect(x + size * 0.28, y + size * 0.18, size * 0.38, size * 0.14);
            ctx.globalAlpha = 1;
        }
    }

    drawWalls(cell, x, y, size) {
        if (cell.visibility === "hidden") {
            return;
        }

        const ctx = this.ctx;
        const visibilityStrength = cell.visibility === "visible" ? (cell.visibilityStrength ?? 1) : 0.3;
        ctx.strokeStyle = cell.visibility === "visible"
            ? `rgba(213, 227, 255, ${0.18 + visibilityStrength * 0.82})`
            : "#445165";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (cell.walls.top) {
            ctx.moveTo(x, y);
            ctx.lineTo(x + size, y);
        }
        if (cell.walls.right) {
            ctx.moveTo(x + size, y);
            ctx.lineTo(x + size, y + size);
        }
        if (cell.walls.bottom) {
            ctx.moveTo(x, y + size);
            ctx.lineTo(x + size, y + size);
        }
        if (cell.walls.left) {
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + size);
        }
        ctx.stroke();
    }

    drawPlayer(size) {
        if (size <= 1) {
            return;
        }
        const ctx = this.ctx;
        const runtime = this.runtime;
        let row = runtime.player.row;
        let col = runtime.player.col;

        if (runtime.player.moving) {
            const progress = clamp(runtime.player.moving.elapsedMs / runtime.player.moving.durationMs, 0, 1);
            row = runtime.player.moving.fromRow + (runtime.player.moving.toRow - runtime.player.moving.fromRow) * progress;
            col = runtime.player.moving.fromCol + (runtime.player.moving.toCol - runtime.player.moving.fromCol) * progress;
        }

        const centerX = col * size + size / 2;
        const centerY = row * size + size / 2;

        ctx.save();
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = "#ffc857";
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(16, size * 0.7), 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.fillStyle = "#ffc857";
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(4, size * 0.24), 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(centerX, centerY, Math.max(2, size * 0.08), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    createLevelRuntime(level) {
        const rng = new SeededRandom(level.seed);
        const grid = this.createGrid(level.rows, level.cols);
        if (level.generator === "prim") {
            this.generatePrimMaze(grid, rng);
        } else {
            this.generateDfsMaze(grid, rng);
        }

        this.injectLoops(grid, rng, level.id < 8 ? 0.015 : level.id < 14 ? 0.028 : 0.04);
        const farthestA = this.findFarthestCell(grid, { row: 0, col: 0 });
        const farthestB = this.findFarthestCell(grid, farthestA);
        const start = farthestA;
        const exit = farthestB;
        const pathToExit = this.shortestPath(grid, start, exit);

        const runtime = {
            level,
            rng,
            grid,
            start,
            exit,
            pathToExit,
            state: "playing",
            started: false,
            elapsedMs: 0,
            moveCount: 0,
            player: {
                row: start.row,
                col: start.col,
                moving: null,
                baseMoveDuration: 120,
                keys: 0,
                plateActivated: false
            },
            features: {
                keys: new Set(),
                doors: new Map(),
                beacons: new Map(),
                teleports: new Map(),
                darkTraps: new Set(),
                oneWayBlocked: new Set(),
                exit: { key: cellKey(exit.row, exit.col) },
                plate: null
            }
        };

        runtime.grid[start.row][start.col].tile = "floor";
        runtime.grid[exit.row][exit.col].tile = "exit";
        this.decorateLevel(runtime);
        this.computeVisibilityForRuntime(runtime);
        return runtime;
    }

    createGrid(rows, cols) {
        return Array.from({ length: rows }, (_, row) => Array.from({ length: cols }, (_, col) => ({
            row,
            col,
            walls: {
                top: true,
                right: true,
                bottom: true,
                left: true
            },
            visibility: "hidden",
            tile: "floor"
        })));
    }

    generateDfsMaze(grid, rng) {
        const rows = grid.length;
        const cols = grid[0].length;
        const visited = new Set();
        const stack = [{ row: 0, col: 0 }];
        visited.add(cellKey(0, 0));

        while (stack.length) {
            const current = stack[stack.length - 1];
            const neighbors = this.getNeighborCandidates(rows, cols, current.row, current.col)
                .filter((neighbor) => !visited.has(cellKey(neighbor.row, neighbor.col)));

            if (!neighbors.length) {
                stack.pop();
                continue;
            }

            const next = rng.pick(neighbors);
            this.carvePassage(grid, current, next);
            visited.add(cellKey(next.row, next.col));
            stack.push(next);
        }
    }

    generatePrimMaze(grid, rng) {
        const rows = grid.length;
        const cols = grid[0].length;
        const visited = new Set([cellKey(0, 0)]);
        const frontier = this.getNeighborCandidates(rows, cols, 0, 0).map((neighbor) => ({ from: { row: 0, col: 0 }, to: neighbor }));

        while (frontier.length) {
            const choiceIndex = rng.nextInt(frontier.length);
            const edge = frontier.splice(choiceIndex, 1)[0];
            if (visited.has(cellKey(edge.to.row, edge.to.col))) {
                continue;
            }

            this.carvePassage(grid, edge.from, edge.to);
            visited.add(cellKey(edge.to.row, edge.to.col));

            this.getNeighborCandidates(rows, cols, edge.to.row, edge.to.col).forEach((neighbor) => {
                if (!visited.has(cellKey(neighbor.row, neighbor.col))) {
                    frontier.push({ from: edge.to, to: neighbor });
                }
            });
        }
    }

    injectLoops(grid, rng, rate) {
        const rows = grid.length;
        const cols = grid[0].length;
        const openings = Math.max(1, Math.floor(rows * cols * rate));
        for (let index = 0; index < openings; index += 1) {
            const row = rng.nextInt(rows);
            const col = rng.nextInt(cols);
            const neighbors = this.getNeighborCandidates(rows, cols, row, col);
            const target = rng.pick(neighbors);
            const cell = grid[row][col];
            const direction = this.getDirectionFromCells({ row, col }, target);
            if (direction && cell.walls[direction.wall]) {
                this.carvePassage(grid, { row, col }, target);
            }
        }
    }

    getNeighborCandidates(rows, cols, row, col) {
        return Object.values(DIRS)
            .map((dir) => ({ row: row + dir.dr, col: col + dir.dc }))
            .filter((candidate) => candidate.row >= 0 && candidate.row < rows && candidate.col >= 0 && candidate.col < cols);
    }

    carvePassage(grid, from, to) {
        const dir = this.getDirectionFromCells(from, to);
        if (!dir) {
            return;
        }
        grid[from.row][from.col].walls[dir.wall] = false;
        grid[to.row][to.col].walls[dir.opposite] = false;
    }

    getDirectionFromCells(from, to) {
        return Object.values(DIRS).find((dir) => from.row + dir.dr === to.row && from.col + dir.dc === to.col) || null;
    }

    shortestPath(grid, start, goal) {
        const queue = [start];
        const visited = new Set([cellKey(start.row, start.col)]);
        const parent = new Map();

        while (queue.length) {
            const current = queue.shift();
            if (current.row === goal.row && current.col === goal.col) {
                const path = [];
                let cursor = goal;
                while (cursor) {
                    path.unshift(cursor);
                    cursor = parent.get(cellKey(cursor.row, cursor.col));
                }
                return path;
            }

            this.getOpenNeighbors(grid, current.row, current.col).forEach((neighbor) => {
                const key = cellKey(neighbor.row, neighbor.col);
                if (!visited.has(key)) {
                    visited.add(key);
                    parent.set(key, current);
                    queue.push(neighbor);
                }
            });
        }

        return [start];
    }

    getOpenNeighbors(grid, row, col) {
        const cell = grid[row][col];
        return Object.entries(DIRS)
            .filter(([, dir]) => !cell.walls[dir.wall])
            .map(([, dir]) => ({ row: row + dir.dr, col: col + dir.dc }))
            .filter((neighbor) => neighbor.row >= 0 && neighbor.row < grid.length && neighbor.col >= 0 && neighbor.col < grid[0].length);
    }

    getCellDegree(grid, row, col) {
        return this.getOpenNeighbors(grid, row, col).length;
    }

    findFarthestCell(grid, start) {
        const queue = [{ ...start, distance: 0 }];
        const visited = new Set([cellKey(start.row, start.col)]);
        let farthest = start;
        let farthestDistance = 0;

        while (queue.length) {
            const current = queue.shift();
            if (current.distance > farthestDistance) {
                farthest = { row: current.row, col: current.col };
                farthestDistance = current.distance;
            }

            this.getOpenNeighbors(grid, current.row, current.col).forEach((neighbor) => {
                const key = cellKey(neighbor.row, neighbor.col);
                if (!visited.has(key)) {
                    visited.add(key);
                    queue.push({ ...neighbor, distance: current.distance + 1 });
                }
            });
        }

        return farthest;
    }

    decorateLevel(runtime) {
        const avoid = new Set([
            cellKey(runtime.start.row, runtime.start.col),
            cellKey(runtime.exit.row, runtime.exit.col)
        ]);

        const placeOnPath = (ratio, offset = 0) => {
            const index = clamp(Math.floor(runtime.pathToExit.length * ratio) + offset, 1, runtime.pathToExit.length - 2);
            const cell = runtime.pathToExit[index];
            avoid.add(cellKey(cell.row, cell.col));
            return cell;
        };

        const placeRandomFloor = (count, { preferFar = false, skipPath = false, minDegree = 0 } = {}) => {
            const candidates = [];
            for (let row = 0; row < runtime.level.rows; row += 1) {
                for (let col = 0; col < runtime.level.cols; col += 1) {
                    const key = cellKey(row, col);
                    if (avoid.has(key)) {
                        continue;
                    }
                    if (skipPath && runtime.pathToExit.some((item) => item.row === row && item.col === col)) {
                        continue;
                    }
                    if (this.getCellDegree(runtime.grid, row, col) < minDegree) {
                        continue;
                    }
                    candidates.push({ row, col, score: Math.abs(row - runtime.start.row) + Math.abs(col - runtime.start.col) });
                }
            }

            const ordered = preferFar
                ? candidates.sort((a, b) => b.score - a.score)
                : runtime.rng.shuffle(candidates);
            const result = ordered.slice(0, count);
            result.forEach((cell) => avoid.add(cellKey(cell.row, cell.col)));
            return result;
        };

        if (runtime.level.objective === "collect-key-and-exit" || runtime.level.objective === "collect-two-keys-and-exit" || runtime.level.objective === "final-relay") {
            const keyCount = runtime.level.objective === "collect-two-keys-and-exit" || runtime.level.objective === "final-relay" ? 2 : 1;
            for (let index = 0; index < keyCount; index += 1) {
                const keyCell = placeOnPath(0.24 + index * 0.18);
                runtime.features.keys.add(cellKey(keyCell.row, keyCell.col));
                runtime.grid[keyCell.row][keyCell.col].tile = "key";
            }

            const doorCell = runtime.level.objective === "final-relay"
                ? runtime.exit
                : placeOnPath(0.72);
            runtime.features.doors.set(cellKey(doorCell.row, doorCell.col), {
                requiredKeys: keyCount,
                open: false,
                requiresPlate: false
            });
        }

        if (runtime.level.objective === "activate-plate-and-exit") {
            const plateCell = placeOnPath(0.45);
            runtime.features.plate = { key: cellKey(plateCell.row, plateCell.col) };
            runtime.grid[plateCell.row][plateCell.col].tile = "plate";
            runtime.features.doors.set(cellKey(runtime.exit.row, runtime.exit.col), {
                requiredKeys: 0,
                open: false,
                requiresPlate: true
            });
        }

        if (runtime.level.objective === "final-relay") {
            const plateCell = placeOnPath(0.52, 1);
            runtime.features.plate = { key: cellKey(plateCell.row, plateCell.col) };
            runtime.grid[plateCell.row][plateCell.col].tile = "plate";
            runtime.features.doors.set(cellKey(runtime.exit.row, runtime.exit.col), {
                requiredKeys: 2,
                open: false,
                requiresPlate: true
            });
        }

        if (runtime.level.challengeTags.includes("beacon") || runtime.level.challengeTags.includes("multi-beacon") || runtime.level.challengeTags.includes("buff-validation")) {
            const beaconCount = runtime.level.challengeTags.includes("multi-beacon") ? 3 : 1;
            const beaconCells = placeRandomFloor(beaconCount, { preferFar: true });
            beaconCells.forEach((cell, index) => {
                const key = cellKey(cell.row, cell.col);
                runtime.grid[cell.row][cell.col].tile = "beacon";
                runtime.features.beacons.set(key, {
                    used: false,
                    durationMs: 4200 + index * 1200,
                    modifiers: index === 0 && runtime.level.id >= 15
                        ? { revealAll: true, moveDurationMultiplier: 0.82 }
                        : { revealAll: true },
                    label: index === 0 && runtime.level.id >= 15 ? "灯塔疾行" : "全图视野",
                    message: index === 0 && runtime.level.id >= 15 ? "灯塔点亮迷宫，并带来短暂疾行" : "信标点亮了整张地图"
                });
            });
        }

        if (runtime.level.challengeTags.includes("slow-tiles")) {
            placeRandomFloor(Math.max(5, Math.floor(runtime.level.rows / 2)), { skipPath: false }).forEach((cell) => {
                runtime.grid[cell.row][cell.col].tile = "mud";
            });
        }

        if (runtime.level.challengeTags.includes("vision-debuff") || runtime.level.challengeTags.includes("trap-tiles")) {
            placeRandomFloor(Math.max(4, Math.floor(runtime.level.rows / 3)), { skipPath: true }).forEach((cell) => {
                const key = cellKey(cell.row, cell.col);
                runtime.grid[cell.row][cell.col].tile = "trap";
                runtime.features.darkTraps.add(key);
            });
        }

        if (runtime.level.challengeTags.includes("teleport-pair") || runtime.level.challengeTags.includes("teleport-chain") || runtime.level.challengeTags.includes("teleport-pair")) {
            const pairCount = runtime.level.challengeTags.includes("teleport-chain") ? 2 : 1;
            let teleportCells = placeRandomFloor(pairCount * 2, { preferFar: true, skipPath: true, minDegree: 2 });
            if (teleportCells.length < pairCount * 2) {
                teleportCells = placeRandomFloor(pairCount * 2, { preferFar: true, skipPath: false, minDegree: 2 });
            }
            for (let index = 0; index < teleportCells.length; index += 2) {
                const from = teleportCells[index];
                const to = teleportCells[index + 1];
                if (!from || !to) {
                    continue;
                }
                runtime.grid[from.row][from.col].tile = "teleport";
                runtime.grid[to.row][to.col].tile = "teleport";
                runtime.features.teleports.set(cellKey(from.row, from.col), {
                    target: { row: to.row, col: to.col },
                    uses: -1
                });
                runtime.features.teleports.set(cellKey(to.row, to.col), {
                    target: { row: from.row, col: from.col },
                    uses: -1
                });
            }
        }

        if (runtime.level.challengeTags.includes("one-way-gate")) {
            const gateCells = runtime.pathToExit.slice(Math.floor(runtime.pathToExit.length * 0.35), Math.floor(runtime.pathToExit.length * 0.65));
            for (let index = 1; index < gateCells.length; index += 3) {
                const prev = gateCells[index - 1];
                const next = gateCells[index];
                runtime.features.oneWayBlocked.add(edgeKey(next.row, next.col, prev.row, prev.col));
            }
        }

        if (runtime.level.challengeTags.includes("hidden-shortcut")) {
            this.injectLoops(runtime.grid, runtime.rng, 0.05);
        }
    }

    computeVisibility(forceReveal = false) {
        if (this.runtime) {
            this.computeVisibilityForRuntime(this.runtime, forceReveal);
        }
    }

    computeVisibilityForRuntime(runtime, forceReveal = false) {
        const modifiers = this.buffSystem.getActiveModifiers();
        const revealAll = forceReveal || modifiers.revealAll;
        const radius = clamp(runtime.level.visionRadius + modifiers.visionBonus, 1, 8);

        runtime.grid.flat().forEach((cell) => {
            if (cell.visibility === "visible") {
                cell.visibility = this.saveData.settings.rememberFog ? "explored" : "hidden";
            }
            cell.visibilityStrength = 0;
        });

        if (revealAll) {
            runtime.grid.flat().forEach((cell) => {
                cell.visibility = "visible";
                cell.visibilityStrength = 1;
            });
            return;
        }

        for (let row = 0; row < runtime.level.rows; row += 1) {
            for (let col = 0; col < runtime.level.cols; col += 1) {
                const distance = Math.hypot((row + 0.5) - (runtime.player.row + 0.5), (col + 0.5) - (runtime.player.col + 0.5));
                if (distance > radius + 0.35) {
                    continue;
                }
                runtime.grid[row][col].visibility = "visible";
                const normalized = clamp(distance / Math.max(radius, 0.001), 0, 1);
                const eased = 1 - Math.pow(normalized, 1.85);
                runtime.grid[row][col].visibilityStrength = clamp(0.16 + eased * 0.84, 0.16, 1);
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    new MobileMazeGame();
});
