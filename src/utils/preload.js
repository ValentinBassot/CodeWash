import { readCurrentProfile, readProfileSave } from '../persistence/profileStorage';

export const CODE_WEIGHT = 40;
export const DATA_WEIGHT = 5;
export const ASSET_WEIGHT = 100 - CODE_WEIGHT - DATA_WEIGHT;
export const DEFAULT_THEME = 'minecraft';

export const IMAGE_TIMEOUT_MS = 8000;

export const loadImage = (src) =>
    new Promise((resolve) => {
        const finish = (loaded) => {
            clearTimeout(timer);
            resolve(loaded);
        };
        const timer = setTimeout(() => finish(false), IMAGE_TIMEOUT_MS);
        const image = new Image();
        image.onload = () => finish(true);
        image.onerror = () => finish(false);
        image.src = src;
    });

export const readSavedTheme = (storage) => {
    try {
        const raw = readProfileSave(storage, readCurrentProfile(storage));
        return JSON.parse(raw)?.theme || DEFAULT_THEME;
    } catch {
        return DEFAULT_THEME;
    }
};

const urlOf = (cssValue) => cssValue?.match(/url\(['"]?([^'")]+)['"]?\)/)?.[1];

export const criticalAssets = ({ themeConfig, skillData }, theme) => {
    const current = themeConfig[theme] || themeConfig[DEFAULT_THEME];
    const paths = [urlOf(current.style?.backgroundImage), current.assets?.logo, ...skillData.map((skill) => skill.img)];
    return [...new Set(paths.filter(Boolean))];
};

export const createProgress = (onProgress) => {
    let done = 0;
    let reported = 0;
    return (weight) => {
        done += weight;
        const percent = Math.min(100, Math.floor(done + 1e-6));
        if (percent > reported) {
            reported = percent;
            onProgress(percent);
        }
    };
};

export const loadGame = async ({ importApp, importData, storage, onProgress, loadAsset = loadImage }) => {
    const advance = createProgress(onProgress);
    const code = importApp().then((module) => {
        advance(CODE_WEIGHT);
        return module.default;
    });
    const assets = importData().then(async (data) => {
        advance(DATA_WEIGHT);
        const paths = criticalAssets(
            { themeConfig: data.THEME_CONFIG, skillData: data.SKILL_DATA },
            readSavedTheme(storage),
        );
        await Promise.all(paths.map((path) => loadAsset(path).then(() => advance(ASSET_WEIGHT / paths.length))));
    });
    const [App] = await Promise.all([code, assets]);
    return App;
};
