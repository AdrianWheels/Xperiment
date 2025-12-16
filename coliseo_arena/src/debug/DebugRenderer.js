import { CELL_SIZE, STAGE_W, STAGE_H, TYPE } from '../config.js';
import { getCell } from '../core/Grid.js';

// Centralized debug rendering for arena and entities
export function drawArenaDebug(ctx) {
    const ringMarginPx = 2 * CELL_SIZE;
    const ringWidthPx = (STAGE_W - 4) * CELL_SIZE;
    const ringHeightPx = (STAGE_H - 4) * CELL_SIZE;

    const wallMarginCells = 10;
    const wallMarginPx = wallMarginCells * CELL_SIZE;
    const wallWidthPx = (STAGE_W - wallMarginCells * 2) * CELL_SIZE;
    const wallHeightPx = (STAGE_H - wallMarginCells * 2) * CELL_SIZE;

    ctx.save();
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 6]);
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.9)';
    ctx.strokeRect(ringMarginPx, ringMarginPx, ringWidthPx, ringHeightPx);

    ctx.setLineDash([6, 6]);
    ctx.strokeStyle = 'rgba(0, 180, 255, 0.75)';
    ctx.strokeRect(wallMarginPx, wallMarginPx, wallWidthPx, wallHeightPx);

    ctx.restore();
}

