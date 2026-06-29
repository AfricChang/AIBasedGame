import test from "node:test";
import assert from "node:assert/strict";

import { LEVELS } from "../levels.js";
import {
    AudioService,
    BuffSystem,
    DEFAULT_SAVE,
    DIRS,
    MobileMazeGame,
    StorageService,
    cellKey,
    edgeKey,
    parseEdgeKey
} from "../game.js";

function createGameHarness(settings = {}) {
    const game = Object.create(MobileMazeGame.prototype);
    game.saveData = {
        settings: {
            ...DEFAULT_SAVE.settings,
            ...settings
        },
        progress: {
            ...DEFAULT_SAVE.progress,
            completedLevels: {}
        }
    };
    game.buffSystem = new BuffSystem();
    game.audio = { play() {}, unlock() {} };
    return game;
}

function createRuntime(levelId, settings = {}) {
    const level = LEVELS.find((item) => item.id === levelId);
    assert.ok(level, `Missing level ${levelId}`);
    return createGameHarness(settings).createLevelRuntime(level);
}

function countBits(value) {
    let count = 0;
    let cursor = value;
    while (cursor) {
        count += cursor & 1;
        cursor >>= 1;
    }
    return count;
}

function solveRuntime(runtime) {
    const keyList = [...runtime.features.keys];
    const keyIndexes = new Map(keyList.map((key, index) => [key, index]));
    const allKeysMask = keyList.length ? (1 << keyList.length) - 1 : 0;
    const plateKey = runtime.features.plate?.key || null;

    const applyEntryEffects = (row, col, keyMask, plateActivated) => {
        const visited = new Set();
        let currentRow = row;
        let currentCol = col;
        let nextKeyMask = keyMask;
        let nextPlateActivated = plateActivated;
        let teleportedThisStep = false;

        while (true) {
            const key = cellKey(currentRow, currentCol);
            if (visited.has(key)) {
                break;
            }
            visited.add(key);

            if (keyIndexes.has(key)) {
                nextKeyMask |= 1 << keyIndexes.get(key);
            }
            if (plateKey && plateKey === key) {
                nextPlateActivated = true;
            }

            const teleport = runtime.features.teleports.get(key);
            if (!teleportedThisStep && teleport?.target && teleport.uses !== 0) {
                currentRow = teleport.target.row;
                currentCol = teleport.target.col;
                teleportedThisStep = true;
                continue;
            }

            break;
        }

        return {
            row: currentRow,
            col: currentCol,
            keyMask: nextKeyMask,
            plateActivated: nextPlateActivated
        };
    };

    const isWin = (state) => {
        if (state.row !== runtime.exit.row || state.col !== runtime.exit.col) {
            return false;
        }

        switch (runtime.level.objective) {
            case "collect-key-and-exit":
            case "collect-two-keys-and-exit":
                return state.keyMask === allKeysMask;
            case "activate-plate-and-exit":
                return state.plateActivated;
            case "final-relay":
                return state.keyMask === allKeysMask && state.plateActivated;
            case "reach-exit":
            default:
                return true;
        }
    };

    const stateKey = (state) => `${state.row},${state.col}|${state.keyMask}|${state.plateActivated ? 1 : 0}`;
    const startState = applyEntryEffects(runtime.start.row, runtime.start.col, 0, false);
    const queue = [{ ...startState, moves: 0 }];
    const visited = new Set([stateKey(startState)]);

    for (let head = 0; head < queue.length; head += 1) {
        const state = queue[head];
        if (isWin(state)) {
            return { reachable: true, moves: state.moves, visitedStates: visited.size };
        }

        const cell = runtime.grid[state.row][state.col];
        for (const dir of Object.values(DIRS)) {
            if (cell.walls[dir.wall]) {
                continue;
            }
            const nextRow = state.row + dir.dr;
            const nextCol = state.col + dir.dc;
            if (nextRow < 0 || nextRow >= runtime.level.rows || nextCol < 0 || nextCol >= runtime.level.cols) {
                continue;
            }
            if (runtime.features.oneWayBlocked.has(edgeKey(state.row, state.col, nextRow, nextCol))) {
                continue;
            }

            const door = runtime.features.doors.get(cellKey(nextRow, nextCol));
            if (door) {
                if (countBits(state.keyMask) < door.requiredKeys) {
                    continue;
                }
                if (door.requiresPlate && !state.plateActivated) {
                    continue;
                }
            }

            const nextState = applyEntryEffects(nextRow, nextCol, state.keyMask, state.plateActivated);
            const key = stateKey(nextState);
            if (!visited.has(key)) {
                visited.add(key);
                queue.push({ ...nextState, moves: state.moves + 1 });
            }
        }
    }

    return { reachable: false, moves: null, visitedStates: visited.size };
}

