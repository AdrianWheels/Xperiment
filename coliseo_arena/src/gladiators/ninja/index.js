import { FloatingText } from '../../entities/FloatingText.js';

export default {
    key: 'ninja',
    name: 'Ninja',
    
    onInit(self) {
        self.dodgeChance = 0.15; // Base dodge chance
    },
    
    update() {},
    onDamageTakenPre(self, attacker, amount, { floatingTexts }) {
        const chance = self.dodgeChance + self.level * 0.02;
        if (Math.random() < chance) {
            floatingTexts.push(new FloatingText(self.x, self.y - 5, "MISS", '#888'));
            self.gainXp(25, floatingTexts);
            return 0;
        }
        return amount;
    },
    onCombat() {},
    draw() {}
};

