import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'

const jsxA11yRecommendedWarnings = Object.fromEntries(
  Object.keys(jsxA11y.configs.recommended.rules).map((ruleName) => [ruleName, 'warn']),
)

export default [
  { ignores: ['dist', 'tests/', 'test-results/', 'playwright-report/', '.npm-cache/', '.corepack/', '.superpowers/', '.wrangler/', '.tmp/'] },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      react,
      'jsx-a11y': jsxA11y,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...jsxA11yRecommendedWarnings,
      ...reactHooks.configs.recommended.rules,
      ...reactRefresh.configs.vite.rules,
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'react/prop-types': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'react/no-unstable-nested-components': 'warn',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.serviceworker,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
  },
]
