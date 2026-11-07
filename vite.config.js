import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './', // Use relative paths for Electron compatibility
    test: {
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{js,jsx}', 'scripts/**/*.mjs'],
            exclude: ['**/*.test.*', 'src/main.jsx'],
            reporter: ['text', 'html', 'lcov', 'json-summary'],
            thresholds: {
                lines: 16,
                statements: 16,
                functions: 19,
                branches: 11,
                'src/utils/achievementUtils.js': { lines: 100, statements: 100, functions: 100, branches: 100 },
                'src/constants/achievements.js': { lines: 100, functions: 100 },
                'src/utils/gameUtils.js': { lines: 80, statements: 80, functions: 80, branches: 70 },
            },
        },
    },
});