export function drawEntityDebug(entity, ctx) {
    const SCALE = CELL_SIZE;
    const sr = entity.radius * SCALE;

    const drawArrow = (fromX, fromY, toX, toY, opts = {}) => {
        const { color = '#fff', width = 4, headSize = 14, dash = null, alpha = 1 } = opts;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        ctx.save();
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;
        ctx.globalAlpha = alpha;
        if (dash) ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(toX, toY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(toX, toY);
        ctx.lineTo(toX - Math.cos(angle - Math.PI / 7) * headSize, toY - Math.sin(angle - Math.PI / 7) * headSize);
        ctx.lineTo(toX - Math.cos(angle + Math.PI / 7) * headSize, toY - Math.sin(angle + Math.PI / 7) * headSize);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    };

    // Hit Radius Circle - Color based on attack state
    let nearestEnemyDist = 999;
    let nearestEnemyObj = null;
    if (window.gameState) {
        for (let e of window.gameState.entities) {
            if (e !== entity && e.team !== entity.team) {
                const d = Math.hypot(e.x - entity.x, e.y - entity.y);
                if (d < nearestEnemyDist) { nearestEnemyDist = d; nearestEnemyObj = e; }
            }
        }
    }

    const hitRange = entity.radius * 2;
    const canHit = nearestEnemyDist < hitRange + 10;
    const onCooldown = entity.cooldown > 0;

    ctx.strokeStyle = canHit ? '#00ff00' : '#ff4444';
    ctx.globalAlpha = onCooldown ? 0.3 : 1.0;
    ctx.lineWidth = 10;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(0, 0, sr * 1.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1.0;

    // Desired intent (green) vs actual velocity (yellow)
    if (entity.intentVec && Math.hypot(entity.intentVec.x, entity.intentVec.y) > 0.01) {
        drawArrow(0, 0, entity.intentVec.x * SCALE, entity.intentVec.y * SCALE, { color: '#00ff55', width: 6, headSize: 16 });
    }
    if (Math.hypot(entity.vx, entity.vy) > 0.01) {
        drawArrow(0, 0, entity.vx * SCALE * 2, entity.vy * SCALE * 2, { color: '#ffff00', width: 4, headSize: 14 });
    }

    // Trajectory preview and bounce indicator
    const speed = Math.hypot(entity.vx, entity.vy);
    if (speed > 0.05) {
        const dirX = entity.vx / speed;
        const dirY = entity.vy / speed;
        const previewLen = Math.max(24, Math.min(180, speed * 60));
        const step = 1.2;
        let collision = null;

        for (let d = step; d <= previewLen; d += step) {
            const px = entity.x + dirX * d;
            const py = entity.y + dirY * d;
            const hitsBounds = px < 1 || px > STAGE_W - 1 || py < 1 || py > STAGE_H - 1;
            const hitsWall = getCell(Math.floor(px), Math.floor(py)) === TYPE.WALL;
            if (hitsBounds || hitsWall) {
                collision = { x: px, y: py, dist: d };
                break;
            }
        }

        const endX = (collision ? collision.x : entity.x + dirX * previewLen) - entity.x;
        const endY = (collision ? collision.y : entity.y + dirY * previewLen) - entity.y;

        drawArrow(0, 0, endX * SCALE, endY * SCALE, { color: '#ffaa00', width: 5, headSize: 16 });

        if (collision) {
            ctx.save();
            ctx.fillStyle = '#ffaa00';
            ctx.beginPath();
            ctx.arc(endX * SCALE, endY * SCALE, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            const bounceDirX = -dirX;
            const bounceDirY = -dirY;
            const bounceLen = Math.min(50, previewLen * 0.7);

            drawArrow(
                endX * SCALE,
                endY * SCALE,
                (endX + bounceDirX * bounceLen) * SCALE,
                (endY + bounceDirY * bounceLen) * SCALE,
                { color: '#ffaaff', width: 4, dash: [6, 6], headSize: 12, alpha: 0.8 }
            );
        }
    }

    // Flee Direction (magenta) - Only if fleeing
    if (entity.fleeing && entity.fleeAngle !== undefined) {
        const fx = Math.cos(entity.fleeAngle) * sr * 6;
        const fy = Math.sin(entity.fleeAngle) * sr * 6;
        drawArrow(0, 0, fx * 1.5, fy * 1.5, { color: '#ff00ff', width: 5, headSize: 14 });

        // Wall Normal / escape ray (cyan)
        if (entity.wallNormal && (entity.wallNormal.x !== 0 || entity.wallNormal.y !== 0)) {
            drawArrow(0, 0, entity.wallNormal.x * sr * 12, entity.wallNormal.y * sr * 12, { color: '#00ffff', width: 4, dash: [4, 4], headSize: 12 });
        }

        if (entity.escapePreview) {
            const px = (entity.escapePreview.x - entity.x) * SCALE;
            const py = (entity.escapePreview.y - entity.y) * SCALE;
            drawArrow(0, 0, px * 1.5, py * 1.5, { color: '#ff66ff', width: 4, dash: [2, 8], headSize: 12, alpha: 0.9 });
            ctx.save();
            ctx.fillStyle = '#ff66ff';
            ctx.beginPath();
            ctx.arc(px * 1.5, py * 1.5, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    // State Text
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 64px monospace';
    ctx.textAlign = 'left';
    let stateText = '';
    if (entity.fleeing) stateText = 'FLEE';
    else if (entity.pyramidTurret) stateText = 'TURRET';
    else if (entity.invulnerable) stateText = 'SHIELD';
    else if (entity.lanceCharging) stateText = 'CHARGE';
    else if (entity.decoyActive) stateText = 'DECOY';
    if (stateText) ctx.fillText(stateText, sr + 5, 0);

    // Legend
    const legend = [
        ['INT', '#00ff55'],
        ['VEL', '#ffff00'],
        ['TRAJ', '#ffaa00'],
        ['BOUNCE', '#ffaaff'],
        ['FLEE', '#ff00ff'],
        ['ESC', '#00ffff'],
    ];
    ctx.font = 'bold 32px monospace';
    let ly = sr + 40;
    for (const [label, color] of legend) {
        ctx.fillStyle = color;
        ctx.fillText(label, sr + 5, ly);
        ly += 34;
    }

    // Cooldown Display
    let cdValue = entity.cooldown;
    let cdColor = '#888';
    if (entity.rangedCD > 0) { cdValue = entity.rangedCD; cdColor = '#00ff00'; }
    else if (entity.lanceCD > 0) { cdValue = entity.lanceCD; cdColor = '#ffaa00'; }
    else if (entity.summonCD > 0) { cdValue = entity.summonCD; cdColor = '#88ff88'; }
    else if (entity.fleeTimer > 0) { cdValue = entity.fleeTimer; cdColor = '#ff00ff'; }

    if (cdValue > 0) {
        ctx.fillStyle = cdColor;
        ctx.fillText(`CD:${Math.round(cdValue)}`, sr + 5, 64);
    }

    // Ranged attack ranges (if provided by module)
    if (entity.module && entity.module.debugRange) {
        const { min = 0, max = 0, color = '#00ffcc' } = entity.module.debugRange;
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 4]);
        if (min > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, min * (CELL_SIZE / 10), 0, Math.PI * 2);
            ctx.stroke();
        }
        if (max > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, max * (CELL_SIZE / 10), 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    // Poison stacks
    if (entity.poisonStacks > 0) {
        ctx.fillStyle = '#00ff88';
        ctx.fillText(`PSN:${entity.poisonStacks}`, sr + 5, 128);
    }

    if (entity.module && typeof entity.module.debugDraw === 'function') {
        entity.module.debugDraw(entity, ctx, { CELL_SIZE });
    }
}
