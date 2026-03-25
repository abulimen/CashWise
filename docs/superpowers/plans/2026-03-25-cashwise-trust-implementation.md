# CashWise Trust Upgrade Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade CashWise into a trust-first fintech prototype with verifiable AI outputs, privacy-safe data handling, user override controls, and audit accountability while preserving core MVP flows.

**Architecture:** Keep the current Next.js App Router structure and incrementally add trust layers: typed trust contracts, secure Supabase-backed storage, two-stage advisor+judge pipeline, and visible trust UX (confidence, citations, provenance, audit trail). Prioritize minimal invasive changes by extending current APIs/components instead of replacing existing modules.

**Tech Stack:** Next.js 16 App Router, TypeScript, React 19, Supabase (Postgres + RLS + Edge Functions), Gemini API, vanilla CSS design system.

---

## File Structure Map

### New files
- `supabase/migrations/20260325_trust_foundation.sql`
  - Creates `ai_feedback`, `ai_audit_logs`, `financial_summary_cache` with RLS policies.
- `supabase/functions/secure-financial-merge/index.ts`
  - Decrypt -> merge Mono delta -> re-encrypt summary in one request lifecycle.
- `src/lib/trust/encryption.ts`
  - AES-GCM helper wrappers for edge/server contexts.
- `src/lib/trust/prompts.ts`
  - Main advisor prompt + judge prompt builders.
- `src/lib/trust/pipeline.ts`
  - Two-stage model orchestration and normalization.
- `src/lib/trust/citations.ts`
  - Citation formatting + confidence color mapping utilities.
- `src/lib/supabaseServer.ts`
  - Server-side Supabase client creator.
- `src/components/ConfidenceBadge.tsx`
  - Color-coded confidence badge.
- `src/components/WhyThisResponse.tsx`
  - Expandable XAI accordion.
- `src/components/DisagreeModal.tsx`
  - Override input chips + free-text modal.
- `src/components/AIAuditTrail.tsx`
  - Audit trail table panel/screen.
- `src/components/ConsentModal.tsx`
  - First-link Mono read-only consent modal.
- `src/components/GlobalDisclaimer.tsx`
  - Shared legal disclaimer footer.
- `src/app/api/feedback/route.ts`
  - Persist `ai_feedback` entries.
- `src/app/api/auto-stash/decision/route.ts`
  - Accept/override audit logging for Auto-Stash.
- `src/app/api/financial-data/refresh/route.ts`
  - Manual refresh trigger endpoint.
- `src/app/api/financial-data/forget/route.ts`
  - Forget-me purge endpoint.

### Modified files
- `src/lib/types.ts`
  - Extend chat/feedback/audit/trust payload types.
- `src/app/api/chat/route.ts`
  - Integrate retrieval, two-stage pipeline, confidence/citations/xai, and audit write.
- `src/lib/geminiClient.ts`
  - Add config override support (`temperature`, `top_p`) and stricter JSON mode handling.
- `src/lib/trustScore.ts`
  - Rename output semantics to Financial Behaviour Score and fairness guardrail for family/cultural spend.
- `src/components/TrustScore.tsx`
  - Rename labels and fairness-safe explanations.
- `src/components/RecommendationCard.tsx`
  - Add confidence badge, citations, accept/disagree controls, and why accordion.
- `src/components/ChatInterface.tsx`
  - Add query data-usage footer text and action callbacks.
- `src/components/AutoStash.tsx`
  - Add provenance block + accept/disagree hooks.
- `src/components/FinancialDashboard.tsx`
  - Add header controls entry point (refresh + settings).
- `src/app/page.tsx`
  - Wire modals, audit trail tab, over-reliance nudges, settings toggle, refresh/forget flows.
- `src/app/layout.tsx`
  - Ensure global disclaimer placement support.
- `src/app/globals.css`
  - Add trust signal styles (badges, accordions, audit table, modals, disclaimers).
