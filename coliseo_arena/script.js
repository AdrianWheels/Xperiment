const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';

let canvas = null;
let ctx = null;
let pCountElem = { textContent: 0 };
let fpsElem = { textContent: 0 };

if (isBrowser) {
    canvas = document.getElementById('sandCanvas');
    ctx = canvas.getContext('2d', { alpha: false });
    pCountElem = document.getElementById('pCount');
    fpsElem = document.getElementById('fpsCount');
}

// --- CONFIGURATION ---
const CELL_SIZE = 3;
const STAGE_W = 300;
const STAGE_H = 200;

const TYPE = {
    EMPTY: 0,
    WALL: 1,
    SAND: 2,
    WATER: 3,
    FIRE: 4,
    ACID: 5,
    PLANT: 6
};

const COLORS = [
    '#000000', '#555555', '#edc9af', '#2255ff', '#ff4400', '#00ff00', '#22aa22'
];

if (isBrowser && canvas) {
    canvas.width = STAGE_W * CELL_SIZE;
    canvas.height = STAGE_H * CELL_SIZE;
}

let grid = new Uint8Array(STAGE_W * STAGE_H).fill(TYPE.EMPTY);
let entities = [];

// --- INITIALIZATION ---
function initArena() {
    grid.fill(TYPE.EMPTY);
    entities = [];

    // Walls
    const margin = 10;
    for (let y = 0; y < STAGE_H; y++) {
        for (let x = 0; x < STAGE_W; x++) {
            if (x < margin || x > STAGE_W - margin || y < margin || y > STAGE_H - margin) {
                setCell(x, y, TYPE.WALL);
            }
        }
    }
}
initArena();

// --- CLASS DEFINITIONS ---
const CLASSES = {
    'crit': { name: 'Critical', hp: 80, speed: 1.2, color: '#ff0000' },
    'speed': { name: 'Speed', hp: 60, speed: 2.5, color: '#00ffff' },
    'spinner': { name: 'Spinner', hp: 100, speed: 1.5, color: '#ffaaaa' },
    'tank': { name: 'Tank', hp: 200, speed: 0.5, color: '#555555' },
    'spike': { name: 'Spike', hp: 150, speed: 0.8, color: '#22aa22' },
    'ninja': { name: 'Ninja', hp: 70, speed: 1.8, color: '#333333' },
    'dummy': { name: 'Dummy', hp: 99999, speed: 0, color: '#aaaaaa' }
};

// --- ENTITY SYSTEM ---
class Entity {
    constructor(x, y, className, elementType) {
        this.x = x;
        this.y = y;
        this.className = className;
        this.elementType = elementType;

        const stats = CLASSES[className];

        // Base Stats
        this.maxHp = stats.hp;
        this.hp = this.maxHp;
        this.baseSpeed = stats.speed;
        this.radius = 4;

        this.level = 1;
        this.xp = 0;

        // Movement
        this.vx = (Math.random() - 0.5) * this.baseSpeed;
        this.vy = (Math.random() - 0.5) * this.baseSpeed;

        // Special Stats
        this.critChance = 0.1; // Crit
        this.combo = 0; // Spinner
        this.invulnerable = false; // Tank
        this.invulnTimer = 0;
        this.reflectDmg = 5; // Spike
        this.dodgeChance = 0.1; // Ninja

        // Timers
        this.cooldown = 0;
        this.age = 0;
    }

    update() {
        if (this.hp <= 0) return this.die();
        this.age++;

        this.applyClassLogic();
        this.move();
        this.checkCollisions();

        // Passive XP
        this.xp += 0.2;
        if (this.xp > this.level * 80) this.levelUp();
    }

    applyClassLogic() {
        // Tank Shield Logic
        if (this.className === 'tank') {
            const shieldInterval = Math.max(100, 300 - (this.level * 20)); // Shield more often as level up
            if (this.age % shieldInterval === 0) {
                this.invulnerable = true;
                this.invulnTimer = 30 + (this.level * 10); // Lasts longer
            }
            if (this.invulnTimer > 0) {
                this.invulnTimer--;
                if (this.invulnTimer <= 0) this.invulnerable = false;
            }
        }

        // Speedster Logic
        if (this.className === 'speed') {
            if (Math.random() < 0.05) this.vx *= 1.1; // Burst
        }

        // Spinner Logic (Spiral movement)
        if (this.className === 'spinner') {
            // Apply angular force perpendicular to velocity
            const turnSpeed = 0.2 + (this.level * 0.05); // Tighter turns
            const angle = Math.atan2(this.vy, this.vx);
            const newAngle = angle + turnSpeed;
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            this.vx = Math.cos(newAngle) * speed;
            this.vy = Math.sin(newAngle) * speed;
        }
    }

