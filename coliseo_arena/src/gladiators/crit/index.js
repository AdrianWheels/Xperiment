import { CELL_SIZE } from '../../config.js';

const image = new Image();
image.src = 'assets/gladiators/crit/sprites/base.png';

export default {
    key: 'crit',
    name: 'Critical',
    drawSpriteFirst: true,
    
    onInit(self) {
        self.critChance = 0.5; // High base crit chance
    },
    
    update() {},
    onCombat() {},
    modifyDamage(gladiator, enemy, damage, { floatingTexts }) {
        const chance = gladiator.critChance + gladiator.level * 0.02;
        if (Math.random() < chance) {
            const newDamage = damage * 3;
            gladiator.gainXp(20, floatingTexts);
            return { damage: newDamage, isCrit: true };
        }
        return { damage };
    },
    draw(gladiator, ctx) {
        if (!image.complete || image.naturalWidth === 0) return;
        const sx = gladiator.x * CELL_SIZE;
        const sy = gladiator.y * CELL_SIZE;
        const sr = gladiator.radius * CELL_SIZE;
        const drawSize = sr * 2.5;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.drawImage(
            image,
            0, 0, image.naturalWidth, image.naturalHeight,
            -drawSize / 2, -drawSize / 2, drawSize, drawSize
        );
        ctx.restore();
    }
};
