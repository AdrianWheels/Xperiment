import { FloatingText } from '../../entities/FloatingText.js';

export default {
    key: 'berserker',
    name: 'Berserker',
    defaultMovementStrategy: 'aggressive',
    movementOptions: {
        config: {
            AGGRESSIVE: {
                seekInterval: 1,
                seekAcceleration: 0.15,
                friction: 0.97
            }
        }
    },
    
    onInit(self) {
        self.berserkerRage = 0;
        self.berserkerStacks = 0;
        self.berserkerNextThreshold = 0.95;
    },
    
    update(self) {
        self.berserkerRage = (1 - self.hpPercent) * (1 + self.level * 0.1);
    },
    modifyDamage(self, enemy, damage, { floatingTexts }) {
        let scaled = damage * (1 + (self.berserkerRage || 0));
        if (self.berserkerStacks > 0) {
            scaled *= (1 + 0.05 * self.berserkerStacks);
        }
        if (self.hp < self.maxHp * 0.5) {
            self.gainXp(15, floatingTexts);
        }
        return { damage: scaled };
    },
    onDamageTaken(self, attacker, amount, { floatingTexts }) {
        let pct = (self.hp - amount) / self.maxHp; // approximate post-hit pct for thresholds
        while (pct < self.berserkerNextThreshold) {
            self.berserkerStacks++;
            self.invulnTimer = Math.max(self.invulnTimer, 12);
            self.berserkerNextThreshold -= 0.05;
            floatingTexts.push(new FloatingText(self.x, self.y - 10, "RAGE!", '#ff4444'));
            pct = (self.hp - amount) / self.maxHp;
        }
        return amount;
    },
    draw() {}
};

