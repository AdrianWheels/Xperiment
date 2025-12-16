// Screen Shake Utility
export class ScreenShake {
    constructor() {
        this.intensity = 0;
        this.duration = 0;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    trigger(intensity = 5, duration = 10) {
        this.intensity = Math.max(this.intensity, intensity);
        this.duration = Math.max(this.duration, duration);
    }

    update() {
        if (this.duration > 0) {
            this.offsetX = (Math.random() - 0.5) * this.intensity;
            this.offsetY = (Math.random() - 0.5) * this.intensity;
            this.duration--;
            this.intensity *= 0.9; // Decay
        } else {
            this.offsetX = 0;
            this.offsetY = 0;
            this.intensity = 0;
        }
    }

    apply(ctx) {
        ctx.translate(this.offsetX, this.offsetY);
    }

    reset(ctx) {
        ctx.translate(-this.offsetX, -this.offsetY);
    }
}

// Debug Mode
export const DebugMode = {
    enabled: false,
    toggle() {
        this.enabled = !this.enabled;
        console.log(`Debug Mode: ${this.enabled ? 'ON' : 'OFF'}`);
    }
};

// Gladiator Type Classification
export const GladiatorType = {
    AUTO_ATTACK: ['crit', 'speed', 'spinner', 'ninja', 'berserker', 'lancer', 'hex', 'illusion', 'archer'],
    SPELL: ['tank', 'spike', 'prism', 'orb', 'cube', 'star', 'pyramid', 'bomber', 'summoner', 'poison']
};

export function isAutoAttacker(className) {
    return GladiatorType.AUTO_ATTACK.includes(className);
}
