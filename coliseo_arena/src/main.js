import { STAGE_W, STAGE_H, CELL_SIZE, TYPE, CLASSES } from './config.js';
import { initGrid, updateSand, grid as gridInstance } from './core/Grid.js';
import { Gladiator } from './gladiators/Gladiator.js';
import { Projectile } from './entities/Projectile.js';
import { GameLoop } from './core/Loop.js';
import { setupUI, updateGladiatorList } from './ui/Interface.js';
import { Overlay } from './ui/Overlay.js';
import { ScreenShake, DebugMode } from './core/Utils.js';
import GameEngine from './core/GameEngine.js';
import EventBus, { GameEvents } from './core/EventBus.js';
import Time from './core/Time.js';

const SUDDEN_DEATH_FRAMES = 60 * 60; // 1 minute at 60 FPS

const canvas = document.getElementById('sandCanvas');
canvas.width = STAGE_W * CELL_SIZE;
canvas.height = STAGE_H * CELL_SIZE;

// Game State
const state = {
    entities: [],
    projectiles: [], // NEW: For bombs, pets, arrows, decoys
    floatingTexts: [],
    combatLoopActive: false,
    combatTimer: null,
    simulationSpeed: 1,
    combatStartTime: 0,
    overlay: new Overlay(),
    ui: {},
    // New State Variables
    restarting: false,
    restartTimer: 0,
    combatDuration: 0,
    // Screen Shake
    screenShake: new ScreenShake(),
    restartFn: null
};

// Make state globally accessible for entity projectile spawning
window.gameState = state;
window.Gladiator = Gladiator;
window.Projectile = Projectile; // Make Projectile available globally for gladiator modules

// ===== NEW ENGINE: Exponer referencias globales para compatibilidad =====
window.entities = state.entities;
window.floatingTexts = state.floatingTexts;
window.checkCombatEnd = null; // Se actualizará en startCombatLoop

// ===== NEW ENGINE: Inicializar GameEngine =====
const canvas2d = document.getElementById('sandCanvas');
const ctx2d = canvas2d.getContext('2d');
GameEngine.initialize({}, { getCellType: (x, y) => gridInstance[y * STAGE_W + x] }, ctx2d);

// Sincronizar listas entre state y GameEngine
GameEngine.entities = state.entities;
GameEngine.projectiles = state.projectiles;
GameEngine.floatingTexts = state.floatingTexts;

// Debug Toggle (Press D)
document.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') DebugMode.toggle();
});

// Initialize
initGrid();

// Combat Logic
function startCombatLoop() {
    initGrid();
    state.entities = [];
    state.projectiles = []; // Reset projectiles
    state.floatingTexts = [];
    state.combatLoopActive = true;
    state.combatStartTime = Date.now();
    state.combatDuration = 0; // Reset duration
    state.ui.combatStatusElem.textContent = "Fighting...";
    state.overlay.clear();

    const keys = Object.keys(CLASSES);
    const class1 = keys[Math.floor(Math.random() * keys.length)];
    const class2 = keys[Math.floor(Math.random() * keys.length)];

    const glad1 = new Gladiator(50, STAGE_H / 2, class1, TYPE.FIRE, 'red');
    const glad2 = new Gladiator(STAGE_W - 50, STAGE_H / 2, class2, TYPE.WATER, 'blue');
    
    state.entities.push(glad1);
    state.entities.push(glad2);
    
    // ===== NEW ENGINE: Añadir entidades al motor =====
    GameEngine.addEntity(glad1);
    GameEngine.addEntity(glad2);
    
    // Sincronizar referencias
    GameEngine.entities = state.entities;
    GameEngine.projectiles = state.projectiles;
    GameEngine.floatingTexts = state.floatingTexts;
    window.entities = state.entities;
    window.floatingTexts = state.floatingTexts;
    
    state.restartFn = startCombatLoop;
    
    EventBus.emit(GameEvents.GAME_START);
}

