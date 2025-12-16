import { findNearestEnemy, switchMovementStrategy } from '../../core/GladiatorUtils.js';

const REGEN_INTERVAL = 60;
const FLEE_THRESHOLD_LOW = 0.4;
const FLEE_THRESHOLD_HIGH = 0.6;

export default {
    key: 'hex',
    name: 'Hex',
    defaultMovementStrategy: 'aggressive',
    
    onInit(self) {
        self._hexRegenTimer = 0;
    },
    
    update(self, { entities, simulationSpeed, floatingTexts }) {
        // Regen over time
        self._hexRegenTimer += simulationSpeed;
        if (self._hexRegenTimer >= REGEN_INTERVAL && self.hp < self.maxHp) {
            self._hexRegenTimer = 0;
            self.hp += 0.8 + (self.level * 0.6);
            self.gainXp(10, floatingTexts);
        }

        // Cambiar estrategia basada en HP con histéresis
        if (self.hpPercent < FLEE_THRESHOLD_LOW) {
            switchMovementStrategy(self, 'defensive');
        } else if (self.hpPercent >= FLEE_THRESHOLD_HIGH && self.movementStrategy.name === 'defensive') {
            switchMovementStrategy(self, 'aggressive');
        }

        // Si enemigo está muy cerca (< 100), override con movimiento defensivo temporal
        const { enemy: nearest, distance: nearestDist } = findNearestEnemy(self, entities);

        if (nearest && nearestDist < 100 && self.movementStrategy.name !== 'defensive') {
            // Forzar retroceso temporal sin cambiar estrategia permanentemente
            self.skipSeek = true;
            let angle = Math.atan2(nearest.y - self.y, nearest.x - self.x) + Math.PI;
            const accel = 0.2;
            self.vx += Math.cos(angle) * accel * simulationSpeed;
            self.vy += Math.sin(angle) * accel * simulationSpeed;
        }
    },
    onDamageTaken(self, attacker, amount) {
        return amount * 0.8;
    },
    onCombat() {},
    draw() {}
};

