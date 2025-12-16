# Comportamiento de los Gladiadores

Este documento describe las clases de gladiadores disponibles en el Coliseo de Arena, sus estadísticas base y sus comportamientos especiales.

## Sistema de Combate
- **Daño Base**: 5 + (Nivel * 2)
- **Cooldown de Ataque**: 10 frames

## Sistema de Experiencia (XP)

Los gladiadores ganan experiencia (XP) al realizar acciones exitosas acordes a su rol. Al acumular suficiente XP, suben de nivel.

- **Nivel 1 -> 2**: 100 XP
- **Escalado**: XP necesaria aumenta un 20% por nivel.
- **Efecto Global**: Al subir de nivel, aumentan su HP Máximo un 20%. La vida actual se mantiene en el mismo porcentaje.

---

## Clases de Gladiadores (Fila 1)

### Critical (Crit)
- **HP**: 80 | **Speed**: 1.2
- **Habilidad**: Probabilidad de golpe crítico (x3 daño).
- **XP Trigger**: Gana 20 XP al asestar un golpe crítico.
- **Level Up Bonus**: +2% Probabilidad de Crítico por nivel.

### Speed
- **HP**: 60 | **Speed**: 2.5
- **Habilidad**: Probabilidad de acelerón (x1.1 velocidad). El daño escala con la velocidad.
- **XP Trigger**: Gana 5 XP si golpea al enemigo durante un acelerón.
- **Level Up Bonus**: +5% Velocidad Base por nivel.

### Spinner
- **HP**: 100 | **Speed**: 1.5
- **Habilidad**: Daño acumulativo por combo. Se reinicia al chocar con paredes.
- **XP Trigger**: Gana 10 XP por cada golpe consecutivo (Combo > 0).
- **Level Up Bonus**: +10% Multiplicador de daño de combo por nivel.

### Tank
- **HP**: 220 | **Speed**: 0.5
- **Habilidad**: Escudo de invulnerabilidad temporal.
- **XP Trigger**: Gana 30 XP al bloquear daño mientras es invulnerable.
- **Level Up Bonus**: +10 frames de duración del escudo por nivel.

### Spike
- **HP**: 150 | **Speed**: 0.8
- **Habilidad**: Refleja daño al atacante.
- **XP Trigger**: Gana 10 XP plana al reflejar daño.
- **Level Up Bonus**: +2 Daño reflejado por nivel.

### Ninja
- **HP**: 70 | **Speed**: 1.8
- **Habilidad**: Esquiva ataques (Miss).
- **XP Trigger**: Gana 25 XP al esquivar un ataque.
- **Level Up Bonus**: +2% Probabilidad de Esquiva por nivel.

---

## Clases de Gladiadores (Fila 2)

### Prism
- **HP**: 90 | **Speed**: 1.0
- **Habilidad**: Teletransporte aleatorio (Refracción). Bonus de daño x1.2.
- **XP Trigger**: Gana 15 XP al teletransportarse.
- **Level Up Bonus**: +1 Rango de teletransporte por nivel.

### Orb
- **HP**: 140 | **Speed**: 0.7
- **Habilidad**: Gravedad (atrae enemigos). Repulsa enemigos al recibir daño.
- **XP Trigger**: Gana 5 XP por frame mientras atrae a un enemigo cercano.
- **Level Up Bonus**: +10% Fuerza de gravedad por nivel.

### Cube
- **HP**: 200 | **Speed**: 0.4
- **Habilidad**: Empuje fuerte (Knockback). Alta fricción.
- **XP Trigger**: Gana 20 XP al colisionar y empujar a un enemigo.
- **Level Up Bonus**: +0.2 Fuerza de empuje por nivel.

### Star
- **HP**: 110 | **Speed**: 1.3
- **Habilidad**: Acumula energía, ráfaga de velocidad al llegar a 100. Daño x1.5 con >50 energía.
- **XP Trigger**: Gana 50 XP al descargar su energía.
- **Level Up Bonus**: +10% Velocidad de carga de energía por nivel.

### Hex
- **HP**: 120 | **Speed**: 0.9
- **Habilidad**: Regeneración pasiva y 20% reducción de daño. Comportamiento defensivo (huye si hay enemigos cerca).
- **XP Trigger**: Gana 10 XP cada vez que regenera vida.
- **Level Up Bonus**: +0.6 HP regenerado por tick por nivel.

### Pyramid
- **HP**: 160 | **Speed**: 0.3
- **Habilidad**: Modo Torreta cerca de enemigos (inmóvil + 40% reducción daño). 
- **XP Trigger**: Gana 2 XP por frame en modo torreta cerca de enemigos.
- **Level Up Bonus**: +5% Reducción de daño en modo torreta por nivel.

---

## Nuevas Clases de Gladiadores (Fila 3)

### Bomber
- **HP**: 100 | **Speed**: 1.0
- **Habilidad**: Suelta una bomba al recibir daño y huye en dirección opuesta. Las bombas explotan tras 1 segundo dañando el área.
- **XP Trigger**: Gana 15 XP por cada bomba que golpea.
- **Level Up Bonus**: +5 Daño de bomba por nivel.

### Summoner
- **HP**: 90 | **Speed**: 0.9
- **Habilidad**: Al golpear, tiene 30% de probabilidad de invocar un "Pet" que ataca con 25% del daño. Max 2 pets.
- **XP Trigger**: Gana 20 XP al invocar un pet.
- **Level Up Bonus**: +5% Probabilidad de invocación por nivel.

### Lancer
- **HP**: 80 | **Speed**: 1.4
- **Habilidad**: Carga y atraviesa enemigos causando knockback. 3 segundos de cooldown durante los cuales huye.
- **XP Trigger**: Gana 25 XP al atravesar un enemigo.
- **Level Up Bonus**: -0.2s Cooldown por nivel.

### Berserker
- **HP**: 150 | **Speed**: 1.1
- **Habilidad**: Gana hasta +100% daño bonus cuando su vida está baja (lineal desde 100% HP a 0% HP).
- **XP Trigger**: Gana 15 XP al golpear con <50% HP.
- **Level Up Bonus**: +10% Daño máximo en bajo HP por nivel.

### Archer
- **HP**: 70 | **Speed**: 1.0
- **Habilidad**: Dispara proyectiles a distancia (>80px). Si un enemigo se acerca (<40px), huye. Cooldown de 1s en disparos.
- **XP Trigger**: Gana 10 XP por disparo que impacta.
- **Level Up Bonus**: +5 Daño de proyectil por nivel.

### Poison
- **HP**: 85 | **Speed**: 0.8
- **Habilidad**: Los golpes aplican "Veneno" acumulable (DoT). Tras aplicar veneno, se retira a la esquina más lejana.
- **XP Trigger**: Gana 5 XP por cada tick de daño de veneno.
- **Level Up Bonus**: +1 Daño de veneno por tick por nivel.

### Illusion
- **HP**: 90 | **Speed**: 1.2
- **Habilidad**: Al bajar de 30% HP, crea un clon inmóvil que "tauntea" al enemigo durante 3 segundos mientras se regenera.
- **XP Trigger**: Gana 30 XP al crear un clon.
- **Level Up Bonus**: +0.5s Duración del clon por nivel.