    move() {
        this.x += this.vx;
        this.y += this.vy;

        // Friction for non-spinners to stabilize
        if (this.className !== 'spinner') {
            this.vx *= 0.98;
            this.vy *= 0.98;

            // AI Seek
            if (this.age % 10 === 0) this.seekEnemy();
        }

        // Wall Bounce
        if (getCell(Math.floor(this.x), Math.floor(this.y)) === TYPE.WALL) {
            this.vx *= -1; this.vy *= -1;
            this.x += this.vx * 4; this.y += this.vy * 4;

            if (this.className === 'spinner') this.combo = 0; // Reset combo

            // Ninja Wall Teleport
            if (this.className === 'ninja' && Math.random() < (0.3 + this.level * 0.05)) {
                // Teleport to random spot to "Ambush"
                this.x = STAGE_W / 2 + (Math.random() - 0.5) * 50;
                this.y = STAGE_H / 2 + (Math.random() - 0.5) * 50;
            }
        }
    }

    seekEnemy() {
        let nearest = null;
        let minD = 999;
        for (let e of entities) {
            if (e === this || e.className === this.className) continue;
            let d = Math.hypot(e.x - this.x, e.y - this.y);
            if (d < minD) { minD = d; nearest = e; }
        }
        if (nearest) {
            let angle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
            let accel = 0.1;
            this.vx += Math.cos(angle) * accel;
            this.vy += Math.sin(angle) * accel;
        }
    }

    checkCollisions() {
        for (let other of entities) {
            if (other === this) continue;
            let dist = Math.hypot(this.x - other.x, this.y - other.y);
            if (dist < this.radius + other.radius) {
                this.handleCombat(other);

                // Repel
                let angle = Math.atan2(this.y - other.y, this.x - other.x);
                this.vx += Math.cos(angle) * 0.5;
                this.vy += Math.sin(angle) * 0.5;
            }
        }
    }

    handleCombat(enemy) {
        if (this.cooldown > 0) { this.cooldown--; return; }

        let damage = 5 + (this.level * 2);
        let isCrit = false;

        // CRITICAL CLASS
        if (this.className === 'crit') {
            if (Math.random() < (this.critChance + this.level * 0.05)) {
                damage *= 3;
                isCrit = true;
            }
        }

        // SPINNER CLASS combo
        if (this.className === 'spinner') {
            this.combo++;
            damage *= (1 + this.combo * 0.2); // Ramp up
        }

        enemy.takeDamage(damage, this);
        this.cooldown = 10;

        // Ninja Steal
        if (this.className === 'ninja') {
            this.hp = Math.min(this.maxHp, this.hp + damage * 0.5); // Lifesteal
        }
    }

    takeDamage(amount, attacker) {
        // Ninja Dodge
        if (this.className === 'ninja') {
            if (Math.random() < (this.dodgeChance + this.level * 0.02)) {
                return; // Missed
            }
        }

        // Tank Invuln
        if (this.invulnerable) return;

        // Spike Reflect
        if (this.className === 'spike' && attacker) {
            attacker.takeDamage(this.reflectDmg + this.level * 2, null);
        }

        this.hp -= amount;
        this.xp += 5; // XP for taking hits

        // Blood particles
        if (Math.random() > 0.5) {
            setCell(Math.floor(this.x), Math.floor(this.y), this.elementType);
        }
    }

    levelUp() {
        this.level++;
        this.xp = 0;
        this.maxHp *= 1.2;
        this.hp = this.maxHp;

        // Spinner shrinks
        if (this.className === 'spinner') this.radius = Math.max(2, this.radius * 0.9);
        else this.radius = Math.min(10, this.radius + 1);

        // Visual
        drawCircle(Math.floor(this.x), Math.floor(this.y), 15, TYPE.EMPTY);
    }

    die() {
        drawCircle(Math.floor(this.x), Math.floor(this.y), this.radius * 2, this.elementType);
        this.dead = true;
    }

