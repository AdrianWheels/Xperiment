import { updateSand, grid, getCell } from './Grid.js';
import { COLORS, STAGE_W, STAGE_H, CELL_SIZE } from '../config.js';
import { DebugMode } from './Utils.js';
import { drawArenaDebug } from '../debug/DebugRenderer.js';
import GameEngine from './GameEngine.js';
import Time from './Time.js';

// Fixed timestep constants (like Unity/Godot)
const FIXED_DT = 1000 / 60; // 16.67ms per physics step (60 FPS)
const FIXED_DT_SECONDS = FIXED_DT / 1000; // Handy for time-based systems
const MAX_FRAME_TIME = 250; // Cap to prevent spiral of death
const MAX_STEPS_PER_FRAME = 8; // Allow extra catch-up steps under heavy load
const MIN_FRAME_INTERVAL = 1000 / 60; // Hard cap render to 60 FPS

export class GameLoop {
    constructor(canvas, state, updateFn) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false });
        this.state = state;
        this.updateFn = updateFn;
        this.lastTime = 0;
        this.accumulator = 0; // Time accumulator for fixed timestep
        this.lastPhysicsSteps = 0; // Debug/telemetry

        // Offscreen buffer
        this.offCanvas = document.createElement('canvas');
        this.offCanvas.width = STAGE_W;
        this.offCanvas.height = STAGE_H;
        this.offCtx = this.offCanvas.getContext('2d');
        this.offData = this.offCtx.createImageData(STAGE_W, STAGE_H);

        // Precompute colors
        this.ABGR = COLORS.map(c => {
            const r = parseInt(c.slice(1, 3), 16);
            const g = parseInt(c.slice(3, 5), 16);
            const b = parseInt(c.slice(5, 7), 16);
            return 0xFF000000 | (b << 16) | (g << 8) | r;
        });
    }

    start() {
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    loop(timestamp) {
        let frameTime = timestamp - this.lastTime;

        // Cap render/update frequency to 60 FPS
        if (frameTime < MIN_FRAME_INTERVAL) {
            requestAnimationFrame(this.loop.bind(this));
            return;
        }

        this.lastTime = timestamp;
        this.lastRenderTime = timestamp;

        // Cap frame time to prevent spiral of death (e.g., tab was inactive)
        if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;

        this.accumulator += frameTime;

        // ===== NEW ENGINE: Process (variable delta) =====
        // Actualizar Time singleton y procesar entities con delta time
        GameEngine.process(timestamp);

        // Inyectar grid a todas las entidades antes de actualizar (para MovementSystem)
        if (this.state.entities) {
            this.state.entities.forEach(e => {
                if (!e.grid) e.grid = { getCellType: getCell };
            });
        }

        // Fixed timestep physics updates
        let physicsSteps = 0;
        while (this.accumulator >= FIXED_DT && physicsSteps < MAX_STEPS_PER_FRAME) {
            // ===== NEW ENGINE: Physics Process (fixed delta) =====
            GameEngine.physicsProcess(FIXED_DT_SECONDS);
            
            // Legacy update para compatibilidad
            this.updateFn(FIXED_DT_SECONDS); // Physics update at fixed rate
            this.accumulator -= FIXED_DT;
            physicsSteps++;
        }
        this.lastPhysicsSteps = physicsSteps;

        // Update FPS display (shows actual render FPS)
        if (this.state.ui.fpsElem) this.state.ui.fpsElem.textContent = Math.round(Time.fps);
        if (this.state.ui.pCountElem) this.state.ui.pCountElem.textContent = this.state.entities.length;

        // Render once per frame (can be faster than physics)
        const interpolation = this.accumulator / FIXED_DT;
        this.render(interpolation);

        requestAnimationFrame(this.loop.bind(this));
    }

    render(interpolation = 1) {
        // ===== NEW ENGINE: Render callback =====
        GameEngine.render(interpolation);
        
        // Render Grid
        const buf32 = new Uint32Array(this.offData.data.buffer);
        for (let i = 0; i < grid.length; i++) buf32[i] = this.ABGR[grid[i]];
        this.offCtx.putImageData(this.offData, 0, 0);

        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(this.offCanvas, 0, 0, this.canvas.width, this.canvas.height);

        // Screen Shake
        if (this.state.screenShake) {
            this.state.screenShake.update();
            this.state.screenShake.apply(this.ctx);
        }

        // Render Entities
        this.state.entities.forEach(e => e.draw(this.ctx));

        // Render Projectiles
        if (this.state.projectiles) {
            this.state.projectiles.forEach(p => p.draw(this.ctx));
        }

        this.state.floatingTexts.forEach(ft => ft.draw(this.ctx));

        if (DebugMode.enabled) {
            drawArenaDebug(this.ctx);
        }

        // Reset Shake
        if (this.state.screenShake) {
            this.state.screenShake.reset(this.ctx);
        }

        // Update Overlay
        this.state.overlay.update(this.state.entities, this.state.combatLoopActive, this.state.combatStartTime);
    }
}
