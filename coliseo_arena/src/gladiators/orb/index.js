import { findNearestEnemy } from '../../core/GladiatorUtils.js';

export default {
    key: 'orb',
    name: 'Orb',
    
    onInit(self) {
        self.orbGravity = true;
        self.seekAttractor = 0.05;
    },
    
    update(self, { entities, simulationSpeed, floatingTexts }) {
        const { enemy: nearest, distance: nearestDist } = findNearestEnemy(self, entities);

        if (nearest) {
            const angle = Math.atan2(nearest.y - self.y, nearest.x - self.x);
            const accel = 0.25 + (self.level * 0.02);
            self.vx += Math.cos(angle) * accel * simulationSpeed;
            self.vy += Math.sin(angle) * accel * simulationSpeed;

            if (nearestDist < 100) self.gainXp(5 * simulationSpeed, floatingTexts);
        }
    },
    onDamageTaken(self, attacker, amount) {
        if (attacker) {
            const angle = Math.atan2(attacker.y - self.y, attacker.x - self.x);
            const force = 2.0;
            attacker.vx += Math.cos(angle) * force;
            attacker.vy += Math.sin(angle) * force;
        }
        return amount;
    },
    onCombat() {},
    draw() {}
};

