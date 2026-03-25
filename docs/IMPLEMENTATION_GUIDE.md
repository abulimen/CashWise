# CashWise V2 — Implementation Guide & Progress

> For AI agents and collaborators. Last updated: Phase 1 in progress.

## Project Overview

**What**: AI financial assistant for Nigerian students that bridges the trust gap by making every recommendation explainable and verifiable.
**Stack**: Next.js 16 (App Router), TypeScript, vanilla CSS, Gemini 2.0 Flash Lite, Mono Open Banking API
**Repo**: `/home/x/Projects/CashWise V2/`

## Architecture

```
src/
├── app/
│   ├── globals.css         # Design system (CSS variables, base styles)
│   ├── layout.tsx          # Root layout (fonts, meta, theme wrapper)
│   ├── page.tsx            # Main page (2-panel: dashboard + chat)
│   └── api/
│       ├── chat/route.ts   # POST: user msg → Gemini → structured response
│       ├── financial-data/route.ts  # GET: mock or Mono financial snapshot
│       └── mono/callback/route.ts   # POST: Mono auth token exchange
├── components/
│   ├── ChatInterface.tsx       # Chat UI with message bubbles + structured responses
│   ├── FinancialDashboard.tsx  # Balance, daily budget, savings progress
│   ├── TrustScore.tsx          # Animated 0-100 gauge with factor breakdown
│   ├── AutoStash.tsx           # Savings nudge with accept/adjust/decline
│   └── RecommendationCard.tsx  # Structured AI response within chat
└── lib/
    ├── types.ts            # All TypeScript interfaces
    ├── mockData.ts         # Realistic Nigerian student financial data
    ├── decisionEngine.ts   # "Can I afford this?" logic + reasoning steps
    ├── trustScore.ts       # Rule-based score with per-factor breakdown
    ├── geminiClient.ts     # Gemini API with key rotation (7 keys)
    └── monoClient.ts       # Mono API wrapper (balance, transactions)
```

## Key Technical Decisions

| Decision | Choice | Why |
|---|---|---|
| Data mode | Mock-first, Mono toggle via `NEXT_PUBLIC_USE_MOCK_DATA` | Demo always works; real data optional |
| AI approach | Gemini with structured JSON output + local decision engine fallback | Gemini for natural language; decision engine ensures reasoning is always structured |
| Key rotation | Round-robin across 7 Gemini keys | Avoid rate limits |
| Styling | Vanilla CSS + CSS variables | Per user preference; full design control |
| Reasoning display | Inline in AI response (not a separate panel) | Reasoning IS the response, not an afterthought |

## Environment Variables (.env.local)

```
MONO_SECRET_KEY=test_sk_vxylujou6fumq9uv0tbd
MONO_PUBLIC_KEY=test_pk_dqrp5ipuv38tahwv45fw
GEMINI_API_KEYS=<comma-separated list of 7 Gemini API keys>
NEXT_PUBLIC_USE_MOCK_DATA=true
```

## Build Phases & Status

### Phase 1: Foundation ← CURRENT
- [x] Next.js 16 project initialized (TypeScript, App Router, src dir)
- [x] Implementation guide created
- [ ] `.env.local` created
- [ ] `src/lib/types.ts` — all shared interfaces
- [ ] `src/lib/mockData.ts` — mock financial data
- [ ] `src/app/globals.css` — full design system
- [ ] `src/app/layout.tsx` — root layout with fonts + meta
- [ ] `src/app/page.tsx` — two-panel layout
- [ ] `src/components/FinancialDashboard.tsx`
- [ ] `src/components/ChatInterface.tsx` (shell, no API yet)

### Phase 2: Trust Engine
- [ ] `src/lib/decisionEngine.ts` — affordability logic + reasoning chain
- [ ] `src/lib/geminiClient.ts` — API client with key rotation
- [ ] `src/app/api/chat/route.ts` — chat endpoint
- [ ] `src/app/api/financial-data/route.ts` — data endpoint
- [ ] `src/components/RecommendationCard.tsx` — structured response card
- [ ] Wire chat UI to API

### Phase 3: Polish
- [ ] `src/lib/trustScore.ts` — scoring logic
- [ ] `src/components/TrustScore.tsx` — animated gauge
- [ ] `src/components/AutoStash.tsx` — savings nudge
- [ ] `src/lib/monoClient.ts` — Mono API wrapper
- [ ] `src/app/api/mono/callback/route.ts` — Mono callback
- [ ] Animations, mobile responsiveness, demo polish

## How to Continue This Build

1. Check this file for current phase status
2. Read `src/lib/types.ts` to understand the data model
3. All components are client components (`'use client'`)
4. API routes are in `src/app/api/` (App Router conventions)
5. Run `npm run dev` to start dev server on port 3000
6. Mock data toggle: set `NEXT_PUBLIC_USE_MOCK_DATA=false` to use Mono
