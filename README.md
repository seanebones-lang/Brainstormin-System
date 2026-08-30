# Idea Forge 🚀

**Open-source AI-powered idea generation** — Bring your own API key, generate ideas instantly. No login, no signup, no billing. Fully free.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![PWA](https://img.shields.io/badge/PWA-ready-purple)](https://web.dev/progressive-web-apps/)

---

## 🎯 What Is This?

**Idea Forge** is a local-first, open-source web app for generating ideas using any OpenAI-compatible API. You provide the API key; the app handles the rest. No accounts, no cloud, no tracking.

### Use Cases
- **Entrepreneurs** — brainstorm product ideas, validate concepts
- **Product Managers** — ideate features, competitive strategies  
- **Developers** — explore project ideas, architecture concepts
- **Creatives** — writing prompts, design concepts, project inspiration
- **Anyone** — stuck on a problem? Get 10 fresh perspectives in seconds

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **BYOK (Bring Your Own Key)** | Works with xAI, OpenAI, Anthropic, or any OpenAI-compatible endpoint |
| **18 Idea Templates** | Preset prompts across 6 categories (Startup, Marketing, Productivity, Creative, Tech, Social Impact) |
| **Local-First Storage** | Sessions & settings in your browser (localStorage) — export/import JSON anytime |
| **Dark/Light Mode** | System-aware theme with manual toggle |
| **PWA Support** | Install as an app, works offline (static assets cached) |
| **Streaming SSE** | Real-time idea generation with typewriter animation |
| **Zero Config Deploy** | Static export ready, runs anywhere |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 20
- pnpm (or npm)
- An API key from any OpenAI-compatible provider:
  - **xAI (Grok)**: [console.x.ai](https://console.x.ai)
  - **OpenAI**: [platform.openai.com](https://platform.openai.com)
  - **Anthropic**: [console.anthropic.com](https://console.anthropic.com) (via proxy)
  - **Local LLM**: Ollama, LM Studio, vLLM, etc.

### Install & Run
```bash
# Clone
git clone https://github.com/seanebones-lang/Brainstormin-System.git
cd Brainstormin-System

# Install
pnpm install

# Dev server
pnpm dev
```

Open **http://localhost:3000** → Click **Settings** (gear icon) → Enter your API key → Generate ideas.

---

## 🔧 Configuration

### Supported Providers
| Provider | Base URL | Default Model |
|----------|----------|---------------|
| xAI (Grok) | `https://api.x.ai/v1` | `grok-4-1-fast-reasoning` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o` |
| Anthropic | `https://api.anthropic.com/v1` | `claude-3-5-sonnet-20241022` |
| Custom | *your endpoint* | *your model* |

### Settings Page (`/settings`)
- **Provider** — dropdown with auto-filled base URL
- **Base URL** — editable for custom endpoints
- **API Key** — stored locally only, never leaves your browser
- **Model** — must match an available model for your provider
- **Reset to Defaults** — clears localStorage

---

## 📦 Project Structure

```
Idea-Forge/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/                # API Routes
│   │   │   ├── ideas/generate  # Streaming idea generation (SSE)
│   │   │   ├── sessions        # Local session CRUD
│   │   │   └── health          # Health check
│   │   ├── dashboard/          # Main UI (/dashboard)
│   │   ├── settings/           # Settings page (/settings)
│   │   └── page.tsx            # Redirects to /dashboard
│   ├── components/
│   │   ├── GenerateForm.tsx    # Form + template selector
│   │   ├── IdeaCard.tsx        # Animated idea display
│   │   ├── ExportImport.tsx    # JSON backup/restore
│   │   ├── TemplateSelector.tsx# 18 preset templates
│   │   ├── ThemeToggle.tsx     # Dark/light switch
│   │   └── SettingsPanel.tsx   # (legacy modal, unused)
│   ├── hooks/
│   │   ├── useSettings.ts      # localStorage settings
│   │   ├── useSSE.ts           # SSE with auto-reconnect
│   │   └── useTypewriter.ts    # Typewriter animation
│   ├── lib/
│   │   ├── ai.ts               # Provider-agnostic AI client
│   │   ├── sessionManager.ts   # localStorage sessions
│   │   ├── sanitize.ts         # DOMPurify XSS protection
│   │   ├── circuitBreaker.ts   # Resilience pattern
│   │   ├── retry.ts            # Exponential backoff
│   │   ├── rateLimit.ts        # Local rate limiting
│   │   ├── logger.ts           # Structured logging
│   │   └── env.ts              # Zod env validation
│   ├── types/index.ts          # Shared Zod schemas + types
│   └── __tests__/              # Vitest unit tests
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Service worker (auto-generated)
│   └── icons/                  # PWA icons
├── .github/workflows/ci.yml    # CI: lint, test, build, bundle-analyzer
├── next.config.mjs             # Next.js + PWA + bundle analyzer
├── vitest.config.ts            # Test config
└── package.json
```

---

## 🛠️ Available Scripts

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm start            # Run production server

# Code Quality
pnpm lint             # ESLint
pnpm type-check       # TypeScript (strict)
pnpm format           # Prettier
pnpm format:check     # Check formatting

# Testing
pnpm test             # Vitest unit tests
pnpm test:coverage    # With coverage report
pnpm test:e2e         # Playwright E2E (requires build first)

# Analysis
ANALYZE=true pnpm build  # Bundle analyzer report
```

---

## 🧪 Testing

- **Unit**: Vitest + React Testing Library (`src/__tests__/`)
- **E2E**: Playwright (`src/e2e/`)
- **Coverage targets**: 95% lines/functions/branches/statements

Run all checks locally:
```bash
pnpm type-check && pnpm lint && pnpm test && pnpm build
```

---

## 🚢 Deployment

### Vercel (Recommended)
```bash
# Push to GitHub, import in Vercel, deploy
# No environment variables required (user provides key in UI)
```

### Static Export (Any Static Host)
```bash
# next.config.mjs: add `output: 'export'`
pnpm build
# Deploy `out/` to Netlify, Cloudflare Pages, GitHub Pages, etc.
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

---

## 🔒 Privacy & Security

- **No tracking, no analytics, no cookies**
- **API key never leaves your browser** — sent directly to your chosen provider
- **All data in localStorage** — export/import JSON to move between devices
- **DOMPurify sanitization** — prevents XSS in all user inputs
- **Security headers** — CSP, HSTS, X-Frame-Options, etc.
- **Open source** — audit the code yourself

---

## 🤝 Contributing

Contributions welcome! 

1. Fork → feature branch → PR
2. Run checks: `pnpm type-check && pnpm lint && pnpm test && pnpm build`
3. Follow Conventional Commits
4. Keep it local-first, no backend dependencies

---

## 📄 License

MIT License — see [LICENSE](LICENSE)

---

## 🙏 Acknowledgments

- **xAI, OpenAI, Anthropic** — for open API standards
- **Next.js, React, TypeScript** — excellent frameworks
- **DOMPurify, Zod, Vitest, Playwright** — quality tooling
- **NextEleven** — original builder

---

**Built as a free tool for thinkers everywhere.** 🚀

*No account needed. No data collected. Just ideas.*