    draw(ctx) {
        const sx = this.x * CELL_SIZE;
        const sy = this.y * CELL_SIZE;
        const sr = this.radius * CELL_SIZE;

        ctx.save();
        ctx.translate(sx, sy);

        // Shield Effect
        if (this.invulnerable) {
            ctx.strokeStyle = '#00ffff';
            ctx.beginPath();
            ctx.arc(0, 0, sr + 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Body
        ctx.fillStyle = CLASSES[this.className].color;

        if (this.className === 'spinner') {
            ctx.fillStyle = `hsl(${this.age * 10}, 70%, 50%)`; // Rainbow spin
        }

        if (this.className === 'ninja') ctx.globalAlpha = 0.6; // Ghostly

        ctx.beginPath();
        if (this.className === 'tank') ctx.rect(-sr, -sr, sr * 2, sr * 2);
        else if (this.className === 'spike') {
            ctx.moveTo(0, -sr * 1.5); ctx.lineTo(sr, sr); ctx.lineTo(-sr, sr);
        }
        else ctx.arc(0, 0, sr, 0, Math.PI * 2);

        ctx.fill();
        ctx.globalAlpha = 1;

        // Info
        ctx.fillStyle = "#fff";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";

        let icon = '';
        if (this.className === 'crit') icon = '🎯';
        if (this.className === 'ninja') icon = '🥷';

        ctx.fillText(`${icon} Lv.${this.level}`, 0, -sr - 5);

        // HP
        const hpPct = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = '#333';
        ctx.fillRect(-sr * 1.5, sr + 4, sr * 3, 3);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(-sr * 1.5, sr + 4, sr * 3 * hpPct, 3);

        ctx.restore();
    }
}

class TrainingDummy extends Entity {
    constructor(x, y) {
        super(x, y, 'dummy', TYPE.WALL);
        this.damageTaken = 0;
        this.hitCount = 0;
        this.vx = 0;
        this.vy = 0;
    }

    update() {
        this.age++;
        // Keeps the dummy static while still participating in collision checks.
    }

    takeDamage(amount) {
        this.damageTaken += amount;
        this.hitCount++;
    }
}

// --- BASIC ENGINE & LOOP (Reuse previous helper functions) ---

function setCell(x, y, type) { if (x >= 0 && x < STAGE_W && y >= 0 && y < STAGE_H) grid[y * STAGE_W + x] = type; }
function getCell(x, y) { if (x >= 0 && x < STAGE_W && y >= 0 && y < STAGE_H) return grid[y * STAGE_W + x]; return TYPE.WALL; }
function drawCircle(cx, cy, r, type) { for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) if (x * x + y * y <= r * r) setCell(cx + x, cy + y, type); }

function updateGame() {
    // Entities
    for (let i = entities.length - 1; i >= 0; i--) {
        const e = entities[i];
        if (e.dead) { entities.splice(i, 1); continue; }
        e.update();
    }

    // Sand
    // (Simplified sand logic for background ambience)
    for (let i = 0; i < 1000; i++) { // Random sampling for speed
        const rx = Math.floor(Math.random() * STAGE_W);
        const ry = Math.floor(Math.random() * STAGE_H);
        const cell = grid[ry * STAGE_W + rx];
        if (cell > TYPE.WALL) {
            if (grid[(ry + 1) * STAGE_W + rx] === TYPE.EMPTY) {
                grid[ry * STAGE_W + rx] = TYPE.EMPTY;
                grid[(ry + 1) * STAGE_W + rx] = cell;
            }
        }
    }
}

function render() {
    if (!isBrowser || !ctx) return;

    if (!window.offCanvas) {
        window.offCanvas = document.createElement('canvas');
        window.offCanvas.width = STAGE_W;
        window.offCanvas.height = STAGE_H;
        window.offCtx = window.offCanvas.getContext('2d');
        window.offData = window.offCtx.createImageData(STAGE_W, STAGE_H);
    }

    const buf32 = new Uint32Array(window.offData.data.buffer);
    const ABGR = COLORS.map(c => {
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        return 0xFF000000 | (b << 16) | (g << 8) | r;
    });

    for (let i = 0; i < grid.length; i++) buf32[i] = ABGR[grid[i]];
    window.offCtx.putImageData(window.offData, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(window.offCanvas, 0, 0, canvas.width, canvas.height);

    entities.forEach(e => e.draw(ctx));
}

// UI
let spawnClass = 'crit';
let spawnElement = TYPE.FIRE;

function simulateDpsAgainstDummy(className, durationSeconds = 10) {
    initArena();

    const centerX = STAGE_W / 2;
    const centerY = STAGE_H / 2;
    const attacker = new Entity(centerX - 5, centerY, className, TYPE.FIRE);
    const dummy = new TrainingDummy(centerX + 2, centerY);

    attacker.vx = 0;
    attacker.vy = 0;

    entities.push(attacker, dummy);

    const frames = Math.floor(durationSeconds * 60);
    for (let i = 0; i < frames; i++) {
        updateGame();
    }

    return {
        dps: dummy.damageTaken / durationSeconds,
        totalDamage: dummy.damageTaken,
        hits: dummy.hitCount,
        framesSimulated: frames,
        finalLevel: attacker.level
    };
}

if (isBrowser) {
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            spawnClass = e.target.dataset.class;
            spawnElement = TYPE[e.target.dataset.element.toUpperCase()] || TYPE.FIRE;

            // Auto spawn center
            entities.push(new Entity(STAGE_W / 2, STAGE_H / 2, spawnClass, spawnElement));
        });
    });

    document.getElementById('clearBtn').addEventListener('click', initArena);

    function loop() {
        updateGame();
        render();
        pCountElem.textContent = entities.length;
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

if (typeof module !== 'undefined') {
    module.exports = {
        Entity,
        TrainingDummy,
        simulateDpsAgainstDummy,
        initArena,
        updateGame,
        CLASSES,
        TYPE,
        entities
    };
}