- `docs/IMPLEMENTATION_GUIDE.md`
  - Update architecture + setup notes for Supabase and trust flows.

### Optional test files (if adding test harness)
- `src/lib/trust/citations.test.ts`
- `src/lib/trustScore.test.ts`
- `src/lib/trust/pipeline.test.ts`
- `src/app/api/chat/route.test.ts`

---

## Chunk 1: Foundation and Data Contracts

### Task 1: Extend trust-aware shared types

**Files:**
- Modify: `src/lib/types.ts`

- [ ] **Step 1: Write failing type-level usage checks in a temporary compile target**
Create temporary examples in `src/lib/types.ts` comments or `src/lib/types.examples.ts` (if preferred) that reference new fields (`confidenceScore`, `citations`, `xai`, feedback payload).

- [ ] **Step 2: Run compile to confirm missing fields fail**
Run: `npm run build`
Expected: Type errors for missing trust fields.

- [ ] **Step 3: Implement minimal type additions**
Add interfaces/types:
- `CitationRecord`
- `XAIExplanation`
- `ConfidenceBand`
- `AIMessageMeta`
- `AIFeedbackPayload`
- `AuditLogRecord`

- [ ] **Step 4: Re-run compile**
Run: `npm run build`
Expected: compile passes for this change.

- [ ] **Step 5: Commit**
Run:
```bash
git add src/lib/types.ts
git commit -m "feat(types): add trust metadata, feedback, and audit contracts"
```

### Task 2: Add Supabase trust schema + RLS migration

**Files:**
- Create: `supabase/migrations/20260325_trust_foundation.sql`

- [ ] **Step 1: Write migration with table DDL only (no policies yet)**
Create tables and constraints for `ai_feedback`, `ai_audit_logs`, `financial_summary_cache`.

- [ ] **Step 2: Validate SQL syntax locally**
Run: `npx supabase db lint` (if CLI installed) or `psql -f` in a local check setup.
Expected: no SQL syntax errors.

- [ ] **Step 3: Add RLS enablement + policies**
Add row ownership policy: `auth.uid() = user_id` for all CRUD.

