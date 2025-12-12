// Initialize Vis.js Network

const container = document.getElementById('mynetwork');

// Process data to match Vis.js format
const nodes = new vis.DataSet(
    heroes.map(h => ({
        id: h.id,
        label: h.label,
        shape: h.image ? 'circularImage' : 'box',
        image: h.image || undefined,
        group: h.group,
        // Custom properties for click handler
        fullData: h
    }))
);

const edges = new vis.DataSet(connections);

const data = {
    nodes: nodes,
    edges: edges
};

const options = {
    nodes: {
        borderWidth: 2,
        size: 30,
        color: {
            border: '#404457',
            background: '#666666'
        },
        font: { color: '#eeeeee', face: 'Rajdhani' }
    },
    edges: {
        color: 'lightgray',
        font: { align: 'middle', strokeWidth: 0, color: '#8892b0' },
        smooth: { type: 'dynamic' }
    },
    groups: {
        avenger: { color: { border: '#e62429', background: '#1f1f1f' } },
        god: { color: { border: '#eec22e', background: '#1f1f1f' }, size: 40 },
        defender: { color: { border: '#2e81ee', background: '#1f1f1f' } },
        shield: { color: { border: '#888', background: '#000' } }
    },
    physics: {
        stabilization: false,
        wind: { x: 0, y: 0 },
    }
};

const network = new vis.Network(container, data, options);

// DOM Elements for Panel
const charName = document.getElementById('charName');
const charDesc = document.getElementById('charDesc');
const charImg = document.getElementById('charImg');
const statsContainer = document.getElementById('statsContainer');

// Interaction Events
network.on("click", function (params) {
    if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const heroData = heroes.find(h => h.id === nodeId);

        if (heroData) {
            updatePanel(heroData);
        }
    } else {
        resetPanel();
    }
});

function updatePanel(data) {
    charName.textContent = data.label;
    charDesc.textContent = data.description;

    // Set Image (fallback to placeholder if needed logic handled in HTML onerror, 
    // but here we trust the data mostly)
    if (data.image) {
        charImg.src = data.image;
    } else {
        charImg.src = `https://placehold.co/150x150/1a1a2e/FFF?text=${data.label[0]}`;
    }

    // Generate Stats Bars
    statsContainer.innerHTML = `
        <div class="stat-row">
            <span class="stat-label">Power Level</span>
            <span class="stat-value">${data.power}/100</span>
        </div>
        <div class="stat-bar-bg" style="width:100%; height:4px; background:#333; margin-bottom:10px;">
            <div style="width:${data.power}%; height:100%; background:var(--accent);"></div>
        </div>

        <div class="stat-row">
            <span class="stat-label">Intelligence</span>
            <span class="stat-value">${data.intelligence}/100</span>
        </div>
        <div class="stat-bar-bg" style="width:100%; height:4px; background:#333;">
            <div style="width:${data.intelligence}%; height:100%; background:#2e81ee;"></div>
        </div>
    `;

    // Animate panel slightly
    const panel = document.getElementById('infoPanel');
    panel.style.transform = "translateX(0px)";
    panel.style.opacity = "1";
}

function resetPanel() {
    charName.textContent = "Sistemas UCM";
    charDesc.textContent = "Selecciona un nodo de la red para analizar sus datos biométricos y relacionales.";
    charImg.src = "assets/placeholder.png"; // Or a generic logo
    statsContainer.innerHTML = "";
    document.getElementById('img-container').style.borderColor = "#333";
}
