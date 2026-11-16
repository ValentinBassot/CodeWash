const entry = (name, src) => ({ name, src });

const pokemon = (names) => names.map((name) => entry(name, `assets/mobs/pokemon/${name.toLowerCase()}.png`));

export const THEME_ROSTERS = {
    pokemon: {
        hostile: pokemon([
            'Pikachu',
            'Charmander',
            'Squirtle',
            'Bulbasaur',
            'Gengar',
            'Eevee',
            'Jigglypuff',
            'Meowth',
            'Psyduck',
            'Snorlax',
            'Machop',
            'Geodude',
            'Zubat',
            'Magikarp',
            'Gastly',
            'Onix',
            'Vulpix',
            'Growlithe',
            'Abra',
            'Oddish',
        ]),
        miniboss: pokemon(['Arcanine', 'Alakazam', 'Machamp', 'Gyarados']),
        boss: pokemon(['Mewtwo', 'Charizard', 'Dragonite', 'Lugia']),
    },
};
