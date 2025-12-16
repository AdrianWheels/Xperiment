import { FloatingText } from '../../entities/FloatingText.js';
import { Projectile } from '../../entities/Projectile.js';
import { updateTimer } from '../../core/GladiatorUtils.js';

export default {
    key: 'illusion',
    name: 'Illusion',
    
    onInit(self) {
        self.decoyTimer = 0;
        self.decoyActive = false;
        self._decoySpawned = false; // Flag para prevenir múltiples spawns en el mismo frame
    },
    
    update(self, { simulationSpeed = 1, floatingTexts }) {
        updateTimer(self, 'decoyTimer', simulationSpeed);

        const lowHp = self.hpPercent < 0.3;
        const canSpawnDecoy = lowHp && !self.decoyActive && self.decoyTimer <= 0 && !self._decoySpawned;
        if (canSpawnDecoy) {
            self.decoyActive = true;
            self._decoySpawned = true; // Marcar inmediatamente
            self.decoyTimer = 150 + self.level * 20;
            self.gainXp(30, floatingTexts);
            floatingTexts.push(new FloatingText(self.x, self.y - 10, "DECOY!", '#ff00ff'));

            if (window.gameState && window.gameState.projectiles) {
                window.gameState.projectiles.push(new Projectile(self.x, self.y, 'decoy', self));
            }

            self.hp += 5; // Small sustain on decoy
        }

        if (self.decoyActive && self.decoyTimer <= 0) {
            self.decoyActive = false;
            self._decoySpawned = false; // Resetear flag cuando termine
        }

        // Flee only while decoy is active and time remains
        self.fleeing = Boolean(self.decoyActive && self.decoyTimer > 30);
    },
    onDamageTaken(self, attacker, amount, { floatingTexts }) {
        if (!self.decoyActive) return amount;
        const reduced = amount * 0.5;
        floatingTexts.push(new FloatingText(self.x + 10, self.y, "DECOY HIT", '#ff00ff'));
        return reduced;
    },
    onCombat() {},
    draw() {}
};

