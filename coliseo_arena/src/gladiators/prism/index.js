import { STAGE_W, STAGE_H } from '../../config.js';

const TELEPORT_CHANCE = 0.02;

export default {
    key: 'prism',
    name: 'Prism',
    update(gladiator, { floatingTexts }) {
        if (Math.random() < TELEPORT_CHANCE) {
            const range = 10 + gladiator.level;
            let nx = gladiator.x + (Math.random() - 0.5) * range;
            let ny = gladiator.y + (Math.random() - 0.5) * range;

            // Clamp inside arena bounds
            nx = Math.max(10, Math.min(STAGE_W - 10, nx));
            ny = Math.max(10, Math.min(STAGE_H - 10, ny));

            gladiator.x = nx;
            gladiator.y = ny;
            gladiator.gainXp(15, floatingTexts);
        }
    },
    onCombat() {},
    modifyDamage(gladiator, enemy, damage) {
        return { damage: damage * 1.2 };
    },
    draw() {}
};

