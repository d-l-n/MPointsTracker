import js from '@eslint/js'
import globals from 'globals'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'

const jsxA11yRecommendedWarnings = Object.fromEntries(
  Object.keys(jsxA11y.configs.recommended.rules).map((ruleName) => [ruleName, 'error']),
)

// Reglas compartidas entre JS y TS (react + a11y + refresh).
// Se reutilizan para no duplicar la configuración base en cada override.
const sharedRules = {
  ...js.configs.recommended.rules,
  ...react.configs.recommended.rules,
  ...react.configs['jsx-runtime'].rules,
  ...jsxA11yRecommendedWarnings,
  ...reactHooks.configs.recommended.rules,
  ...reactRefresh.configs.vite.rules,
  'jsx-a11y/anchor-is-valid': 'error',
  'jsx-a11y/click-events-have-key-events': 'error',
  // `autoFocus` (camelCase React) en modales es legítimo y recomendado por
  // WAI-ARIA para mover el foco al abrir. La regla `no-autofocus` está
  // pensada para el atributo HTML `autofocus` (carga de página), que sí es
  // perjudicial. Degradamos a warning para no bloquear el uso correcto.
  'jsx-a11y/no-autofocus': 'warn',
      // jsx-a11y no soporta bien `role={cond ? "button" : undefined}` en análisis
      // estático: dispara falsos positivos aunque el role + onKeyDown + tabIndex
      // estén correctamente presentes cuando el elemento es interactive.
      // Degradamos a warn; los safeguards reales (click-events-have-key-events,
      // control-has-associated-label) siguen en error.
  'jsx-a11y/no-static-element-interactions': 'warn',
  'jsx-a11y/no-noninteractive-element-interactions': 'warn',
  'jsx-a11y/no-noninteractive-tabindex': 'warn',
  // `label-has-for` está deprecada desde jsx-a11y 6.1; su reemplazo moderno es
  // `label-has-associated-control`, que ya viene activa en el preset
  // recommended. La dejamos apagada para evitar duplicados.
  'jsx-a11y/label-has-for': 'off',
  'react/prop-types': 'off',
  'react-hooks/set-state-in-effect': 'off',
  'react-refresh/only-export-components': [
    'warn',
    { allowConstantExport: true },
  ],
  'react/no-unstable-nested-components': 'warn',
}

const sharedLanguageOptions = {
  ecmaVersion: 2020,
  globals: {
    ...globals.browser,
    ...globals.node,
    ...globals.serviceworker,
  },
}

const sharedPlugins = {
  react,
  'jsx-a11y': jsxA11y,
  'react-hooks': reactHooks,
  'react-refresh': reactRefresh,
}

export default [
  { ignores: ['dist', 'tests/', 'test-results/', 'playwright-report/', '.npm-cache/', '.corepack/', '.superpowers/', '.wrangler/', '.tmp/'] },
  // ── JavaScript / JSX ────────────────────────────────────────────────────
  {
    files: ['**/*.{js,jsx}'],
    plugins: sharedPlugins,
    settings: { react: { version: 'detect' } },
    rules: {
      ...sharedRules,
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
    },
    languageOptions: {
      ...sharedLanguageOptions,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
  },
  // ── TypeScript / TSX ────────────────────────────────────────────────────
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      ...sharedPlugins,
      '@typescript-eslint': tseslint,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...sharedRules,
      ...tseslint.configs.recommended.rules,
      // TS ofrece no-unused-vars con información de tipos; apagamos el de JS para
      // evitar reportes duplicados y usar el tipo específico.
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]', argsIgnorePattern: '^_' }],
      // En TS, `no-undef` genera falsos positivos: el parser no expone tipos
      // (React, RequestInit, AddEventListenerOptions) ni parámetros como globales
      // JS. TypeScript ya verifica referencias indefinidas vía su sistema de
      // tipos, así que desactivamos la regla JS para archivos TS.
      'no-undef': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
    languageOptions: {
      ...sharedLanguageOptions,
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
  },
  // ── Override: archivos en migración de tipado ─────────────────────────────
  // BlackjackCPU.tsx usa @ts-nocheck (873L, refactor de tipado pendiente).
  {
    files: ['**/BlackjackCPU.tsx'],
    rules: {
      '@typescript-eslint/ban-ts-comment': 'warn',
    },
  },
]
