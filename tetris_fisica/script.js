const Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite,
    Events = Matter.Events,
    Body = Matter.Body,
    Vector = Matter.Vector;

// Create engine
const engine = Engine.create();
const world = engine.world;

// Create renderer
const width = window.innerWidth;
const height = window.innerHeight;

const render = Render.create({
    element: document.body,
    engine: engine,
    options: {
        width: width,
        height: height,
        wireframes: false,
        background: '#1a1a2e'
    }
});

// Platform
const platformWidth = 400; // Constrained width to make stacking harder
const ground = Bodies.rectangle(width / 2, height - 30, platformWidth, 60, {
    isStatic: true,
    render: { fillStyle: '#555' }
});

const leftWall = Bodies.rectangle(width / 2 - platformWidth / 2 - 10, height / 2, 20, height, {
    isStatic: true,
    render: { visible: false } // Invisible bounds just to help aim initially? No, let's make it open so pieces fall off
});
const rightWall = Bodies.rectangle(width / 2 + platformWidth / 2 + 10, height / 2, 20, height, {
    isStatic: true,
    render: { visible: false }
});

Composite.add(world, [ground, leftWall, rightWall]);

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

// Defines
const BLOCK_SIZE = 40;
const SPAWN_X = width / 2;
const SPAWN_Y = 50;

// Tetromino Definitions (Relative to center)
const SHAPES = {
    'I': { color: '#00f0f0', blocks: [{ x: 0, y: -1.5 }, { x: 0, y: -0.5 }, { x: 0, y: 0.5 }, { x: 0, y: 1.5 }] },
    'O': { color: '#f0f000', blocks: [{ x: -0.5, y: -0.5 }, { x: 0.5, y: -0.5 }, { x: -0.5, y: 0.5 }, { x: 0.5, y: 0.5 }] },
    'T': { color: '#a000f0', blocks: [{ x: 0, y: -0.5 }, { x: -1, y: 0.5 }, { x: 0, y: 0.5 }, { x: 1, y: 0.5 }] },
    'S': { color: '#00f000', blocks: [{ x: 0, y: -0.5 }, { x: 1, y: -0.5 }, { x: -1, y: 0.5 }, { x: 0, y: 0.5 }] },
    'Z': { color: '#f00000', blocks: [{ x: -1, y: -0.5 }, { x: 0, y: -0.5 }, { x: 0, y: 0.5 }, { x: 1, y: 0.5 }] },
    'J': { color: '#0000f0', blocks: [{ x: 0, y: -1.5 }, { x: 0, y: -0.5 }, { x: 0, y: 0.5 }, { x: -1, y: 0.5 }] },
    'L': { color: '#f0a000', blocks: [{ x: 0, y: -1.5 }, { x: 0, y: -0.5 }, { x: 0, y: 0.5 }, { x: 1, y: 0.5 }] }
};

let currentBody = null;
let score = 0;
let isGameOver = false;
let isSpawning = false; // Flag to prevent double spawning

function createTetromino(type, x, y) {
    const shape = SHAPES[type];
    const parts = shape.blocks.map(b => {
        return Bodies.rectangle(x + b.x * BLOCK_SIZE, y + b.y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE, {
            render: { fillStyle: shape.color, strokeStyle: '#000', lineWidth: 2 }
        });
    });

    const body = Body.create({
        parts: parts,
        friction: 0.5,
        frictionStatic: 1.0,
        restitution: 0.1,
        density: 0.002
    });

    return body;
}

function spawnPiece() {
    if (isGameOver) return;
    isSpawning = false;

    // Check if spawn area is clear
    const bodiesAtSpawn = Matter.Query.point(Composite.allBodies(world), { x: SPAWN_X, y: SPAWN_Y });
    const blocking = bodiesAtSpawn.filter(b => b.id !== ground.id && b.id !== leftWall.id && b.id !== rightWall.id);

    if (blocking.length > 0) {
        gameOver();
        return;
    }

    const keys = Object.keys(SHAPES);
    const type = keys[Math.floor(Math.random() * keys.length)];

    currentBody = createTetromino(type, SPAWN_X, SPAWN_Y);
    Composite.add(world, currentBody);
}

spawnPiece();

// Controls
document.addEventListener('keydown', (e) => {
    if (isGameOver || !currentBody || isSpawning) return; // Disable controls if spawning next

    const force = 0.02;

    switch (e.key) {
        case 'ArrowLeft':
            Body.applyForce(currentBody, currentBody.position, { x: -force * currentBody.mass, y: 0 });
            break;
        case 'ArrowRight':
            Body.applyForce(currentBody, currentBody.position, { x: force * currentBody.mass, y: 0 });
            break;
        case 'ArrowUp':
            Body.rotate(currentBody, Math.PI / 2);
            break;
        case 'ArrowDown':
            Body.applyForce(currentBody, currentBody.position, { x: 0, y: force * currentBody.mass * 10 });
            break;
    }
});

// Game Loop / Logic
Events.on(engine, 'collisionStart', (event) => {
    const pairs = event.pairs;

    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];

        // Matter.js compound bodies collision check
        const bodyA = pair.bodyA.parent;
        const bodyB = pair.bodyB.parent;

        if (currentBody && !isSpawning) {
            if (bodyA === currentBody || bodyB === currentBody) {
                // If we hit something, start the timer to spawn next
                // But if we just scraped a wall, maybe let it slide? 
                // For 'Chaos Tetris', any touch = landed is safer to ensure progression.

                isSpawning = true;

                setTimeout(() => {
                    spawnPiece();
                }, 1000);
            }
        }
    }
});

// Update Score (Max Height)
Events.on(engine, 'afterUpdate', () => {
    if (isGameOver) return;

    // Filter bodies that are Tetrominoes (ignore ground)
    const bodies = Composite.allBodies(world).filter(b => b.id !== ground.id);
    if (bodies.length === 0) return;

    // Find min Y (highest point)
    let minY = height;
    bodies.forEach(b => {
        if (b.position.y < minY) minY = b.position.y;

        // Check falling off
        if (b.position.y > height + 100) {
            Composite.remove(world, b); // Despawn fallen pieces
        }
    });

    const currentHeight = Math.floor((height - 30 - minY) / 10); // 10px = 1m
    document.getElementById('height').innerText = Math.max(0, currentHeight);
});

function gameOver() {
    isGameOver = true;
    document.getElementById('gameOver').classList.add('visible');
    document.getElementById('gameOver').classList.remove('hidden');
}

window.resetGame = function () {
    isGameOver = false;
    document.getElementById('gameOver').classList.remove('visible');
    document.getElementById('gameOver').classList.add('hidden');

    const bodies = Composite.allBodies(world).filter(b => b.id !== ground.id);
    Composite.remove(world, bodies);

    spawnPiece();
};
