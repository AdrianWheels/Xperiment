const canvas = document.getElementById('artCanvas');
const ctx = canvas.getContext('2d');
const hashDisplay = document.getElementById('hashDisplay');
const regenerateBtn = document.getElementById('regenerateBtn');
const downloadBtn = document.getElementById('downloadBtn');

// Set canvas resolution strictly
const size = 1000;
canvas.width = size;
canvas.height = size;

// Config
let seed = generateSeed();
let config = {};

function generateSeed() {
    // Generate a pseudo-fingerprint from browser data + random
    const str = navigator.userAgent + navigator.language + new Date().getTime() + Math.random();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

function seededRandom(localSeed) {
    const x = Math.sin(localSeed++) * 10000;
    return x - Math.floor(x);
}

function generatePalette(rootSeed) {
    const hue = Math.floor(seededRandom(rootSeed) * 360);
    const compliment = (hue + 180) % 360;
    const tri1 = (hue + 120) % 360;
    
    return [
        `hsla(${hue}, 80%, 60%, 0.8)`,
        `hsla(${compliment}, 70%, 50%, 0.6)`,
        `hsla(${tri1}, 90%, 70%, 0.4)`,
        `hsla(${hue}, 100%, 90%, 0.1)`
    ];
}

function drawFingerprint() {
    // Clear
    ctx.fillStyle = '#0f0f13';
    ctx.fillRect(0, 0, size, size);

    // Setup from seed
    let currentSeed = seed;
    const palette = generatePalette(currentSeed);
    const rings = 20 + Math.floor(seededRandom(currentSeed + 1) * 30);
    const distortion = seededRandom(currentSeed + 2) * 20;
    
    hashDisplay.textContent = `IDENTITY HASH: 0x${seed.toString(16).toUpperCase()}`;

    // Draw pattern
    ctx.lineWidth = 2 + seededRandom(currentSeed + 3) * 3;
    ctx.lineCap = 'round';

    const cx = size / 2;
    const cy = size / 2;

    for (let i = 0; i < rings; i++) {
        const radius = (i * (size / 2.2)) / rings + 20;
        const circumference = 2 * Math.PI * radius;
        const segmentCount = Math.floor(circumference / 10); 
        
        ctx.strokeStyle = palette[i % palette.length];
        
        ctx.beginPath();
        for (let j = 0; j <= segmentCount; j++) {
            const angle = (j / segmentCount) * Math.PI * 2;
            
            // Noise / Distortion calculation
            const noise = Math.sin(angle * 5 + i) * Math.cos(angle * 10 - i) * distortion;
            const r = radius + noise;
            
            const x = cx + Math.cos(angle) * r;
            const y = cy + Math.sin(angle) * r;
            
            if (j === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();

        // Add some "ridges" or particles
        if (i % 3 === 0) {
            drawParticles(radius, palette[(i+1) % palette.length], currentSeed + i);
        }
    }
}

function drawParticles(radius, color, localSeed) {
    const count = 10;
    ctx.fillStyle = color;
    for(let k=0; k<count; k++) {
        if(seededRandom(localSeed + k) > 0.5) continue;
        const angle = seededRandom(localSeed + k * 10) * Math.PI * 2;
        const r = radius + (seededRandom(localSeed + k * 20) - 0.5) * 30;
        const x = size/2 + Math.cos(angle) * r;
        const y = size/2 + Math.sin(angle) * r;
        
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Init
drawFingerprint();

// Events
regenerateBtn.addEventListener('click', () => {
    seed = generateSeed(); // New random seed
    
    // Animate transition
    canvas.style.opacity = '0';
    canvas.style.transform = 'scale(0.9) rotate(-10deg)';
    
    setTimeout(() => {
        drawFingerprint();
        canvas.style.opacity = '1';
        canvas.style.transform = 'scale(1) rotate(0deg)';
    }, 300);
});

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    link.download = `fingerprint-${seed}.png`;
    link.href = canvas.toDataURL();
    link.click();
});
