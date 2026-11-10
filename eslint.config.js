import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
    globalIgnores(['dist', 'release', 'electron', 'coverage']),
    {
        files: ['**/*.{js,jsx}'],
        extends: [js.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                ecmaVersion: 'latest',
                ecmaFeatures: { jsx: true },
                sourceType: 'module',
            },
        },
        rules: {
            'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
        },
    },
    {
        files: ['src/**/*.{js,jsx}'],
        ignores: ['src/domain/random.js', 'src/domain/clock.js', '**/*.test.*', 'src/test/**'],
        rules: {
            'no-restricted-properties': [
                'error',
                { object: 'Math', property: 'random', message: 'Use random() from src/domain/random.js.' },
                { object: 'Date', property: 'now', message: 'Use now() from src/domain/clock.js.' },
            ],
            'no-restricted-syntax': [
                'error',
                {
                    selector: "NewExpression[callee.name='Date'][arguments.length=0]",
                    message: 'Use now() or todayKey() from src/domain/clock.js.',
                },
            ],
        },
    },
    {
        files: ['scripts/**/*.mjs'],
        extends: [js.configs.recommended],
        languageOptions: { ecmaVersion: 'latest', globals: globals.node },
    },
]);
