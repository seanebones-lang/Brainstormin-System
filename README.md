# Brainstormin-System

Next.js 14 MVP powered by xAI Grok-β for AI-driven idea brainstorming.

[![Vercel](https://theregister.s3.amazonaws.com/Prod_Images/2023/11/09/elevenlabs.png)](https://vercel.com/new/git/external?repository-url=https://github.com/seanebones-lang/Brainstormin-System)

## 🚀 Quickstart

1. **Clone & Install**
   ```bash
   git clone https://github.com/seanebones-lang/Brainstormin-System.git
   cd Brainstormin-System
   pnpm install
   ```

2. **Environment Setup**
   Copy `.env.example` to `.env.local` and add your keys:
   ```env
   XAI_API_KEY=your_xai_key_here  # https://console.x.ai
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   ```

3. **Development**
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000) → Dashboard for SSE-streamed ideas!

4. **Build & Deploy**
   ```bash
   pnpm build
   pnpm start
   ```

## ✨ Features
- **xAI Grok-β Integration**: Streaming idea generation (`/api/ideas/generate`).
- **Real-time UI**: Typewriter effect, append to list.
- **Supabase Sessions**: Auth & persistence.
- **TypeScript + Zod**: Full validation.
- **Tailwind + Vitest**: Styled, tested.

## 📁 Structure
```
src/
├── app/
│   ├── dashboard/page.tsx     # Main UI
│   └── api/ideas/generate/    # xAI endpoint
├── lib/
│   ├── xai.ts                # Core AI logic
│   └── xai.test.ts           # Tests
```

## 🧪 Testing
```bash
pnpm test  # Vitest
pnpm vitest --coverage
```

## 🔧 Scripts
- `dev`: Development server
- `build`: Production build
- `start`: Production server
- `lint`: ESLint
- `test`: Vitest

## 🤝 Contributing
1. Fork & PR
2. `pnpm install`
3. Add tests
4. `pnpm test && pnpm lint`

## 📄 License
MIT

**Built with 🩸-n-⚡️ by NextEleven**
