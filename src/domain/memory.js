import { random } from './random';

const shuffle = (items) => [...items].sort(() => random() - 0.5);

export const dealMemoryCards = (faces, pairs) => {
    const chosen = shuffle(Object.keys(faces)).slice(0, pairs);
    return shuffle([...chosen, ...chosen]).map((face, id) => ({ id, color: face, img: faces[face] }));
};
