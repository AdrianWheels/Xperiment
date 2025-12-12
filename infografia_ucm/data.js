const heroes = [
    {
        id: 1,
        label: "Iron Tech",
        group: "avenger",
        image: "assets/hero_tech_icon.png", // Manually add this or run setup
        description: "Genio, millonario, playboy, filántropo. Pionero en tecnología de armaduras.",
        power: 85,
        intelligence: 100
    },
    {
        id: 2,
        label: "Captain Shield",
        group: "avenger",
        image: "assets/hero_shield.svg",
        description: "El primer super soldado. Líder táctico y símbolo de esperanza.",
        power: 90,
        intelligence: 75
    },
    {
        id: 3,
        label: "God of Thunder",
        group: "god",
        image: "assets/hero_thunder.png",
        description: "Príncipe de Asgard. Controla el rayo y posee una fuerza inmensa.",
        power: 100,
        intelligence: 60
    },
    {
        id: 4,
        label: "Spider Kid",
        group: "defender",
        image: "assets/hero_spider_icon.png", // Manually add this
        description: "Tu vecino amistoso. Agilidad sobrehumana y sentido arácnido.",
        power: 70,
        intelligence: 95
    },
    {
        id: 5,
        label: "Director S.",
        group: "shield",
        image: "assets/hero_nick.svg",
        shape: "circularImage",
        description: "Espía supremo. El hombre que lo ve todo.",
        power: 40,
        intelligence: 98
    }
];

const connections = [
    { from: 1, to: 2, label: "Rivalidad" },
    { from: 1, to: 4, label: "Mentor" },
    { from: 2, to: 3, label: "Compañeros" },
    { from: 5, to: 1, label: "Reclutador" },
    { from: 5, to: 2, label: "Jefe" }
];
