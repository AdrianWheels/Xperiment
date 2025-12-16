import { SAFE_BOUNDS, STAGE_W, STAGE_H } from '../../config.js';

const WALL_BOUNCES_REQUIRED = 5;
const ENEMY_BOUNCE_SPEED_MULT = 1.35;
const WALL_BOUNCE_SPEED_MULT = 1.08;

export default {
    key: 'speed',
    name: 'Speed',
    
    onInit(self) {
        self.speedBounceActive = false;
        self.speedBounces = 0;
        self._speedPrevPos = { x: self.x, y: self.y };
    },
    
    update(self, { simulationSpeed, floatingTexts }) {
        // Distance-based XP (existing behavior)
        const dx = self.x - self._speedPrevPos.x;
        const dy = self.y - self._speedPrevPos.y;
        const traveled = Math.hypot(dx, dy);
        self._speedPrevPos = { x: self.x, y: self.y };
        const xpGain = traveled * 0.12;
        if (xpGain > 0) self.gainXp(xpGain, floatingTexts);

        // While bouncing, stay in glide mode (no seeking)
        if (self.speedBounceActive) {
            self.skipSeek = true;
        }
    },
    modifyDamage(self, enemy, damage, { floatingTexts }) {
        const speed = Math.hypot(self.vx, self.vy);
        const scaled = damage * (1 + speed * 0.5);
        if (speed > self.baseSpeed * 1.5) {
            self.gainXp(5, floatingTexts);
        }
        return { damage: scaled };
    },
    onLevelUp(self) {
        self.baseSpeed *= 1.22;
    },
    onCollisionRepel(self, other, { floatingTexts }) {
        // Bounce off enemies to start the ricochet chain
        const away = Math.atan2(self.y - other.y, self.x - other.x);
        const speed = Math.max(self.baseSpeed * 1.8, Math.hypot(self.vx, self.vy) * ENEMY_BOUNCE_SPEED_MULT);
        self.vx = Math.cos(away) * speed;
        self.vy = Math.sin(away) * speed;
        self.speedBounceActive = true;
        self.speedBounces = 0;
        self.gainXp(10, floatingTexts);
        return 0.8;
    },
    onWallBounce(self) {
        if (!self.speedBounceActive) return;
        self.speedBounces += 1;
        const speed = Math.hypot(self.vx, self.vy) * WALL_BOUNCE_SPEED_MULT;
        const angle = Math.atan2(self.vy, self.vx);
        self.vx = Math.cos(angle) * speed;
        self.vy = Math.sin(angle) * speed;
        if (self.speedBounces >= WALL_BOUNCES_REQUIRED) {
            self.speedBounceActive = false;
        }
    },
    onDamageTaken(self, attacker, amount) {
        // Taking damage cancels the bounce state
        self.speedBounceActive = false;
        self.speedBounces = 0;
        return amount;
    },
    getFriction(self) {
        return self.speedBounceActive ? 0.995 : 0.98;
    },
    onOutOfBounds(self) {
        // Clamp inside using centralized SAFE_BOUNDS and reflect velocity to keep the speedster in-bounds
        self.x = Math.min(SAFE_BOUNDS.maxX, Math.max(SAFE_BOUNDS.minX, self.x));
        self.y = Math.min(SAFE_BOUNDS.maxY, Math.max(SAFE_BOUNDS.minY, self.y));
        self.vx *= -0.65;
        self.vy *= -0.65;
        if (self.speedBounceActive) {
            self.speedBounces += 1;
            if (self.speedBounces >= WALL_BOUNCES_REQUIRED) self.speedBounceActive = false;
        }
        return true; // handled; prevent death
    },
    onCombat() {},
    draw() {}
};

