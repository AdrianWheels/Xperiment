const test = require('node:test');
const assert = require('node:assert');

const { simulateDpsAgainstDummy, CLASSES } = require('../script.js');

const PLAYABLE_CLASSES = ['crit', 'speed', 'spinner', 'tank', 'spike', 'ninja'];

PLAYABLE_CLASSES.forEach((className) => {
    test(`el gladiador ${className} inflige daño sostenido al dummy`, () => {
        const durationSeconds = 5;
        const result = simulateDpsAgainstDummy(className, durationSeconds);

        assert.ok(Number.isFinite(result.dps), 'el DPS debe ser un número finito');
        assert.ok(result.dps > 0, 'se espera DPS mayor que cero');
        assert.ok(result.hits > 0, 'debe registrar impactos contra el dummy');
        assert.equal(result.framesSimulated, durationSeconds * 60);
    });
});

test('el dummy permanece inmóvil y acumula daño', () => {
    const firstRun = simulateDpsAgainstDummy('crit', 3);
    const secondRun = simulateDpsAgainstDummy('crit', 3);

    assert.ok(firstRun.totalDamage > 0, 'el dummy debe recibir daño en la simulación');
    assert.ok(secondRun.totalDamage > 0, 'el dummy debe recibir daño tras reiniciar la arena');
});

test('las clases definidas siguen disponibles para el sistema de pruebas', () => {
    PLAYABLE_CLASSES.forEach((className) => {
        assert.ok(CLASSES[className], `la clase ${className} debe existir`);
    });
});
