const entry = (name, src) => ({ name, src });

const slug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const pictures = (folder) => (names) => names.map((name) => entry(name, `assets/mobs/${folder}/${slug(name)}.png`));

const pokemon = pictures('pokemon');
const kpop = pictures('kpop');

export const THEME_ROSTERS = {
    kpop: {
        hostile: kpop(['Angry Fighter', 'Flame Hunter', 'Energy Boy', 'Kneeling Boy', 'Star Wand Boy']),
        miniboss: kpop(['Chibi Girl', 'Pink Mic', 'Pink Singer']),
        boss: kpop(['Purple Singer', 'Fiery Hunter']),
    },
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
