---
name: memanto-integration
description: >
  Integración de Memanto (memoria persistente) con el workspace mpoints-tracker.
  Referencia rápida para usar memanto desde la terminal local para recordar,
  recuperar y responder sobre este proyecto. Útil cuando el contexto se resetea
  o cuando se necesita persistir preferencias, decisiones y aprendizajes del
  proyecto. Usar cuando se dice "memanto", "memoria", "remember this", "recall",
  "buscar memoria", o cuando se necesita recuperar contexto de sesiones previas.
---

# Memanto Integration

Memanto está instalado localmente en la máquina del usuario (no en el entorno de Kimi Work). Este skill documenta cómo usarlo desde la terminal local para persistir memoria de este proyecto.

## Estado

- **Instalación**: `pip install memanto` (ya hecho en el sistema local)
- **Backend**: On-Prem (Docker + Ollama) o Cloud (API key de Moorcheh)
- **Servidor**: `memanto serve` → http://localhost:8000
- **UI**: `memanto ui` → abre navegador con interfaz web

## Verificar que funciona

```bash
memanto status
```

Debe mostrar: agente activo, sesión, configuración, y estado del servidor.

## Comandos principales

### Guardar memoria

```bash
memanto remember "Dylan prefiere que los componentes de UI sean accessibles desde el inicio, no como afterthought" --type preference

memanto remember "El proyecto usa React 18 + Vite + Firebase + i18n (6 idiomas)" --type fact

memanto remember "Decidimos mantener el componente ScoreBoard como un archivo plano sin abstraer aún, solo un solo juego lo usa" --type decision
```

### Recuperar memoria

```bash
memanto recall "preferencias del usuario"
memanto recall "decisiones arquitectura" --type decision
memanto recall "firebase" --type fact
```

### Preguntar con contexto (RAG)

```bash
memanto answer "¿Qué tecnologías usa este proyecto?"
memanto answer "¿Qué decisiones tomamos sobre el UI?"
```

## Tipos de memoria útiles para este proyecto

| Tipo | Cuándo usar |
|------|-------------|
| `preference` | Preferencias de estilo, naming, tecnología, prioridades |
| `decision` | Decisiones arquitectónicas, qué library usar, qué NO usar |
| `fact` | Stack tecnológico, estructura de carpetas, datos clave |
| `goal` | Objetivos del proyecto, milestones, roadmap |
| `learning` | Lecciones aprendidas, bugs recurrentes, soluciones |
| `error` | Errores comunes y sus fixes |
| `instruction` | Guías de estilo, pasos de build, flujos de trabajo |
| `commitment` | Tareas pendientes, promesas, TODOs con contexto |
| `context` | Estado actual del proyecto, contexto de sesión |
| `event` | Deploys, releases, cambios importantes |
| `observation` | Patrones notados, comportamientos del código |
| `artifact` | Links a docs, designs, assets importantes |
| `relationship` | Relaciones entre módulos, dependencias |

## Flujo de trabajo recomendado

### 1. Al inicio de cada sesión de trabajo

```bash
memanto answer "¿Cuál es el estado actual de mpoints-tracker?"
memanto recall "tareas pendientes" --type commitment
```

### 2. Al tomar decisiones importantes

```bash
memanto remember "Decidimos migrar X a Y porque..." --type decision
```

### 3. Al finalizar trabajo

```bash
memanto remember "Hoy terminé: [lista]. Próximo: [lista]." --type commitment
memanto daily-summary  # resumen automático del día
```

## Integración con Kimi Work

Dado que Kimi Work no tiene acceso al CLI de memanto, el flujo es:

1. **El usuario** ejecuta `memanto remember/recall` en su terminal local
2. **El usuario** copia el resultado relevante en la conversación de Kimi Work
3. **Kimi Work** usa ese contexto para continuar el trabajo

### Prompt de contexto para recuperar estado

```
memanto answer "Resumime el estado actual del proyecto mpoints-tracker: qué está hecho, qué falta, y qué decisiones importantes tomamos"
```

Copiar el resultado de ese comando al inicio de una nueva sesión con Kimi Work.

## Memoria del proyecto (seed)

Si memanto está vacío, seedear con estos datos base del proyecto:

```bash
memanto remember "Proyecto: mpoints-tracker. PWA en React/TypeScript para registrar partidas y estadísticas de juegos de mesa." --type fact
memanto remember "Stack: React 18, Vite, Firebase (Firestore + Auth), i18next (6 idiomas: es, en, pt, fr, de, it), Tailwind CSS, Vitest + Playwright." --type fact
memanto remember "Estructura: src/lib (utils), src/components (ui, games, auth), src/pages, src/data, src/hooks. Tests en tests/ y __tests__." --type fact
memanto remember "El usuario prefiere que el código sea accesible (a11y) desde el inicio, no como afterthought." --type preference
memanto remember "El usuario prefiere alternar español/inglés en contextos técnicos (React, TypeScript, i18n, a11y)." --type preference
memanto remember "Decisión: usar AGENTS.md para el workflow multi-agente en el proyecto." --type decision
memanto remember "Decisión: usar ponytail para evitar over-engineering." --type decision
```

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `memanto` no encontrado | `pip install memanto` o verificar PATH |
| Servidor no responde | `memanto serve` en otra terminal |
| Docker no arranca | `docker ps` para verificar, o `memanto config backend cloud` |
| Sin memoria guardada | Ejecutar los comandos de seed arriba |

## Links

- Docs: https://docs.memanto.ai
- API local: http://localhost:8000/docs (cuando `memanto serve` está corriendo)
- Repo: https://github.com/moorcheh-ai/memanto

## Boundaries

Este skill es documentación de integración, no ejecuta comandos de memanto directamente. El usuario debe ejecutar los comandos en su terminal local. No persistir archivos de memoria en el workspace; memanto maneja su propio storage.
