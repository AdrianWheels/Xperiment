import { FloatingText } from '../../entities/FloatingText.js';
import { findNearestEnemy, updateTimer, switchMovementStrategy } from '../../core/GladiatorUtils.js';
import Time from '../../core/Time.js';

export default {
    key: 'poison',
    name: 'Poison',
    defaultMovementStrategy: 'aggressive',
    
    onInit(self) {
        self.fleeTimer = 0;
        self._lastPoisonTick = 0;
    },
    
    update(self, { entities, simulationSpeed, floatingTexts }) {
        // Update timer
        updateTimer(self, 'fleeTimer', simulationSpeed);
        
        // Apply poison DoT to all entities with poisonStacks (tick every 1 second)
        if (Time.elapsedTime - self._lastPoisonTick >= 1.0) {
            self._lastPoisonTick = Time.elapsedTime;
            
            for (const e of entities) {
                if (e.poisonStacks > 0 && e.poisonSource === self) {
                    const dotDmg = e.poisonStacks;
                    const dealt = e.takeDamage(dotDmg, self, floatingTexts);
                    if (dealt > 0) {
                        self.damageDealt += dealt;
                        self.gainXp(6 + self.level, floatingTexts);
                    }
                }
            }
        }
        
        // Find nearest enemy
        const { enemy: nearestEnemy, distance: nearestDist } = findNearestEnemy(self, entities);

        // Si enemigo está cerca Y fleeTimer está activo, cambiar a defensive
        const enemyClose = nearestEnemy && nearestDist < 70;
        if (enemyClose && self.fleeTimer > 0) {
            switchMovementStrategy(self, 'defensive');
        } 
        // Si fleeTimer expiró, volver a aggressive para aplicar más poison
        else if (self.fleeTimer <= 0 && self.movementStrategy.name === 'defensive') {
            switchMovementStrategy(self, 'aggressive');
        }
    },
    onCombat(self, enemy, { floatingTexts }) {
        enemy.poisonStacks = (enemy.poisonStacks || 0) + (1 + self.level);
        enemy.poisonSource = self;
        self.fleeTimer = 18;
        self.gainXp(5, floatingTexts);
        floatingTexts.push(new FloatingText(enemy.x, enemy.y - 10, "POISON", '#00ff88'));
    },
    draw() {}
};