- [ ] **Step 4: Re-validate migration**
Run same lint command.
Expected: pass.

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/20260325_trust_foundation.sql
git commit -m "feat(db): add trust tables with row-level security"
```

### Task 3: Add server Supabase client utility

**Files:**
- Create: `src/lib/supabaseServer.ts`

- [ ] **Step 1: Write failing import usage in one API route**
Reference `createServerSupabaseClient()` in `src/app/api/chat/route.ts` (temporary).

- [ ] **Step 2: Run build to confirm missing module failure**
Run: `npm run build`
Expected: module not found.

- [ ] **Step 3: Implement server client factory**
Use env vars and error guardrails for missing config.

- [ ] **Step 4: Run build**
Expected: compile success.

- [ ] **Step 5: Commit**
```bash
git add src/lib/supabaseServer.ts src/app/api/chat/route.ts
git commit -m "chore(infra): add server supabase client factory"
```

---

## Chunk 2: Privacy, Security, and Data Control

### Task 4: Build encryption helper and edge merge function

**Files:**
- Create: `src/lib/trust/encryption.ts`
- Create: `supabase/functions/secure-financial-merge/index.ts`

- [ ] **Step 1: Write tests or executable checks for encrypt/decrypt roundtrip**
If test harness exists, add unit test; otherwise add a local script check path.

- [ ] **Step 2: Run check and confirm failure**
Expected: helper not implemented.

- [ ] **Step 3: Implement AES-GCM utility**
Include key derivation from `user_id + server_salt` and strict input validation.

- [ ] **Step 4: Implement edge function secure merge flow**
Steps: decrypt cached summary, merge delta, re-encrypt, clear plaintext references.

- [ ] **Step 5: Re-run checks**
Expected: encrypt/decrypt roundtrip success.

- [ ] **Step 6: Commit**
```bash
git add src/lib/trust/encryption.ts supabase/functions/secure-financial-merge/index.ts
git commit -m "feat(security): add encrypted financial summary merge flow"
```

### Task 5: Add consent modal and manual refresh action

**Files:**
- Create: `src/components/ConsentModal.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/FinancialDashboard.tsx`

- [ ] **Step 1: Add failing render assertion or manual UI check note**
Expected initially: modal/refresh control absent.

- [ ] **Step 2: Implement consent modal with exact copy**
Include accept/decline flow and first-link gating state.

- [ ] **Step 3: Implement header refresh button wiring**
Wire to new refresh API endpoint (stub for now).

- [ ] **Step 4: Run `npm run lint`**
Expected: no lint errors.

- [ ] **Step 5: Commit**
```bash
git add src/components/ConsentModal.tsx src/app/page.tsx src/components/FinancialDashboard.tsx
git commit -m "feat(ui): add mono consent modal and manual refresh control"
```

### Task 6: Add forget-me and refresh API endpoints

**Files:**
- Create: `src/app/api/financial-data/refresh/route.ts`
- Create: `src/app/api/financial-data/forget/route.ts`

- [ ] **Step 1: Write endpoint contract examples (request/response types)**
Define minimal response shape and failure modes.

- [ ] **Step 2: Run build to confirm route types unresolved**
Expected: compile issues until implemented.

- [ ] **Step 3: Implement refresh route**
Calls secure merge path and returns updated summary metadata.

- [ ] **Step 4: Implement forget route**
Purge `financial_summary_cache`, `ai_feedback`, `ai_audit_logs`, and transient rows.

- [ ] **Step 5: Run build + lint**
Run:
```bash
npm run build
npm run lint
```
Expected: pass.

- [ ] **Step 6: Commit**
```bash
git add src/app/api/financial-data/refresh/route.ts src/app/api/financial-data/forget/route.ts
git commit -m "feat(api): add manual refresh and forget-me endpoints"
```

---

## Chunk 3: Two-Stage AI Trust Pipeline

### Task 7: Add advisor and judge prompt builders

**Files:**
- Create: `src/lib/trust/prompts.ts`

- [ ] **Step 1: Write minimal tests for prompt requirements**
Assertions: includes citation requirement, confidence scoring, fairness rule, and transparency blocks.

- [ ] **Step 2: Run tests and confirm fail**
Run: `npm test -- src/lib/trust/prompts.test.ts` (if configured).
Expected: fail missing module.

- [ ] **Step 3: Implement prompt generators**
Functions:
- `buildAdvisorPrompt(context)`
- `buildJudgePrompt({draft, context})`

- [ ] **Step 4: Run tests again**
Expected: pass.

- [ ] **Step 5: Commit**
```bash
git add src/lib/trust/prompts.ts
git commit -m "feat(ai): add advisor and judge prompts for trust pipeline"
```

### Task 8: Extend Gemini client for generation params

**Files:**
- Modify: `src/lib/geminiClient.ts`

- [ ] **Step 1: Write failing unit test for generation config overrides**
Verify `temperature` and `top_p` pass through request body.

- [ ] **Step 2: Run test and confirm fail**
Expected: fail due to hardcoded config.

- [ ] **Step 3: Implement optional config parameter support**
Add typed config object with defaults.

- [ ] **Step 4: Run tests/lint**
Expected: pass.

- [ ] **Step 5: Commit**
```bash
git add src/lib/geminiClient.ts
git commit -m "feat(ai-client): support per-call generation controls"
```

### Task 9: Implement pipeline orchestrator and chat route integration

**Files:**
- Create: `src/lib/trust/pipeline.ts`
- Modify: `src/app/api/chat/route.ts`

- [ ] **Step 1: Write failing API test for two-stage behavior**
Case: draft contains hallucinated number; judge output must correct.

- [ ] **Step 2: Run test and confirm fail**
Expected: current route single-stage + no judge correction.

- [ ] **Step 3: Implement pipeline orchestration**
- retrieve context
- advisor call (`0.1`, `0.9`)
- judge call (`0`, `<=0.1`)
- parse final output
- fallback to deterministic local engine on invalid outputs

- [ ] **Step 4: Log chat action to `ai_audit_logs`**
Persist summary, decision, confidence, citations.

- [ ] **Step 5: Run build/lint/tests**
Expected: pass for updated route.

- [ ] **Step 6: Commit**
```bash
git add src/lib/trust/pipeline.ts src/app/api/chat/route.ts
git commit -m "feat(chat): add two-stage advisor-judge trust pipeline"
```

---

## Chunk 4: Trust-Focused Chat UX

### Task 10: Add confidence badge, why-accordion, and citation helpers

**Files:**
- Create: `src/components/ConfidenceBadge.tsx`
- Create: `src/components/WhyThisResponse.tsx`
- Create: `src/lib/trust/citations.ts`
- Modify: `src/components/RecommendationCard.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing unit tests for confidence band mapping**
Input scores -> expected band color.

