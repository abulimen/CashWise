# Trust Enhancements Summary

## Scope Applied
Implemented only the requested trust-enhancement layers across Chat, Auto-Stash, and Trust Score (third core feature name unchanged).

## Section 1: Inaccuracy, Hallucinations, Bias, Bad Decisions
- Updated Gemini usage to `gemini-3.1-flash-lite-preview`.
- Added unified retrieval context in `src/lib/trustPipeline.ts` containing:
  - latest transactions (with `tx_id`, `date`, `amount`, `category`, `description`, `narration`)
  - user profile
  - upcoming bills
  - savings goals
  - recent override feedback
- Implemented dual-call pattern:
  - Primary generation (`temperature: 0.1`, `topP: 0.9`) with your exact system rules text.
  - Secondary strict judge (`temperature: 0`, `topP: 0.1`) with your exact auditor prompt text.
- Final user output now comes from judge-corrected response, plus extracted confidence score.
- Applied to both Chat and Auto-Stash API paths:
  - `src/app/api/chat/route.ts`
  - `src/app/api/auto-stash/route.ts`

Risk addressed:
- Reduces hallucinated numbers and unsupported claims.
- Forces grounded, evidence-based advice.

Safe/responsible AI signal:
- Deterministic low-temperature auditing and explicit confidence gating.

## Section 2: Data Privacy
- Added encrypted cache flow (MVP) with Web Crypto primitives:
  - DEK generation (`AES-256`) and blob encryption.
  - DEK wrapping with user-derived hash (`user_id + server secret`).
- Added secure cache helpers:
  - `src/lib/secureCache.ts`
- Added encrypted cache persistence abstraction:
  - `src/lib/serverStore.ts`
- Added cache init route:
  - `src/app/api/transactions/cache/route.ts`
- Updated data retrieval route with 2-minute polling/delta logic and re-encryption on refresh:
  - `src/app/api/financial-data/route.ts`
- Added explicit consent modal text and Allow/Cancel enforcement on pulls:
  - `src/components/ConsentModal.tsx`
  - wired in `src/app/page.tsx`
- Added manual top-bar Refresh controls (dashboard + chat contexts).
- Added Supabase migration DDL with RLS policies:
  - `supabase/migrations/20260325_trust_layers.sql`

Risk addressed:
- Limits unnecessary data exposure and plaintext persistence.
- Prevents silent pulls by requiring explicit consent.

Safe/responsible AI signal:
- Privacy-by-design encryption and consent-first data operations.

## Section 3: Low Trust in Recommendations
### Angle A: Source Citation + Confidence
- Added per-message confidence (`Confidence: XX/100`) badge in chat.
- Color coding implemented:
  - green `>=90`
  - orange `70-89`
  - red `<70`
- Badge is tappable to show cited transactions used.

### Angle B: Human-in-the-Loop + Override History
- Added advice controls below AI advice messages:
  - `Accept / Sounds good`
  - `Disagree → Tell me why`
- Added disagreement modal with exact quick options and free text.
- Expanded Auto-Stash decline into:
  - `No, and here’s why…` with the same modal.
- Added feedback storage route and table usage:
  - `src/app/api/feedback/route.ts`
  - `ai_feedback` table migration included.
- Retrieval now injects recent 3-5 feedback records into context for future advice personalization.

Risk addressed:
- Users can challenge and correct AI output.
- System learns from overrides instead of repeating weak assumptions.

Safe/responsible AI signal:
- Human oversight and correction loop embedded in product behavior.

## Section 4: Transparency + Accountability
### Angle A: Explainable AI
- Added `Why I said this` expandable section to chat responses showing:
  - cited data list
  - one-sentence reasoning trace
  - system-rule snippet used
- Added Auto-Stash `Decision provenance` section with:
  - inflow detected
  - goals analyzed
  - burn/signal trace
  - suggestion breakdown

### Angle B: Accountability Layer
- Added AI Audit Trail screen/tab in dashboard navigation.
- Added audit API and weekly query path:
  - `src/app/api/audit/route.ts`
- Audit table columns rendered:
  - Date | Action | Suggestion | User Decision | Confidence
- Added permanent disclaimer on Chat and Audit Trail:
  - `CashWise is an AI advisor. We take no liability for financial decisions.`

Risk addressed:
- Makes model decisions inspectable and attributable.
- Preserves decision accountability records.

Safe/responsible AI signal:
- Traceability and explicit user-facing liability boundaries.

## Verification Performed
- `npm run lint` (passes; one non-blocking React hook dependency warning remains)
- `npm run build` (passes)
- End-to-end local API checks on March 25, 2026:
  - encrypted cache init: success
  - consented financial refresh: success
  - chat flow: success (judge output + confidence)
  - auto-stash flow: success (judge output + confidence)

## Commits
1. `feat: add LLM-as-judge for inaccuracy prevention`
2. `feat: implement encrypted transaction cache and consent-gated refresh polling`
3. `feat: add confidence citations and human override feedback loop`
4. `feat: add AI audit trail endpoint and transparency plumbing`
