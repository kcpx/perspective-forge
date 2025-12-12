# Perspective Forge

See your thinking from every angle. A thinking tool that helps you analyze decisions, beliefs, and ideas through multiple perspectives.

![Perspective Forge](https://img.shields.io/badge/MVP-Steelman-gold)

## Current State: MVP (Section 1)

This MVP includes the **Steelman** perspective — the strongest, most charitable version of your thinking.

### Roadmap

- [x] **Section 1: Steelman** — Your position at its best
- [ ] **Section 2: The Trifecta** — Optimist, Pragmatist, Pessimist
- [ ] **Section 3: Blind Spots** — What everyone missed
- [ ] **Section 4: Debate Mode** — Challenge any perspective

## Architecture

```
perspective-forge/
├── app/
│   ├── api/perspectives/     # Streaming API route (handles ALL perspectives)
│   │   └── route.ts
│   ├── globals.css           # Global styles + perspective colors
│   ├── layout.tsx
│   └── page.tsx              # Main UI
├── components/
│   └── PerspectiveCard.tsx   # Reusable card (works for any perspective)
├── lib/
│   └── prompts.ts            # Centralized prompts (add new perspectives here)
├── types/
│   └── index.ts              # Type definitions + perspective registry
└── tailwind.config.ts        # Theme with spectrum colors
```

### Key Design Decisions

1. **Single API route** — One endpoint handles all perspectives via the `perspective` param
2. **Centralized prompts** — All prompts in `lib/prompts.ts` for easy iteration
3. **Perspective registry** — `types/index.ts` defines all perspectives in one place
4. **Streaming** — Real-time text streaming for polish
5. **Color system** — Each perspective has its own color scheme in Tailwind config

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Adding a New Perspective

1. **Add type** in `types/index.ts`:
   ```typescript
   export type PerspectiveType = "steelman" | "optimist" | "YOUR_NEW_ONE";
   ```

2. **Add config** in `types/index.ts`:
   ```typescript
   export const PERSPECTIVES = {
     // ...existing
     yourNewOne: {
       id: "yourNewOne",
       name: "The New Perspective",
       icon: "🎯",
       description: "What this perspective does",
       colorClass: "yourNewOne",
     },
   };
   ```

3. **Add prompt** in `lib/prompts.ts`:
   ```typescript
   export const PERSPECTIVE_PROMPTS = {
     // ...existing
     yourNewOne: `${BASE_SYSTEM}\n\nYour perspective: THE NEW ONE\n\nYour job is to...`,
   };
   ```

4. **Add colors** in `tailwind.config.ts` and `globals.css`

5. **Use in page** — Call `fetchPerspective("yourNewOne", setYourContent)`

## Deployment

### Vercel (Recommended)

```bash
npm i -g vercel
vercel
```

Set `ANTHROPIC_API_KEY` in Vercel dashboard → Settings → Environment Variables.

## Tech Stack

- **Next.js 14** (App Router)
- **Tailwind CSS** (Custom theme)
- **Framer Motion** (Animations)
- **Anthropic SDK** (Claude API with streaming)

## License

MIT
