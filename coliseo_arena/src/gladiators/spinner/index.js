import { STAGE_W, STAGE_H } from '../../config.js';
import Time from '../../core/Time.js';

export default {
    key: 'spinner',
    name: 'Spinner',
    defaultMovementStrategy: 'passive',
    movementOptions: {
        pattern: 'orbit',
        config: {
            PASSIVE: {
                pattern: 'orbit',
                orbitSpeed: 0.2,
                orbitRadius: 80,
                orbitSpeedMultiplier: 1.2,
                friction: 1.0
            }
        }
    },
    
    onInit(self) {
        self.combo = 0;
        self.lastAttackTime = 0;
        self._spinnerInit = false;
    },
    
    update(self) {
        // Inicializar el centro de órbita al centro del escenario
        if (!self._spinnerInit && self.movementStrategy && self.movementStrategy.name === 'passive') {
            const centerX = STAGE_W / 2;
            const centerY = STAGE_H / 2;
            self.movementStrategy.orbitCenter = { x: centerX, y: centerY };
            
            // Ajustar velocidad de órbita por nivel
            self.movementStrategy.config.orbitSpeed = 0.2 + (self.level * 0.05);
            
            self._spinnerInit = true;
        }

        // La estrategia pasiva se encarga del movimiento orbital
        // No necesitamos skip seek porque la estrategia ya maneja todo
    },
    getFriction() {
        return 1.0; // no friction decay
    },
    modifyDamage(self, enemy, damage, { floatingTexts }) {
        // Reset combo si pasó más de 0.5 segundos desde el último ataque
        if (Time.elapsedTime - self.lastAttackTime > 0.5) self.combo = 0;
        self.combo = (self.combo || 0) + 1;
        const scaled = damage * (1 + self.combo * (0.2 + self.level * 0.1));
        self.gainXp(10, floatingTexts);
        self.lastAttackTime = Time.elapsedTime;
        return { damage: scaled };
    },
    onWallBounce(self) {
        self.combo = 0;
    },
    onCombat() {},
    draw() {}
};

