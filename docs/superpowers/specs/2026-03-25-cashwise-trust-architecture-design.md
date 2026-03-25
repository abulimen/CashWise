# CashWise Trust Architecture Design

Date: 2026-03-25  
Project: CashWise V2 (Babcock Tech Week 2026 - Finance Track)

## 1. Objective
Transform the current CashWise demo into a production-grade prototype that visibly bridges trust gaps in AI-powered personal finance while preserving the existing MVP core:
- AI Copilot Chat (RAG-driven)
- Auto-Stash (agentic savings prompt)
- Financial Behaviour Score (no loan logic)

## 2. Existing System Snapshot
Current codebase is a single-page Next.js App Router UI with:
- Client-side state orchestration in `src/app/page.tsx`
- Chat endpoint in `src/app/api/chat/route.ts` with:
  - Gemini generation
  - local deterministic affordability fallback
- Rule-based financial score logic in `src/lib/trustScore.ts`
- Mono client wrappers (`src/lib/monoClient.ts`) but no durable data persistence
- No Supabase integration yet

## 3. Scope Guardrails
In scope:
- Trust safeguards requested by the user across model reliability, privacy/security, explainability, and user control
- UI additions for confidence, citations, provenance, audit trail, overrides
- Supabase schema + RLS + edge encryption workflow

Out of scope:
- Stablecoin features
- voice features
- micro-loans
- broad re-architecture of non-trust features

## 4. Target Architecture

### 4.1 Chat Trust Pipeline (Two-Stage)
For every AI response:
1. Retrieve context (transactions, profile summary, goals, bills, prior feedback)
2. Stage A Advisor model generates draft JSON (`temperature=0.1`, `top_p=0.9`)
3. Stage B Judge model fact-checks draft against retrieved data (`temperature=0`, `top_p=0.1`)
4. Judge rewrites unsupported claims and emits:
   - corrected final response
   - confidence score (0-100)
   - citation references (transaction IDs + short natural-language references)
5. Persist audit event

Output contract additions:
- `confidenceScore: number`
- `citations: Citation[]`
- `dataUsage: { transactionCount: number }`
- `xai: { retrievedData: string[]; reasoningTrace: string; promptSnippet: string }`
- `suggestionControls: { canAccept: boolean; canDisagree: boolean }`

### 4.2 Financial Behaviour Score (Fairness Constraint)
Rename presentation from “Financial Trust Score” to “Financial Behaviour Score”.

Scoring factors retained and simplified:
- Spending discipline
- Savings consistency/rate
- Balance stability

Fairness rule:
- Family/cultural spending must not be used as a penalty signal.
- Implement category-level exclusion in penalty logic and preserve explainability text.

### 4.3 Auto-Stash with Provenance + Override
Auto-Stash suggestion flow will include:
- decision provenance card: inflow detected -> goals analyzed -> daily burn calculated -> suggestion
- accept/disagree controls
- disagree capture modal with quick reasons + free text
- audit log write for each user decision

### 4.4 Privacy + Security Data Flow
#### First-link consent
On first Mono connection, require explicit consent modal copy:
“Allow CashWise to fetch your latest transactions? (Read-only via Mono. Data will be encrypted and you can delete it anytime.)”

#### Controlled refresh
Add user-controlled Refresh Data button in header.
No background auto-refresh loop.

#### Encrypted summary cache
- Store only aggregated summary in Supabase table (not raw transactions)
- Encryption: AES-GCM key derived from `user_id + server_salt` in Edge Function runtime
- Runtime flow per session/login:
  1. Decrypt summary
  2. Pull latest Mono delta
  3. Merge and recompute summary
  4. Re-encrypt and persist
  5. Zero out plaintext objects in-memory immediately after response

#### Forget-Me delete
Add “Delete My Financial History” action that hard-deletes:
- encrypted summary cache
- feedback rows
- audit logs
- transient transaction snapshots

