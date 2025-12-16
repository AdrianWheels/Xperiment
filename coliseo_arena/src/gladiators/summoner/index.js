import { Entity } from '../../entities/Entity.js';
import { FloatingText } from '../../entities/FloatingText.js';

export default {
    key: 'summoner',
    name: 'Summoner',
    
    onInit(self) {
        self.pets = [];
        self.hasMinion = false;
        self.isMinion = false;
        self.summonCD = 0;
        self._initialMinionCreated = false; // Flag para prevenir spam del minion inicial
    },
    
    update(self, { entities, simulationSpeed, floatingTexts }) {
        // MINIONS NO EJECUTAN LÓGICA DE SUMMONER
        if (self.isMinion) return;
        
        // Decay summon cooldown
        if (self.summonCD > 0) {
            self.summonCD -= simulationSpeed;
            if (self.summonCD < 0) self.summonCD = 0;
        }
        
        self.pets = self.pets.filter(p => !p.dead);

        // One-time initial minion - SOLO SE EJECUTA UNA VEZ
        if (!self._initialMinionCreated && window.gameState && window.gameState.entities) {
            const offsetX = self.team === 'red' ? 8 : -8;
            let MinionCtor = Entity;
            if (window.Gladiator) MinionCtor = window.Gladiator;
            const minion = new MinionCtor(self.x + offsetX, self.y, 'summoner', self.elementType, self.team);
            minion.isMinion = true;
            minion.radius = Math.max(6, Math.floor(self.radius * 0.6));
            minion.maxHp = Math.max(1, Math.floor(self.maxHp * 0.05));
            minion.hp = minion.maxHp;
            minion.baseSpeed = self.baseSpeed * 0.9;
            minion.level = Math.max(1, self.level - 1);
            minion.hasMinion = true;
            minion._noModuleUpdate = true; // Prevenir que el módulo se ejecute
            window.gameState.entities.push(minion);
            self.pets.push(minion);
            self.hasMinion = true;
            self._initialMinionCreated = true; // Marcar como creado
        }
    },
    onCombat(self, enemy, { floatingTexts }) {
        if (self.isMinion) return;
        
        // Check summon cooldown to prevent spam (90 frames = ~1.5 seconds)
        if (self.summonCD > 0) return;
        
        if (!self.pets) self.pets = [];
        self.pets = self.pets.filter(p => !p.dead);

        const maxPets = 3 + Math.floor(self.level / 3);
        const hasCapacity = self.pets.length < maxPets;

        let minion = null;
        if (hasCapacity) {
            let MinionCtor = Entity;
            if (window.Gladiator) MinionCtor = window.Gladiator;

            const angle = Math.random() * Math.PI * 2;
            const offset = 6 + Math.random() * 4;
            minion = new MinionCtor(
                self.x + Math.cos(angle) * offset,
                self.y + Math.sin(angle) * offset,
                'summoner',
                self.elementType,
                self.team
            );
            minion.isMinion = true;
            minion.radius = Math.max(6, Math.floor(self.radius * 0.6));
            minion.maxHp = Math.max(1, Math.floor(self.maxHp * 0.05));
            minion.hp = minion.maxHp;
            minion.baseSpeed = self.baseSpeed * 0.9;
            minion.level = Math.max(1, self.level - 1);
            minion.hasMinion = true;
            minion.summonCD = 0;
            minion._noModuleUpdate = true; // Prevenir que el módulo se ejecute

            if (window.gameState && window.gameState.entities) {
                window.gameState.entities.push(minion);
            }
            self.pets.push(minion);
        } else if (self.pets.length > 0) {
            // Recycle the oldest pet to guarantee a summon per hit without infinite spam
            minion = self.pets.shift();
            const angle = Math.random() * Math.PI * 2;
            const offset = 6 + Math.random() * 4;
            minion.x = self.x + Math.cos(angle) * offset;
            minion.y = self.y + Math.sin(angle) * offset;
            minion.hp = minion.maxHp;
            minion.dead = false;
            self.pets.push(minion);
        }

        if (minion) {
            floatingTexts.push(new FloatingText(self.x, self.y - 10, "SUMMON!", '#88ff88'));
            self.gainXp(15 + self.level, floatingTexts);
            // Set cooldown to prevent immediate re-summon (~1.5 seconds)
            self.summonCD = 90;
        }
    },
    draw() {}
};

