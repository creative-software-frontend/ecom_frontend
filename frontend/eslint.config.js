import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import tailwindCanonicalClasses from 'eslint-plugin-tailwind-canonical-classes';
import { defineConfig, globalIgnores } from 'eslint/config'
import { createRequire } from 'module';

var require = createRequire(import.meta.url);
var module = { exports: {} };

export default defineConfig([
  globalIgnores(['dist']),
  
  ...tailwindCanonicalClasses.configs['flat/recommended'],

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    rules: {
      'tailwind-canonical-classes/tailwind-canonical-classes': [
        'error',
        {
          cssPath: './src/index.css', 
        },
      ],
    },
  },
]);