- [ ] **Step 2: Run tests, confirm fail**
Expected: helper missing.

- [ ] **Step 3: Implement confidence/citation utility + components**
Add reusable trust signal components.

- [ ] **Step 4: Integrate into recommendation card**
Display badge, expandable citations, XAI accordion.

- [ ] **Step 5: Run lint + build**
Expected: pass.

- [ ] **Step 6: Commit**
```bash
git add src/components/ConfidenceBadge.tsx src/components/WhyThisResponse.tsx src/lib/trust/citations.ts src/components/RecommendationCard.tsx src/app/globals.css
git commit -m "feat(ui): add confidence, citations, and explainability accordion"
```

### Task 11: Add accept/disagree feedback flow

**Files:**
- Create: `src/components/DisagreeModal.tsx`
- Create: `src/app/api/feedback/route.ts`
- Modify: `src/components/ChatInterface.tsx`
- Modify: `src/components/RecommendationCard.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write failing API test for feedback insert**
Payload should store user explanation with timestamp.

- [ ] **Step 2: Run test and confirm fail**
Expected: route missing.

- [ ] **Step 3: Implement `POST /api/feedback`**
Validate payload and insert row into `ai_feedback`.

- [ ] **Step 4: Implement UI disagree modal + quick chips**
Wire to route; also support accept action logging path.

- [ ] **Step 5: Add “data used only for this query (X transactions retrieved)” footer in chat message view**
Ensure value comes from API response metadata.

- [ ] **Step 6: Run build/lint/manual smoke**
Expected: chat flow works with feedback controls.

- [ ] **Step 7: Commit**
```bash
git add src/components/DisagreeModal.tsx src/app/api/feedback/route.ts src/components/ChatInterface.tsx src/components/RecommendationCard.tsx src/app/page.tsx
git commit -m "feat(chat): add accept-disagree feedback loop and data-usage footer"
```

---

## Chunk 5: Auto-Stash, Behaviour Score, and Accountability

### Task 12: Enhance Auto-Stash provenance and decision logging

**Files:**
- Create: `src/app/api/auto-stash/decision/route.ts`
- Modify: `src/components/AutoStash.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write failing API test for auto-stash decision logging**
Expected insert into `ai_audit_logs`.

- [ ] **Step 2: Implement route + UI hooks**
Add decision provenance card and accept/disagree handlers.

- [ ] **Step 3: Run build/lint**
Expected: pass.

- [ ] **Step 4: Commit**
```bash
git add src/app/api/auto-stash/decision/route.ts src/components/AutoStash.tsx src/app/page.tsx
git commit -m "feat(auto-stash): add provenance and override audit logging"
```

### Task 13: Rename and harden Financial Behaviour Score fairness

**Files:**
- Modify: `src/lib/trustScore.ts`
- Modify: `src/components/TrustScore.tsx`

