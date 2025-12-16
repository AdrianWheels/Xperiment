import { STAGE_W, STAGE_H, TYPE } from '../config.js';

export let grid = new Uint8Array(STAGE_W * STAGE_H).fill(TYPE.EMPTY);
export let wallHealth = new Uint8Array(STAGE_W * STAGE_H).fill(0);

export function setCell(x, y, type) {
    if (x >= 0 && x < STAGE_W && y >= 0 && y < STAGE_H) grid[y * STAGE_W + x] = type;
}

export function getCell(x, y) {
    if (x >= 0 && x < STAGE_W && y >= 0 && y < STAGE_H) return grid[y * STAGE_W + x];
    return TYPE.WALL;
}

export function damageWall(x, y, amount) {
    if (x >= 0 && x < STAGE_W && y >= 0 && y < STAGE_H) {
        const idx = y * STAGE_W + x;
        if (grid[idx] === TYPE.WALL) {
            if (wallHealth[idx] > 0) {
                wallHealth[idx] -= amount;
                if (wallHealth[idx] <= 0) {
                    grid[idx] = TYPE.EMPTY;
                }
            }
        }
    }
}

export function drawCircle(cx, cy, r, type) {
    for (let y = -r; y <= r; y++)
        for (let x = -r; x <= r; x++)
            if (x * x + y * y <= r * r) setCell(cx + x, cy + y, type);
}

export function getGrid() {
    return { getCellType: getCell };
}

export function initGrid() {
    grid.fill(TYPE.EMPTY);
    wallHealth.fill(0);
    // Walls
    const margin = 10;
    for (let y = 0; y < STAGE_H; y++) {
        for (let x = 0; x < STAGE_W; x++) {
            if (x < margin || x > STAGE_W - margin || y < margin || y > STAGE_H - margin) {
                setCell(x, y, TYPE.WALL);
                wallHealth[y * STAGE_W + x] = 6; // Softer walls
            }
        }
    }
}

export function updateSand(simulationSpeed) {
    for (let i = 0; i < 2000 * simulationSpeed; i++) {
        const rx = Math.floor(Math.random() * STAGE_W);
        const ry = Math.floor(Math.random() * STAGE_H);
        const cell = grid[ry * STAGE_W + rx];
        if (cell > TYPE.WALL) {
            // Top-down view: spread particles slightly instead of falling
            const dirX = Math.floor(Math.random() * 3) - 1; // -1,0,1
            const dirY = Math.floor(Math.random() * 3) - 1;
            const nx = rx + dirX;
            const ny = ry + dirY;
            if (nx >= 0 && nx < STAGE_W && ny >= 0 && ny < STAGE_H) {
                if (grid[ny * STAGE_W + nx] === TYPE.EMPTY) {
                    grid[ry * STAGE_W + rx] = TYPE.EMPTY;
                    grid[ny * STAGE_W + nx] = cell;
                }
            }
            // Slow fade-out so blood/particles do not pile forever
            if (Math.random() < 0.002 * simulationSpeed) {
                grid[ry * STAGE_W + rx] = TYPE.EMPTY;
            }
        }
    }
}
