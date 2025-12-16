export default {
    key: 'spike',
    name: 'Spike',
    
    onInit(self) {
        self.reflectDmg = 5; // Base reflect damage
    },
    
    update() {},
    onDamageTaken(self, attacker, amount, { floatingTexts }) {
        if (attacker) {
            const reflect = self.reflectDmg + self.level * 2;
            attacker.takeDamage(reflect, null, floatingTexts);
            self.gainXp(10, floatingTexts);
        }
        return amount;
    },
    onCombat() {},
    draw() {}
};