- [ ] **Step 1: Write failing test for family/cultural penalty exclusion**
Construct transactions containing family/cultural category and ensure no penalty delta.

- [ ] **Step 2: Run test and confirm fail**
Expected: current logic penalizes based on category mix.

- [ ] **Step 3: Implement fairness guardrail**
Exclude protected categories/labels from penalty calculations.

- [ ] **Step 4: Update UI title copy to “Financial Behaviour Score”**
Preserve expandable explanations.

- [ ] **Step 5: Run tests + build**
Expected: pass.

- [ ] **Step 6: Commit**
```bash
git add src/lib/trustScore.ts src/components/TrustScore.tsx
git commit -m "feat(score): rename to financial behaviour score with fairness guardrail"
```

### Task 14: Add AI Audit Trail screen/tab

**Files:**
- Create: `src/components/AIAuditTrail.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Add failing render check/manual acceptance criteria**
Expected currently: no audit trail UI.

- [ ] **Step 2: Implement audit table component**
Columns: date, action, summary, decision, confidence.

- [ ] **Step 3: Wire tab/screen toggle in page shell**
Load from `ai_audit_logs` query endpoint/path.

- [ ] **Step 4: Run build + lint**
Expected: pass.

- [ ] **Step 5: Commit**
```bash
git add src/components/AIAuditTrail.tsx src/app/page.tsx src/app/globals.css
git commit -m "feat(audit): add AI audit trail screen"
```

---

## Chunk 6: Over-Reliance Controls and Demo Polish

### Task 15: Implement over-reliance nudges and pause toggle

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/ChatInterface.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Write failing logic tests for interaction counters**
- show literacy-tip every 4-5 interactions
- show autonomy nudge after 3+ consecutive accepts
- 7-day pause blocks auto-stash visibility

- [ ] **Step 2: Run tests and confirm fail**
Expected: logic not present.

- [ ] **Step 3: Implement state + UI controls**
Settings toggle for pause, message nudges in chat.

- [ ] **Step 4: Run build/lint**
Expected: pass.

- [ ] **Step 5: Commit**
```bash
git add src/app/page.tsx src/components/ChatInterface.tsx src/app/globals.css
git commit -m "feat(trust): add over-reliance nudges and auto-stash pause"
```

### Task 16: Add global disclaimer and docs updates

**Files:**
- Create: `src/components/GlobalDisclaimer.tsx`
- Modify: `src/app/layout.tsx`
- Modify: `docs/IMPLEMENTATION_GUIDE.md`

- [ ] **Step 1: Implement reusable disclaimer component**
Required text:
“CashWise is an AI advisor, not a licensed financial advisor. We take no liability for decisions. Always verify important choices.”

- [ ] **Step 2: Wire component so visible across screens**
Ensure non-intrusive placement.

- [ ] **Step 3: Update implementation guide with trust architecture and runbook**
Include env vars and Supabase function deployment notes.

- [ ] **Step 4: Run final checks**
Run:
```bash
npm run lint
npm run build
```
Expected: pass.

- [ ] **Step 5: Commit**
```bash
git add src/components/GlobalDisclaimer.tsx src/app/layout.tsx docs/IMPLEMENTATION_GUIDE.md
git commit -m "docs(ui): add global disclaimer and trust implementation notes"
```

---

## Final Verification Checklist

- [ ] Run full lint/build suite
```bash
npm run lint
npm run build
```

- [ ] Manual demo path:
1. Chat question returns citations + confidence + why accordion
2. Accept/disagree captures feedback and affects later context
3. Auto-stash shows provenance and logs decisions
4. Financial Behaviour Score visible with fairness-safe logic
5. Audit trail shows chat + auto-stash actions
6. Refresh Data works only by user action
7. Forget Me purges history
8. Disclaimer visible on all screens

- [ ] Prepare hackathon demo script notes in `docs/IMPLEMENTATION_GUIDE.md`

