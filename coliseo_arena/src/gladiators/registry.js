import crit from './crit/index.js';
import speed from './speed/index.js';
import spinner from './spinner/index.js';
import tank from './tank/index.js';
import spike from './spike/index.js';
import ninja from './ninja/index.js';
import prism from './prism/index.js';
import orb from './orb/index.js';
import cube from './cube/index.js';
import star from './star/index.js';
import hex from './hex/index.js';
import pyramid from './pyramid/index.js';
import bomber from './bomber/index.js';
import summoner from './summoner/index.js';
import lancer from './lancer/index.js';
import berserker from './berserker/index.js';
import archer from './archer/index.js';
import poison from './poison/index.js';
import illusion from './illusion/index.js';

const REGISTRY = {
    crit,
    speed,
    spinner,
    tank,
    spike,
    ninja,
    prism,
    orb,
    cube,
    star,
    hex,
    pyramid,
    bomber,
    summoner,
    lancer,
    berserker,
    archer,
    poison,
    illusion
};

const DefaultModule = {
    key: 'default',
    name: 'Default',
    update() {},
    onCombat() {},
    draw() {}
};

export function getGladiatorModule(key) {
    return REGISTRY[key] || DefaultModule;
}

