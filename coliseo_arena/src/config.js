export const CELL_SIZE = 12;
export const STAGE_W = 300;
export const STAGE_H = 200;

// Arena bounds configuration
export const WALL_MARGIN = 10; // Wall thickness in cells

// Safe boundaries for gladiator movement (prevents wall/ring-out)
export const SAFE_BOUNDS = {
    minX: WALL_MARGIN + 2,           // 12
    maxX: STAGE_W - WALL_MARGIN - 2, // 288
    minY: WALL_MARGIN + 2,           // 12
    maxY: STAGE_H - WALL_MARGIN - 2  // 188
};

// Warning zone for corner escape (trigger early avoidance)
export const WARNING_DISTANCE = 25; // Distance from edge to trigger corner escape

export const TYPE = {
    EMPTY: 0,
    WALL: 1,
    SAND: 2,
    WATER: 3,
    FIRE: 4,
    ACID: 5,
    PLANT: 6,
    STONE: 7,
    LIGHT: 8,
    FORCE: 9,
    ENERGY: 10,
    TECH: 11,
    ANCIENT: 12
};

export const COLORS = [
    '#000000', '#555555', '#edc9af', '#2255ff', '#ff4400', '#00ff00', '#22aa22',
    '#888888', '#ffffff', '#ff8800', '#ffff00', '#aa00ff', '#d4af37'
];

export const CLASSES = {
    // Row 1
    'crit': { name: 'Critical', hp: 400, speed: 1.2, spriteIdx: 0 },
    'speed': { name: 'Speed', hp: 300, speed: 2.5, spriteIdx: 1 },
    'spinner': { name: 'Spinner', hp: 500, speed: 1.5, spriteIdx: 2 },
    'tank': { name: 'Tank', hp: 1100, speed: 0.25, spriteIdx: 4 },
    'spike': { name: 'Spike', hp: 750, speed: 0.8, spriteIdx: 5 },
    'ninja': { name: 'Ninja', hp: 350, speed: 1.8, spriteIdx: 6 },
    // Row 2
    'prism': { name: 'Prism', hp: 450, speed: 1.0, spriteIdx: 8 },
    'orb': { name: 'Orb', hp: 700, speed: 0.7, spriteIdx: 9 },
    'cube': { name: 'Cube', hp: 1000, speed: 0.4, spriteIdx: 10 },
    'star': { name: 'Star', hp: 450, speed: 1.3, spriteIdx: 11 },
    'hex': { name: 'Hex', hp: 600, speed: 0.9, spriteIdx: 13 },
    'pyramid': { name: 'Pyramid', hp: 800, speed: 0.3, spriteIdx: 14 },
    // Row 3 (New)
    'bomber': { name: 'Bomber', hp: 500, speed: 1.0, spriteIdx: 15 },
    'summoner': { name: 'Summoner', hp: 450, speed: 0.9, spriteIdx: 15 },
    'lancer': { name: 'Lancer', hp: 400, speed: 1.4, spriteIdx: 15 },
    'berserker': { name: 'Berserker', hp: 750, speed: 1.1, spriteIdx: 15 },
    'archer': { name: 'Archer', hp: 350, speed: 1.0, spriteIdx: 15 },
    'poison': { name: 'Poison', hp: 500, speed: 0.8, spriteIdx: 15 },
    'illusion': { name: 'Illusion', hp: 700, speed: 1.2, spriteIdx: 15 }
};

/**
 * Configuración del Sistema de Movimiento
 * Parámetros ajustables para cada estrategia de movimiento
 */
export const MOVEMENT_CONFIG = {
    // Configuración para Movimiento Agresivo
    AGGRESSIVE: {
        seekInterval: 1,              // Frames entre actualizaciones de seek (1 = cada frame)
        seekAcceleration: 0.1,        // Aceleración hacia el objetivo
        friction: 0.98,               // Fricción por defecto (0.98 = 2% de pérdida por frame)
        wallBounceFactor: 1.1,        // Factor de rebote en paredes
        repelForce: 0.5               // Fuerza de repulsión en colisiones
    },
    
    // Configuración para Movimiento Defensivo (Flee)
    DEFENSIVE: {
        friction: 0.98,
        wallBounceFactor: 1.1,
        repelForce: 0.5,
        
        // Parámetros específicos de flee
        fleeThresholdClose: 120,      // Distancia considerada "cerca" del enemigo
        fleeSpeedClose: 0.9,          // Multiplicador de velocidad cuando está cerca
        fleeSpeedFar: 0.55,           // Multiplicador de velocidad cuando está lejos
        fleeSamples: 16,              // Número de direcciones a evaluar para evitar paredes
        fleeCheckDistance: 40,        // Distancia de raycast para detección de paredes
        fleeSpreadAngle: Math.PI / 2, // Ángulo de búsqueda (90 grados)
        stuckThreshold: 20            // Frames sin movimiento antes de considerar "atascado"
    },
    
    // Configuración para Movimiento Pasivo
    PASSIVE: {
        friction: 1.0,                // Sin fricción por defecto para órbitas constantes
        wallBounceFactor: 1.1,
        repelForce: 0.5,
        
        // Parámetros para diferentes patrones pasivos
        pattern: 'idle',              // idle, orbit, patrol, wander
        
        // Orbit
        orbitSpeed: 0.2,              // Velocidad angular de órbita (radianes/frame)
        orbitRadius: 50,              // Radio de la órbita
        orbitSpeedMultiplier: 1.0,    // Multiplicador de velocidad lineal
        
        // Patrol
        patrolSpeed: 0.6,             // Multiplicador de velocidad para patrullar
        
        // Wander
        wanderFrequency: 0.02,        // Frecuencia del movimiento errático
        wanderSpeedMultiplier: 0.4    // Multiplicador de velocidad para wander
    }
};

