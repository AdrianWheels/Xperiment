import { CELL_SIZE } from '../../config.js';
import Time from '../../core/Time.js';

export default {
    key: 'tank',
    name: 'Tank',
    defaultMovementStrategy: 'aggressive', // Tank siempre es agresivo
    
    onInit(self) {
        self._lastShieldTime = 0;
    },
    
    update(self, { simulationSpeed }) {
        // Shield interval scales with level (en segundos)
        const shieldInterval = Math.max(1.5, 5 - (self.level * 0.3));
        
        // Activar escudo cada X segundos
        if (Time.elapsedTime - self._lastShieldTime >= shieldInterval) {
            self.invulnerable = true;
            self.invulnTimer = 30 + (self.level * 10);
            self._lastShieldTime = Time.elapsedTime;
        }
    },
    onCombat() {},
    draw(self, ctx) {
        if (!self.invulnerable && self.invulnTimer <= 0) return;

        const sx = self.x * CELL_SIZE;
        const sy = self.y * CELL_SIZE;
        const sr = self.radius * CELL_SIZE * 1.2;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.globalAlpha = 0.35 + Math.min(0.3, self.invulnTimer / 60);
        ctx.strokeStyle = '#66ccff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, sr, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#66ccff';
        ctx.globalAlpha *= 0.6;
        ctx.beginPath();
        ctx.arc(0, 0, sr * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
};