function startCombatLoop2v2() {
    initGrid();
    state.entities = [];
    state.projectiles = [];
    state.floatingTexts = [];
    state.combatLoopActive = true;
    state.combatStartTime = Date.now();
    state.combatDuration = 0;
    state.ui.combatStatusElem.textContent = "Fighting...";
    state.overlay.clear();

    const keys = Object.keys(CLASSES);
    const pick = () => keys[Math.floor(Math.random() * keys.length)];

    const glads = [
        new Gladiator(50, Math.floor(STAGE_H / 3), pick(), TYPE.FIRE, 'red'),
        new Gladiator(50, Math.floor((2 * STAGE_H) / 3), pick(), TYPE.FIRE, 'red'),
        new Gladiator(STAGE_W - 50, Math.floor(STAGE_H / 3), pick(), TYPE.WATER, 'blue'),
        new Gladiator(STAGE_W - 50, Math.floor((2 * STAGE_H) / 3), pick(), TYPE.WATER, 'blue')
    ];
    
    glads.forEach(g => {
        state.entities.push(g);
        // ===== NEW ENGINE: Añadir entidades al motor =====
        GameEngine.addEntity(g);
    });
    
    // Sincronizar referencias
    GameEngine.entities = state.entities;
    GameEngine.projectiles = state.projectiles;
    GameEngine.floatingTexts = state.floatingTexts;
    window.entities = state.entities;
    window.floatingTexts = state.floatingTexts;
    
    state.restartFn = startCombatLoop2v2;
    
    EventBus.emit(GameEvents.GAME_START);
}

function checkCombatEnd() {
    if (!state.combatLoopActive) return;

    const alive = state.entities.filter(e => !e.dead);
    const redAlive = alive.some(e => e.team === 'red');
    const blueAlive = alive.some(e => e.team === 'blue');
    if (!redAlive && !blueAlive) {
        state.ui.combatStatusElem.textContent = "DRAW! Restarting...";
        state.combatLoopActive = false;
        state.restarting = true;
        state.restartTimer = 120;
        
        // ===== NEW ENGINE: Game Over =====
        GameEngine.gameOver(null); // Draw
        return;
    }
    if (!redAlive || !blueAlive) {
        const winnerTeam = redAlive ? 'RED' : 'BLUE';
        state.ui.combatStatusElem.textContent = `${winnerTeam} WINS! Restarting...`;
        state.combatLoopActive = false;
        state.restarting = true;
        state.restartTimer = 120;
        
        // ===== NEW ENGINE: Game Over =====
        GameEngine.gameOver(winnerTeam);
    }
}

// Exponer checkCombatEnd globalmente
window.checkCombatEnd = checkCombatEnd;

// Update Function
function update(fixedDtSeconds = 1 / 60) {
    // Normalize simulation speed to the fixed timestep so timers stay consistent if FIXED_DT changes
    const tickScale = state.simulationSpeed * (fixedDtSeconds / (1 / 60));

    // Handle Restart
    if (state.restarting) {
        state.restartTimer -= tickScale;
        if (state.restartTimer <= 0) {
            state.restarting = false;
            const fn = state.restartFn || startCombatLoop;
            fn();
            return; // Start fresh next frame
        }
    }

    // Sudden Death Logic
    if (state.combatLoopActive) {
        state.combatDuration += tickScale;
        if (state.combatDuration > SUDDEN_DEATH_FRAMES) {
            if (state.combatDuration === SUDDEN_DEATH_FRAMES + tickScale) {
                // Primera vez que se activa sudden death
                EventBus.emit(GameEvents.SUDDEN_DEATH_START);
            }
            state.ui.combatStatusElem.textContent = "SUDDEN DEATH!";
            const suddenElapsed = state.combatDuration - SUDDEN_DEATH_FRAMES;
            const ramp = Math.max(0, suddenElapsed / 30); // Grows by ~1 damage every half second
            const damage = (8 + ramp) * tickScale;
            state.entities.forEach(e => {
                if (!e.dead) {
                    e.takeDamage(damage, null, state.floatingTexts);
                }
            });
        }
    }

    // Entities
    for (let i = state.entities.length - 1; i >= 0; i--) {
        const e = state.entities[i];
        if (e.dead) { state.entities.splice(i, 1); continue; }
        e.update(state.entities, tickScale, state.floatingTexts, checkCombatEnd);
    }

    // Projectiles (bombs, pets, arrows, decoys)
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        p.update(state.entities, state.floatingTexts);
        if (p.dead) state.projectiles.splice(i, 1);
    }

    // Floating Texts
    for (let i = state.floatingTexts.length - 1; i >= 0; i--) {
        const ft = state.floatingTexts[i];
        ft.update(tickScale);
        if (ft.life <= 0) state.floatingTexts.splice(i, 1);
    }

    updateSand(tickScale);

    // Update UI
    updateGladiatorList(state.entities);
}

// Setup
state.ui = setupUI(state, startCombatLoop, startCombatLoop2v2);
const gameLoop = new GameLoop(canvas, state, update);
gameLoop.start();
