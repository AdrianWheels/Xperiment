import { FloatingText } from '../../entities/FloatingText.js';
import { findNearestEnemy, updateCooldown } from '../../core/GladiatorUtils.js';

export default {
    key: 'lancer',
    name: 'Lancer',
    
    onInit(self) {
        self.lanceCD = 0;
        self.lanceCharging = false;
    },
    
    update(self, { entities, simulationSpeed }) {
        updateCooldown(self, 'lanceCD', simulationSpeed);
        
        if (self.lanceCD <= 0) {
            self.lanceCharging = true;
        }

        if (self.lanceCharging) {
            const { enemy: nearestEnemy } = findNearestEnemy(self, entities);
            if (nearestEnemy) {
                const angle = Math.atan2(nearestEnemy.y - self.y, nearestEnemy.x - self.x);
                self.vx = Math.cos(angle) * self.baseSpeed * 3.2;
                self.vy = Math.sin(angle) * self.baseSpeed * 3.2;
            }
        }
    },
    onCombat(self, enemy, { floatingTexts }) {
        if (!self.lanceCharging) return;

        let damage = 5 + (self.level * 2);
        damage *= 2;

        // Push enemy away
        const angle = Math.atan2(enemy.y - self.y, enemy.x - self.x);
        enemy.vx += Math.cos(angle) * 3;
        enemy.vy += Math.sin(angle) * 3;

        // Keep moving through target
        self.vx = Math.cos(angle) * self.baseSpeed * 2.4;
        self.vy = Math.sin(angle) * self.baseSpeed * 2.4;

        self.lanceCD = 180 - (self.level * 10);
        self.lanceCharging = false;
        self.gainXp(25, floatingTexts);
        floatingTexts.push(new FloatingText(enemy.x, enemy.y - 10, "PIERCE!", '#ffaa00'));

        // Return modified damage
        return { damage };
    },
    onCollisionRepel(self, other) {
        // Allow normal repel; lancer keeps piercing momentum, so don't override force
        if (self.lanceCharging) return 0; // skip repel when charging to pierce
        return null;
    },
    draw() {}
};

