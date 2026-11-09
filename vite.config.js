import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    base: './', // Use relative paths for Electron compatibility
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/test/setup.js'],
        testTimeout: 20000,
        maxWorkers: 4,
        coverage: {
            provider: 'v8',
            include: ['src/**/*.{js,jsx}', 'scripts/**/*.mjs'],
            exclude: ['**/*.test.*', 'src/main.jsx'],
            reporter: ['text', 'html', 'lcov', 'json-summary'],
            thresholds: {
                lines: 83,
                statements: 83,
                functions: 75,
                branches: 77,
                'src/utils/achievementUtils.js': { lines: 100, statements: 100, functions: 100, branches: 100 },
                'src/constants/achievements.js': { lines: 100, functions: 100 },
                'src/utils/gameUtils.js': { lines: 80, statements: 80, functions: 80, branches: 70 },
                'src/utils/soundManager.js': { lines: 100, statements: 100, functions: 80, branches: 95 },
                'src/constants/gameData.jsx': { lines: 100, statements: 100, functions: 100, branches: 100 },
                'src/utils/mobDisplayUtils.js': { lines: 100, statements: 100, functions: 100 },
            },
        },
    },
});
