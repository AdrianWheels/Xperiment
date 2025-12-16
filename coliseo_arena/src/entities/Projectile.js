import { CELL_SIZE } from '../config.js';
import { FloatingText } from './FloatingText.js';
import { isAutoAttacker } from '../core/Utils.js';

const DECOY_TAUNT_RANGE = 100;

// Projectile/Effect System - For bombs, pets, decoys, arrows
export class Projectile {
    constructor(x, y, type, owner, target = null) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.type = type; // 'bomb', 'pet', 'decoy', 'arrow'
        this.owner = owner;
        this.target = target;
        this.life = 60; // Frames
        this.maxLife = 60;
        this.radius = 4;
        this.damage = 0;
        this.vx = 0;
        this.vy = 0;
        this.dead = false;

        // Type-specific setup
        switch (type) {
            case 'bomb':
                this.life = 60; // 1 second fuse
                this.radius = 16;
                this.damage = 24 + (owner.level * 8); // Indirect damage needs higher payoff
                this.color = '#ff8800';
                break;
            case 'pet':
                this.life = 180; // 3 seconds
                this.radius = 4;
                this.damage = owner.level * 2;
                this.color = '#88ff88';
                // Move towards target
                if (target) {
                    const angle = Math.atan2(target.y - y, target.x - x);
                    this.vx = Math.cos(angle) * 2;
                    this.vy = Math.sin(angle) * 2;
                }
                break;
            case 'decoy':
                this.life = 180; // 3 seconds
                this.radius = 14;
                this.damage = 0;
                this.color = '#ff00ff';
                break;
            case 'arrow':
                this.life = 120;
                this.radius = 3;
                this.damage = 5 + (owner.level * 3);
                this.color = '#00ff00';
                if (target) {
                    const angle = Math.atan2(target.y - y, target.x - x);
                    this.vx = Math.cos(angle) * 4;
                    this.vy = Math.sin(angle) * 4;
                }
                break;
        }

        // Keep visuals in sync with actual lifetime
        this.maxLife = this.life;
    }

    update(entities, floatingTexts) {
        this.prevX = this.x;
        this.prevY = this.y;
        this.life--;
        if (this.life <= 0) {
            this.die(entities, floatingTexts);
            return;
        }

        // Movement
        this.x += this.vx;
        this.y += this.vy;

        // Collision with enemies (for arrows and pets)
        if (this.type === 'arrow' || this.type === 'pet') {
            for (let e of entities) {
                if (e === this.owner || e.team === this.owner.team) continue;
                const hit = segmentIntersectsCircle(
                    this.prevX, this.prevY,
                    this.x, this.y,
                    e.x, e.y,
                    this.radius + e.radius
                );
                if (hit) {
                    const dealt = e.takeDamage(this.damage, this.owner, floatingTexts);
                    if (dealt > 0) {
                        this.owner.damageDealt += dealt;
                        floatingTexts.push(new FloatingText(e.x, e.y - 5, Math.round(dealt).toString(), '#ffffff'));
                        if (isAutoAttacker(this.owner.className)) {
                            this.owner.gainXp(5 + this.owner.level, floatingTexts);
                        }
                    }
                    this.dead = true;
                    return;
                }
            }
        }

        // Decoy taunt effect - attract enemies
        if (this.type === 'decoy') {
            for (let e of entities) {
                if (e.team === this.owner.team) continue;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < DECOY_TAUNT_RANGE) {
                    // Pull enemy towards decoy
                    const angle = Math.atan2(this.y - e.y, this.x - e.x);
                    e.vx += Math.cos(angle) * 0.1;
                    e.vy += Math.sin(angle) * 0.1;
                }
            }
        }
    }

    die(entities, floatingTexts) {
        this.dead = true;

        // Bomb explosion
        if (this.type === 'bomb') {
            // AoE damage
            for (let e of entities) {
                if (e.team === this.owner.team) continue;
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < 34) { // Explosion radius
                    const actualDmg = e.takeDamage(this.damage, null, floatingTexts);
                    this.owner.damageDealt += actualDmg;
                    floatingTexts.push(new FloatingText(e.x, e.y - 5, Math.round(actualDmg).toString(), '#ff4400'));
                }
            }
        }
    }

    draw(ctx) {
        const sx = this.x * CELL_SIZE;
        const sy = this.y * CELL_SIZE;
        const sr = this.radius * (CELL_SIZE / 6);

        ctx.save();
        ctx.translate(sx, sy);

        // Pulsing effect based on life
        const pulse = 1 + Math.sin(this.life * 0.3) * 0.2;
        ctx.scale(pulse, pulse);

        // Draw based on type
        ctx.beginPath();
        ctx.arc(0, 0, sr, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = Math.max(0.3, this.life / this.maxLife);
        ctx.fill();

        // Outline (thicker for decoys/bombs so they read better)
        ctx.strokeStyle = this.type === 'decoy' ? '#ffffff' : '#fff';
        ctx.lineWidth = this.type === 'decoy' ? 3 : 2;
        ctx.stroke();

        if (this.type === 'decoy') {
            ctx.strokeStyle = '#ffb3ff';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.arc(0, 0, sr * 1.2, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Type indicator
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.globalAlpha = 1;

        let icon = '';
        if (this.type === 'bomb') icon = '💣';
        else if (this.type === 'pet') icon = '🐾';
        else if (this.type === 'decoy') icon = '👻';
        else if (this.type === 'arrow') icon = '→';

        ctx.fillText(icon, 0, 4);

        ctx.restore();
    }
}

// Simple swept-circle vs circle test to prevent tunneling at higher speeds
function segmentIntersectsCircle(ax, ay, bx, by, cx, cy, r) {
    const abx = bx - ax;
    const aby = by - ay;
    const acx = cx - ax;
    const acy = cy - ay;
    const abLenSq = abx * abx + aby * aby || 1e-6;
    const t = Math.max(0, Math.min(1, (acx * abx + acy * aby) / abLenSq));
    const px = ax + abx * t;
    const py = ay + aby * t;
    const dx = cx - px;
    const dy = cy - py;
    return (dx * dx + dy * dy) <= r * r;
}