function countTiles(runtime, tile) {
    return runtime.grid.flat().filter((cell) => cell.tile === tile).length;
}

test("level definitions have stable ids and required fields", () => {
    assert.equal(LEVELS.length, 20);
    assert.deepEqual(LEVELS.map((level) => level.id), Array.from({ length: 20 }, (_, index) => index + 1));

    for (const level of LEVELS) {
        assert.match(level.code, /^L\d{2}$/);
        assert.ok(level.name);
        assert.ok(level.rows > 0);
        assert.ok(level.cols > 0);
        assert.ok(["dfs", "prim"].includes(level.generator));
        assert.equal(typeof level.seed, "number");
        assert.equal(typeof level.visionRadius, "number");
        assert.ok(Array.isArray(level.challengeTags));
        assert.equal(typeof level.targetTimeSec, "number");
        assert.equal(typeof level.targetMoves, "number");
    }
});

test("all generated levels are mechanically solvable", () => {
    for (const level of LEVELS) {
        const runtime = createRuntime(level.id);
        const result = solveRuntime(runtime);
        assert.equal(result.reachable, true, `${level.code} ${level.name} should be solvable`);
        assert.ok(result.moves !== null && result.moves > 0, `${level.code} should have a non-empty solution`);
    }
});

test("challenge tags create the currently implemented feature types", () => {
    for (const level of LEVELS) {
        const runtime = createRuntime(level.id);
        const tags = level.challengeTags;

        if (tags.includes("one-way-gate")) {
            assert.ok(runtime.features.oneWayBlocked.size > 0, `${level.code} should have one-way gates`);
        }
        if (tags.includes("teleport-pair")) {
            assert.ok(runtime.features.teleports.size >= 2, `${level.code} should have a teleport pair`);
        }
        if (tags.includes("teleport-chain")) {
            assert.ok(runtime.features.teleports.size >= 4, `${level.code} should have a teleport chain`);
        }
        if (tags.includes("multi-beacon")) {
            assert.equal(runtime.features.beacons.size, 3, `${level.code} should have three beacons`);
        }
        if (tags.includes("beacon") || tags.includes("buff-validation")) {
            assert.ok(runtime.features.beacons.size >= 1, `${level.code} should have a beacon`);
        }
        if (tags.includes("slow-tiles")) {
            assert.ok(countTiles(runtime, "mud") > 0, `${level.code} should have mud tiles`);
        }
        if (tags.includes("vision-debuff") || tags.includes("trap-tiles")) {
            assert.ok(runtime.features.darkTraps.size > 0, `${level.code} should have dark traps`);
        }
        if (level.objective === "activate-plate-and-exit" || level.objective === "final-relay") {
            assert.ok(runtime.features.plate, `${level.code} should have a pressure plate`);
        }
    }
});

test("one-way gates block only the stored directed edge", () => {
    const runtime = createRuntime(9);
    assert.ok(runtime.features.oneWayBlocked.size > 0);

    for (const key of runtime.features.oneWayBlocked) {
        const edge = parseEdgeKey(key);
        assert.ok(edge);
        assert.equal(Math.abs(edge.fromRow - edge.toRow) + Math.abs(edge.fromCol - edge.toCol), 1);
        assert.equal(runtime.features.oneWayBlocked.has(edgeKey(edge.toRow, edge.toCol, edge.fromRow, edge.fromCol)), false);
    }
});

