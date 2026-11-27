export const attempt = (operation, fallback = null) => {
    try {
        return operation();
    } catch {
        return fallback;
    }
};
