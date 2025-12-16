import { TYPE, STAGE_W, STAGE_H } from '../config.js';
import { Entity } from '../entities/Entity.js';
import { initGrid } from '../core/Grid.js';

const TEAM_COLORS = {
    red: { primary: '#ff5470', soft: 'rgba(255, 84, 112, 0.18)', label: 'RED TEAM' },
    blue: { primary: '#51a2ff', soft: 'rgba(81, 162, 255, 0.18)', label: 'BLUE TEAM' },
    default: { primary: '#aaaaaa', soft: 'rgba(170, 170, 170, 0.18)', label: 'NEUTRAL' }
};

const cardMap = new WeakMap();
const tweenMap = new WeakMap();

const lerp = (from, to, factor = 0.18) => from + (to - from) * factor;
const clampPct = (value) => Math.max(0, Math.min(100, value));

function buildCard() {
    const card = document.createElement('div');
    card.className = 'gladiator-card';
    card.innerHTML = `
        <div class="gl-top">
            <div class="gl-pip"></div>
            <div class="gl-title">
                <span class="gl-name"></span>
                <span class="gl-level"></span>
            </div>
            <div class="team-pill"></div>
        </div>
        <div class="gl-stats">
            <div class="stat-row">
                <span>HP</span>
                <span class="value hp-val"></span>
            </div>
            <div class="stat-bar hp"><div class="fill hp-fill"></div></div>
            <div class="stat-row">
                <span>XP</span>
                <span class="value xp-val"></span>
            </div>
            <div class="stat-bar xp"><div class="fill xp-fill"></div></div>
            <div class="stat-row dps-row">
                <span>DPS</span>
                <span class="value dps-val"></span>
            </div>
        </div>
    `;

    card._refs = {
        name: card.querySelector('.gl-name'),
        level: card.querySelector('.gl-level'),
        team: card.querySelector('.team-pill'),
        hpVal: card.querySelector('.hp-val'),
        xpVal: card.querySelector('.xp-val'),
        dpsVal: card.querySelector('.dps-val'),
        hpFill: card.querySelector('.hp-fill'),
        xpFill: card.querySelector('.xp-fill'),
    };

    return card;
}

export function setupUI(state, startCombatLoop, startCombatLoop2v2) {
    const pCountElem = document.getElementById('pCount');
    const fpsElem = document.getElementById('fpsCount');
    const combatStatusElem = document.getElementById('combatStatus');

    // Legacy spawn logic removed


    document.getElementById('startCombatBtn').addEventListener('click', () => {
        startCombatLoop();
    });

    const btn2v2 = document.getElementById('startCombat2v2Btn');
    if (btn2v2) {
        btn2v2.addEventListener('click', () => {
            if (startCombatLoop2v2) startCombatLoop2v2();
        });
    }

    document.querySelectorAll('.btn-speed').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.btn-speed').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            state.simulationSpeed = parseInt(e.target.dataset.speed);
        });
    });

    document.getElementById('clearBtn').addEventListener('click', () => {
        initGrid();
        state.entities = [];
        state.floatingTexts = [];
        state.combatLoopActive = false;
        if (state.combatTimer) clearTimeout(state.combatTimer);
        combatStatusElem.textContent = "Idle";
        state.overlay.clear();
    });

    return { pCountElem, fpsElem, combatStatusElem };
}

export function updateGladiatorList(entities) {
    const listElem = document.getElementById('gladiatorList');
    if (!listElem) return;

    if (!entities || entities.length === 0) {
        listElem.innerHTML = '';
        return;
    }

    const activeCards = new Set();

    entities.forEach(e => {
        let card = cardMap.get(e);
        if (!card) {
            card = buildCard();
            cardMap.set(e, card);
            tweenMap.set(e, { hp: e.hp, xp: e.xp, dps: e.damageDealt });
        }

        const refs = card._refs;
        const palette = TEAM_COLORS[e.team] || TEAM_COLORS.default;
        card.style.setProperty('--team', palette.primary);
        card.style.setProperty('--team-soft', palette.soft);
        refs.team.textContent = palette.label;
        card.dataset.team = e.team;

        refs.name.textContent = e.className.toUpperCase();
        refs.level.textContent = `Lv.${e.level}`;

        const tween = tweenMap.get(e) || { hp: e.hp, xp: e.xp, dps: e.damageDealt };
        tween.hp = lerp(tween.hp, e.hp);
        tween.xp = lerp(tween.xp, e.xp);
        tween.dps = lerp(tween.dps, e.damageDealt);
        tweenMap.set(e, tween);

        const hpPct = clampPct((tween.hp / e.maxHp) * 100);
        const xpPct = clampPct((tween.xp / e.xpToNextLevel) * 100);

        refs.hpFill.style.width = `${hpPct}%`;
        refs.xpFill.style.width = `${xpPct}%`;
        refs.hpVal.textContent = `${Math.ceil(tween.hp)}/${Math.ceil(e.maxHp)}`;
        refs.xpVal.textContent = `${Math.floor(tween.xp)}/${e.xpToNextLevel}`;
        refs.dpsVal.textContent = `${Math.round(tween.dps)} DPS`;

        card.classList.toggle('dead', Boolean(e.dead));

        listElem.appendChild(card);
        activeCards.add(card);
    });

    Array.from(listElem.children).forEach(card => {
        if (!activeCards.has(card)) {
            listElem.removeChild(card);
        }
    });
}
