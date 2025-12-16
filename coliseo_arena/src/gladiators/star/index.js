import { CELL_SIZE } from '../../config.js';

const MAX_CHARGE = 150;
const BURST_COST = 100;

export default {
    key: 'star',
    name: 'Star',
    
    onInit(self) {
        self.starEnergy = 0;
        self._starPrevPos = { x: self.x, y: self.y };
    },
    
    update(self, { floatingTexts }) {
        const dx = self.x - self._starPrevPos.x;
        const dy = self.y - self._starPrevPos.y;
        const traveled = Math.hypot(dx, dy);
        self._starPrevPos = { x: self.x, y: self.y };

        const gain = traveled * (1.2 + self.level * 0.05);
        self.starEnergy = Math.min(MAX_CHARGE, self.starEnergy + gain);

        if (self.starEnergy >= BURST_COST) {
            const burst = 1.5 + (self.level * 0.05);
            self.vx *= burst;
            self.vy *= burst;
            self.starEnergy -= BURST_COST;
            self.gainXp(50, floatingTexts);
        }
    },
    modifyDamage(self, enemy, damage) {
        if (self.starEnergy > 50) return { damage: damage * 1.5 };
        return { damage };
    },
    draw(star, ctx) {
        const chargePct = Math.min(1, star.starEnergy / MAX_CHARGE);
        const sx = star.x * CELL_SIZE;
        const sy = star.y * CELL_SIZE;
        const sr = star.radius * CELL_SIZE * 1.4;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.globalCompositeOperation = 'screen';

        ctx.globalAlpha = 0.2 + 0.6 * chargePct;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, sr, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.5 * chargePct;
        ctx.beginPath();
        ctx.arc(0, 0, sr * 0.55, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
};