test("visibility supports reveal all and explored memory", () => {
    const game = createGameHarness({ rememberFog: true });
    const runtime = game.createLevelRuntime(LEVELS[0]);
    const initiallyVisible = runtime.grid.flat().filter((cell) => cell.visibility === "visible").length;
    assert.ok(initiallyVisible > 0);

    runtime.player.row = runtime.exit.row;
    runtime.player.col = runtime.exit.col;
    game.computeVisibilityForRuntime(runtime);
    const explored = runtime.grid.flat().filter((cell) => cell.visibility === "explored").length;
    assert.ok(explored > 0);

    game.computeVisibilityForRuntime(runtime, true);
    assert.equal(runtime.grid.flat().every((cell) => cell.visibility === "visible"), true);
});

test("visibility can forget old cells when rememberFog is disabled", () => {
    const game = createGameHarness({ rememberFog: false });
    const runtime = game.createLevelRuntime(LEVELS[0]);
    runtime.player.row = runtime.exit.row;
    runtime.player.col = runtime.exit.col;
    game.computeVisibilityForRuntime(runtime);
    assert.equal(runtime.grid.flat().some((cell) => cell.visibility === "explored"), false);
});

test("buff system refreshes, expires, and aggregates modifiers", () => {
    const buffs = new BuffSystem();
    buffs.add({
        id: "beacon",
        label: "Beacon",
        durationMs: 100,
        stackMode: "refresh",
        modifiers: { revealAll: true, visionBonus: 2, moveDurationMultiplier: 0.8 }
    });
    buffs.add({
        id: "beacon",
        label: "Beacon",
        durationMs: 50,
        stackMode: "refresh",
        modifiers: { revealAll: true, visionBonus: 1, moveDurationMultiplier: 0.9 }
    });
    buffs.add({
        id: "speed",
        label: "Speed",
        durationMs: 80,
        stackMode: "refresh",
        modifiers: { moveDurationMultiplier: 0.5 }
    });

    assert.equal(buffs.buffs.length, 2);
    assert.equal(buffs.buffs.find((buff) => buff.id === "beacon").remainingMs, 100);
    assert.deepEqual(buffs.getActiveModifiers(), {
        revealAll: true,
        visionBonus: 2,
        moveDurationMultiplier: 0.4
    });

    const expired = buffs.tick(101);
    assert.deepEqual(expired.map((buff) => buff.id).sort(), ["beacon", "speed"]);
    assert.deepEqual(buffs.getActiveModifiers(), {
        revealAll: false,
        visionBonus: 0,
        moveDurationMultiplier: 1
    });
});

test("storage merges defaults for old saves and recovers from malformed data", () => {
    const originalWindow = globalThis.window;
    const originalWarn = console.warn;
    const values = new Map();
    globalThis.window = {
        localStorage: {
            getItem: (key) => values.get(key) ?? null,
            setItem: (key, value) => values.set(key, value)
        }
    };

    try {
        const storage = new StorageService();
        values.set("mobileMazeGame.save.v1", JSON.stringify({
            settings: { showDpad: false },
            progress: { unlockedLevel: 4 }
        }));

        const loaded = storage.load();
        assert.equal(loaded.settings.showDpad, false);
        assert.equal(loaded.settings.sound, true);
        assert.equal(loaded.settings.vibration, true);
        assert.equal(loaded.progress.unlockedLevel, 4);
        assert.deepEqual(loaded.progress.completedLevels, {});

        values.set("mobileMazeGame.save.v1", "{not-json");
        console.warn = () => {};
        assert.deepEqual(storage.load(), DEFAULT_SAVE);
    } finally {
        console.warn = originalWarn;
        if (originalWindow === undefined) {
            delete globalThis.window;
        } else {
            globalThis.window = originalWindow;
        }
    }
});

test("disabled audio does not create an audio context", () => {
    const audio = new AudioService(() => false);
    audio.play("win");
    assert.equal(audio.context, null);
});

test.skip("visibility should respect wall blocking once grid-raycast is implemented");

test.skip("design-only challenge tags should be reconciled with generated mechanics");
