import { Gladiator } from '../gladiators/Gladiator.js';
import { Projectile } from '../entities/Projectile.js';
import { CLASSES, TYPE, STAGE_W, STAGE_H } from '../config.js';
import { initGrid, getGrid } from '../core/Grid.js';

const SIMULATIONS_PER_MATCHUP = 20;

export async function runAllBattles(simulationSpeed, onProgress) {
    const classes = Object.keys(CLASSES);
    const results = [];
    let completed = 0;
    const total = classes.length * classes.length;

    for (let c1 of classes) {
        for (let c2 of classes) {
            const result = await simulateMatchup(c1, c2, simulationSpeed);
            results.push(result);
            completed++;
            if (onProgress) onProgress(`Simulating: ${c1} vs ${c2} (${completed}/${total})`);

            // Yield to UI thread every few matches
            if (completed % 5 === 0) await new Promise(r => setTimeout(r, 0));
        }
    }

    return results;
}

async function simulateMatchup(redClass, blueClass, simulationSpeed) {
    let redWins = 0;
    let blueWins = 0;
    let draws = 0;
    let totalDuration = 0;
    let totalRedHp = 0;
    let totalBlueHp = 0;
    let totalRedDmg = 0;
    let totalBlueDmg = 0;

    for (let i = 0; i < SIMULATIONS_PER_MATCHUP; i++) {
        const outcome = runSingleBattle(redClass, blueClass, simulationSpeed);
        if (outcome.winner === 'red') {
            redWins++;
            totalRedHp += outcome.winnerHp;
        } else if (outcome.winner === 'blue') {
            blueWins++;
            totalBlueHp += outcome.winnerHp;
        } else {
            draws++;
        }
        totalDuration += outcome.duration;
        totalRedDmg += outcome.redDmg;
        totalBlueDmg += outcome.blueDmg;
    }

    return {
        redClass,
        blueClass,
        redWins,
        blueWins,
        draws,
        total: SIMULATIONS_PER_MATCHUP,
        avgDuration: totalDuration / SIMULATIONS_PER_MATCHUP,
        avgRedHp: redWins > 0 ? totalRedHp / redWins : 0,
        avgBlueHp: blueWins > 0 ? totalBlueHp / blueWins : 0,
        avgRedDmg: totalRedDmg / SIMULATIONS_PER_MATCHUP,
        avgBlueDmg: totalBlueDmg / SIMULATIONS_PER_MATCHUP
    };
}

function runSingleBattle(redClass, blueClass, simulationSpeed) {
    initGrid();
    const grid = getGrid();
    const entities = [];
    const floatingTexts = []; // Mock
    
    // Setup minimal gameState for gladiator modules
    if (!window.gameState) window.gameState = {};
    window.gameState.entities = entities;
    window.gameState.projectiles = [];
    window.Projectile = Projectile;
    window.Gladiator = Gladiator;

    // Create Gladiators (not plain Entities) to load modules
    const red = new Gladiator(50, STAGE_H / 2, redClass, TYPE.FIRE, 'red');
    const blue = new Gladiator(STAGE_W - 50, STAGE_H / 2, blueClass, TYPE.WATER, 'blue');
    
    // Inject grid reference
    red.grid = grid;
    blue.grid = grid;
    
    entities.push(red, blue);

    let simulatedTime = 0;
    let winner = null;
    let winnerHp = 0;
    const HARD_LIMIT = 15000;

    // Simulation Loop
    let iterations = 0;
    const MAX_ITERATIONS = 50000; // Safety limit for infinite loops
    
    while (simulatedTime < HARD_LIMIT && iterations < MAX_ITERATIONS) {
        simulatedTime += simulationSpeed;
        iterations++;

        // Sudden Death Logic (increased damage to force conclusion)
        if (simulatedTime > 3600) {
            entities.forEach(e => {
                if (!e.dead) e.takeDamage(0.5 * simulationSpeed, null, floatingTexts);
            });
        }

        // Update Entities
        for (let i = entities.length - 1; i >= 0; i--) {
            const e = entities[i];
            if (e.dead) continue;
            e.update(entities, simulationSpeed, floatingTexts, () => { });
        }
        
        // Update Projectiles (bombs, arrows, decoys, etc.)
        const projectiles = window.gameState.projectiles || [];
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            if (p.update) p.update(entities, floatingTexts); // Projectile.update solo toma (entities, floatingTexts)
            if (p.dead || p.life <= 0) {
                projectiles.splice(i, 1);
            }
        }

        // Check Death
        const redAlive = !red.dead;
        const blueAlive = !blue.dead;

        if (!redAlive && !blueAlive) {
            winner = 'draw';
            break;
        }
        if (!redAlive) {
            winner = 'blue';
            winnerHp = (blue.hp / blue.maxHp) * 100;
            break;
        }
        if (!blueAlive) {
            winner = 'red';
            winnerHp = (red.hp / red.maxHp) * 100;
            break;
        }
    }

    if (!winner) winner = 'draw';

    return {
        winner,
        winnerHp,
        duration: simulatedTime,
        redDmg: red.damageDealt,
        blueDmg: blue.damageDealt
    };
}
