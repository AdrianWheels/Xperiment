import { CELL_SIZE } from '../config.js';

export class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 60; // Frames
        this.maxLife = 60;
        this.vy = -0.5;
    }

    update(simulationSpeed) {
        this.y += this.vy * simulationSpeed;
        this.life -= simulationSpeed;
    }

    draw(ctx) {
        const progress = 1 - (this.life / this.maxLife);
        let scale = 1;

        // Pop effect
        if (progress < 0.2) {
            scale = progress * 5; // 0 -> 1
        } else {
            scale = 1;
        }

        ctx.save();
        ctx.translate(this.x * CELL_SIZE, this.y * CELL_SIZE);
        ctx.scale(scale, scale);

        ctx.globalAlpha = Math.max(0, this.life / 20); // Fade out at end
        ctx.fillStyle = this.color;
        ctx.font = "bold 64px monospace"; // Larger font
        ctx.textAlign = "center";
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, 0, 0);
        ctx.fillText(this.text, 0, 0);

        ctx.restore();
    }
}