### 4.5 Accountability Surface
Add new “AI Audit Trail” screen/tab:
Columns:
- Date
- Action Type (Chat | Auto-Stash)
- Suggestion Summary
- User Decision (Accepted | Overridden)
- Confidence Score

### 4.6 Over-Reliance Mitigation
- Every 4-5 interactions inject optional literacy-tip prompt
- Settings toggle: “Pause Auto-Stash for 7 days”
- If 3+ consecutive accepts, show autonomy nudge encouraging user-led monthly review

## 5. Data Model Changes

### 5.1 `ai_feedback`
- `id uuid pk`
- `user_id uuid`
- `query text`
- `ai_suggestion text`
- `user_explanation text`
- `quick_reason text null`
- `created_at timestamptz default now()`

### 5.2 `ai_audit_logs`
- `id uuid pk`
- `user_id uuid`
- `action_type text check in ('chat','auto_stash')`
- `suggestion_summary text`
- `user_decision text check in ('accepted','overridden','none')`
- `confidence_score int`
- `citations jsonb`
- `created_at timestamptz default now()`

### 5.3 `financial_summary_cache`
- `user_id uuid pk`
- `encrypted_payload text`
- `iv text`
- `auth_tag text`
- `updated_at timestamptz`

RLS:
- enforce `auth.uid() = user_id` for select/insert/update/delete
- no anonymous access

## 6. API and UI Change Plan

### API
- `POST /api/chat`
  - add two-stage advisor + judge pipeline
  - attach citations, confidence, xai block, data usage footer values
  - write `ai_audit_logs`
- `POST /api/feedback`
  - persist disagree reasons to `ai_feedback`
- `POST /api/auto-stash/decision`
  - capture accept/override and log audit
- `POST /api/financial-data/refresh`
  - manual refresh endpoint invoking secure merge path
- `DELETE /api/financial-data/forget`
  - hard-delete all financial history data

### UI
- Header: `Refresh Data` + settings entry
- Chat message card:
  - confidence badge (green/orange/red)
  - expandable citation view
  - “Why I said this” accordion
  - footer “Data used only for this query (X transactions retrieved).”
  - `Accept` / `Disagree` controls
- Disagree modal:
  - chips + free text
- Auto-Stash card:
  - provenance panel
  - `Accept` / `Disagree`
- New Audit Trail screen/tab
- Global disclaimer footer on all screens

## 7. Error Handling + Safety Rules
- If judge score < 60:
  - show low-confidence warning state
  - encourage user verification
- If retrieval context missing critical fields:
  - respond with explicit uncertainty and request user confirmation
- If model output invalid JSON:
  - strict parser fallback to deterministic engine
- Never claim precision when data missing

## 8. Testing Strategy
- Unit tests
  - confidence color thresholds
  - fairness exclusion for family/cultural categories
  - over-reliance interaction counters
  - citation formatter and XAI payload builders
- API tests
  - two-stage flow with mocked model outputs
  - feedback storage
  - audit log writes
  - forget-me deletion coverage
- Integration/manual demo path
  - chat with citation + confidence
  - auto-stash accept and disagree
  - audit trail populated
  - refresh data + consent + forget me

## 9. Demo Narrative Alignment
60-second flow:
1. Ask affordability question -> show citation-backed answer + confidence badge + “why” accordion
2. Trigger Auto-Stash -> show provenance and override path
3. Open Financial Behaviour Score + fairness-friendly explanation
4. Open AI Audit Trail to prove accountability
5. Tap Refresh Data and show Forget-Me control

Pitch anchor:
“We built CashWise to bridge the trust gap in AI finance by making every recommendation verifiable, controllable, privacy-safe, and accountable.”

## 10. Implementation Sequence
1. Type contracts + Supabase SQL migration files
2. Privacy controls (consent, refresh, forget-me)
3. Two-stage chat pipeline and new prompts
4. Chat trust UI (confidence/citations/XAI + feedback controls)
5. Auto-Stash provenance + override logging
6. Audit Trail screen + global disclaimer
7. Over-reliance nudges + pause toggle
8. Verification and demo script refinements
