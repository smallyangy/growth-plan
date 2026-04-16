# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

"果果成长计划" — a children's educational app built with Vue 3 + UniApp + TypeScript, targeting H5 (primary) and mini-programs. Deployed to GitHub Pages at `/growth-plan/`.

Node version: 18 (see `.nvmrc`)

## Commands

```bash
# Development
npm run dev          # H5 dev server on port 8092
npm run dev:mp-weixin  # WeChat mini-program dev

# Build
npm run build:prod   # Production build → dist/
npm run build:stage  # Staging build → dist/

# Type check
npm run type-check   # vue-tsc --noEmit

# Lint
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run lint:style   # Stylelint
npm run lint:style:fix  # Stylelint with auto-fix

# Deploy (manual)
sh deploy.sh         # Build + push dist/ to gh-pages branch
```

CI/CD: pushing to `main` triggers GitHub Actions to build and deploy to `gh-pages` automatically.

## Architecture

### UniApp Multi-platform

This is a UniApp project — components and APIs must be UniApp-compatible, not plain Vue. Use `uni.*` APIs instead of browser APIs where possible. Pages are registered in `src/pages.json` (not via Vue Router). The H5 router uses hash mode with base `/growth-plan/`.

### Token Passing

The app receives an auth token via URL query param (`?token=...`) on startup. `src/main.ts` reads it and stores it in Pinia via `useApp().set_token()`. There is no login flow — the token is injected by the parent context.

### State Management

Single Pinia store at `src/store/useApp.ts` — currently only holds `token`. Extend this store for global state.

### Pages

| Path | Title |
|------|-------|
| `pages/index/index` | 首页 (home, app entry) |
| `pages/word/index` | 文字学习 (character learning) |
| `pages/game/linggu` | 领鼓游戏 (game) |
| `pages/math/base` | 基础运算 (math) |

### Key Dependencies

- `hanzi-writer` — Chinese character stroke animation
- `@icon-park/vue-next` — icon library (ByteDance IconPark)
- `vant` — UI component library (imported globally in `main.ts`)
- `vconsole` — mobile debug console, enabled when `VITE_APP_SHOW_CONSOLE=1`
- `mockjs` — mock data

### Styling

- SCSS with `rpx` units (UniApp responsive unit)
- Global styles in `src/uni.scss`
- Prettier: 4-space indent, single quotes, trailing commas, `printWidth: 100`
- Stylelint enforces `rpx` as an allowed unit

### Environment Variables

All envs currently set `VITE_APP_SHOW_CONSOLE=1` (vconsole enabled). Add new env vars with `VITE_APP_` prefix to expose them via `import.meta.env`.

### Path Alias

`@/` maps to `src/`.
