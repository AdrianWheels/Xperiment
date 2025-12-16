import { CLASSES } from '../config.js';

export class Overlay {
    constructor() {
        this.element = document.getElementById('dps-overlay');
    }

    update(entities, combatLoopActive, combatStartTime) {
        if (!combatLoopActive && entities.length === 0) {
            this.element.innerHTML = '';
            return;
        }

        const now = Date.now();
        const duration = (now - combatStartTime) / 1000;
        if (duration < 0.1) return;

        let html = '';
        entities.forEach(e => {
            const dps = Math.round(e.damageDealt / duration);
            html += `<div class="dps-entry">
                <span class="name">${CLASSES[e.className].name}</span>
                <span class="val">${dps} DPS</span>
            </div>`;
        });
        this.element.innerHTML = html;
    }

    clear() {
        this.element.innerHTML = '';
    }
}
