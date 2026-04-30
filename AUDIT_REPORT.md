# Hospital MS Audit Report
**Date:** 2026-04-24
**Auditor:** Claude Code (read-only audit — no code, config, or DB changes were made)
**Branch audited:** `hotfix/camera-upload-syntax`
**Audit scope:** Full codebase (frontend + Supabase migrations) + schema inferred from migrations
**Stack under audit:** React 18 + Vite + TypeScript + direct Supabase from the browser. No primary backend. A handful of Supabase Edge Functions and small Vercel functions under `/api/` exist but handle narrow cases only.

---

## 🛑 STOP THE PRESS — Live credential exposure and access-control collapse

These three findings each individually justify pausing new sensitive-data intake. Together, they mean the app cannot be considered secure for PHI today.

### 🔴 S1. Third-party AI keys (OpenAI + Gemini) are compiled into the browser bundle
Every `VITE_*` variable in Vite is inlined into the production JS and downloaded by every browser. Your production bundle ships valid API keys in plain text.

**Evidence:**
- `.env` lines 7–9 — `VITE_OPENAI_API_KEY`, `OPENAI_API_KEY`, `VITE_GEMINI_API_KEY` all present in a file that is tracked by git (confirmed: `.env` shows in `ls -la`, no .gitignore entry visible at root).
- `src/components/ChatWidget.tsx:15` — `const OPENAI_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';`
- `src/components/CameraUpload.tsx:434, 448, 690, 804, 979` — Gemini key used directly from client.
- `src/pages/FinalBill.tsx:4396, 4527, 13023, 13052` — OpenAI key sent from the user's browser in an `Authorization: Bearer ...` header.
- `src/pages/IpdDischargeSummary.tsx:4264, 4602` — Gemini key embedded in URL query string (worse — will end up in every reverse proxy, browser history, and network tab).
- `src/pages/DischargeSummaryEdit.tsx:2370, 2466`, `src/pages/MarketingDashboard.tsx:540` — same pattern.

**Impact:** Any user who opens DevTools → Network or grabs a JS chunk can copy the keys and:
- Run unbounded prompts on your OpenAI/Gemini accounts (invoice spike).
- Post arbitrary data to those APIs under your organization.
- Trivially extract the Gemini key from access logs because it's in `?key=...`.

Any "rising AI cost" you have observed is almost certainly correlated with this.

### 🔴 S2. Password hashes for every user are reachable by any browser
Authentication is handcrafted. The frontend fetches the `User` row (including the `password` column, which holds a bcrypt hash or plaintext), then compares bcrypt in the browser.

**Evidence:**
- `src/contexts/AuthContext.tsx:232–238` — `.from('User').select('*').ilike('email', email).single()` returns the full row to the browser.
- `src/contexts/AuthContext.tsx:253–264` — `if (data.password.startsWith('$2')) { comparePassword(credentials.password, data.password) } else { isPasswordValid = data.password === credentials.password }`. Plaintext fallback is still live.
- `src/contexts/AuthContext.tsx:220–228` — "Staff PIN" login does `select('*').eq('staff_pin', pin)` against the `User` table. Anyone enumerating 4–6 digit PINs can pull other staff's full rows (email, role, password hash).
- `src/utils/auth.ts:1–10` — bcrypt runs in the browser via `bcryptjs`.
- No RLS policy for the `User` table was found by searching `supabase/migrations/**` and `supabase-migrations/**` with `ON (public\.)?"?User"? FOR`. Combined with S3 below, the table is effectively public to the anon key.

**Impact:** Plus S3, this means anyone holding the anon key (which is in the bundle — see S1/C1) can `SELECT * FROM "User"` and walk away with every hash, every email, every role, and every staff_pin. The staff_pin flow is also a built-in password-enumeration oracle.

### 🔴 S3. Access control is effectively off at the database layer
Row Level Security across 170+ tables is either disabled, overridden by `USING (true)`, or granted to `anon`. Real auth decisions are being made in React state — which is editable in DevTools.

**Evidence:**
- **308** policies with `USING (true)` or `WITH CHECK (true)` (grep across all migration folders). That is 82% of the 377 policies defined.
- **27** policies granted to the `anon` role. Example: `supabase/migrations/20260109000000_create_marketing_tables.sql:134–158` — `marketing_users`, `doctor_visits`, `marketing_camps` each have `FOR SELECT/INSERT/UPDATE/DELETE TO anon USING (true)`. Anyone with your public URL can read and modify these tables with no login.
- `supabase/migrations/20260407150001_create_daily_allocation_saves.sql:23` — `FOR ALL TO anon USING (true) WITH CHECK (true)`.
- **14** tables have RLS explicitly disabled, including the most sensitive ones:
  `public.chart_of_accounts`, `public.vouchers`, `public.voucher_entries`, `public.voucher_types`, `public.patient_ledgers`, `public.clinical_services`, `public.complications`, `public.medication`, `public.lab`, `public.radiology`, `public.ayushman_consultants`, `public.ayushman_surgeons`, `public.ayushman_anaesthetists`, `public.hope_anaesthetists`.
- Frontend-only role checks: 88 occurrences of `isAdmin`/`role === 'admin'`/`role === 'superadmin'` in `src/**`. The role is sourced from `localStorage.hmis_user` (`src/contexts/AuthContext.tsx:281, 388`). Attacker opens DevTools → `localStorage.setItem('hmis_user', JSON.stringify({...role:'superadmin'}))` → refresh → full admin UI. Because most tables have no real RLS, the UI was the only gate.
- `audit_trail` policies, `supabase/migrations/20250611012633-672d082e-4204-4b0b-8cf5-1088a96bbacc.sql:106–107`: `FOR SELECT USING (true)` and `FOR INSERT WITH CHECK (true)`. Any client can read every audit row and write fake entries — so an attacker can also cover their tracks.

**Impact:** For a hospital, this is a regulatory and ethical emergency. Under HIPAA (US), DPDP Act 2023 (India), or equivalent, this is a reportable breach posture, not just a bug.

---

## Executive Summary

**Is this app safe to run in production right now?** No. It should not accept new sensitive patient data, and existing data should be treated as if it has already leaked. The combination of compiled-in AI keys (S1), frontend-side password comparison with accessible hashes (S2), and effectively-open RLS (S3) means any reasonably skilled user — including any of the 20–100 legitimate users — can pull the entire patient database, every user's credentials, and the clinical and financial history, without triggering an alert. The audit log itself is writable by the same attackers, so there will be no evidence after the fact.

The crashes, freezes, and rising costs are not mysterious — they are the symptoms of the browser doing a backend's job. The app renders a 25,098-line billing page (`src/pages/FinalBill.tsx`), runs bcrypt on the main thread on login, runs `eval()` on lab formulas (`src/components/lab/LabOrders.tsx:2941`), and issues 1,876 direct Supabase calls from 105 component files with 87% of queries unbounded (no `.limit()`).

**Top 3 risks in plain language:**
1. **"Anyone can take the database."** Service keys aren't leaked, but the anon key plus open RLS plus readable password hashes is the same practical outcome.
2. **"Any logged-in user can act as any other user."** Role checks live in the browser. With RLS off or permissive, promoting yourself from receptionist to superadmin is a one-line edit in DevTools.
3. **"AI bills will keep rising and there is no way to cap them."** Keys are in the bundle; no server-side rate limit, no per-user quota.

**Rough effort to reach "safe and stable":** 10–14 developer-weeks for a focused two-person team. ~3 weeks to seal the critical leaks (keys, auth, RLS); ~4 weeks to add a thin backend API and migrate the three hottest modules (billing, discharge, auth); ~5 weeks of parallel cleanup (dead code, file splitting, query consolidation, type safety). This is an audit estimate, not a project plan — a planner should refine it.

---

## Critical Findings (fix this week or stop using the app)

### C1. Rotate and remove hardcoded Supabase and AI keys from source
- **Title:** Supabase URL + anon key and AI vendor keys are hardcoded in committed source and in the browser bundle.
- **Evidence:**
  - Anon key hardcoded (not just from env): `src/integrations/supabase/client.ts:44–45`, `src/utils/supabase-client.ts:5–7`, `src/contexts/AuthContext.tsx:9–12`, `src/pages/Reports.tsx:28–29`, `src/pages/ReportsIsolated.tsx:27–28`. Same key copy-pasted in five places, all committed.
  - AI keys: see S1 evidence above. Both a `VITE_`-prefixed and non-prefixed `OPENAI_API_KEY` exist in `.env`; the latter isn't needed in the frontend but will still leak via git history.
  - `src/pages/DetailedInvoice.tsx:387–388, 654–655, 908–909` embeds the anon key into printed invoice HTML `<meta>` tags. Printed invoices may be saved, emailed, or screenshotted.
- **Why it matters:** Any of these keys in a git history, a printed invoice, a deployed bundle, or a browser cache is effectively a credential in the hands of whoever finds it. Combined with the RLS state, it's close to full read/write.
- **Recommended fix (not implemented):**
  1. Rotate OpenAI, Gemini, Supabase anon keys today. Assume all current values are compromised.
  2. Remove hardcoded keys from `src/**`. Load only from `import.meta.env.*` — and only the *public* Supabase URL + new anon key should remain `VITE_`-prefixed.
  3. Move OpenAI/Gemini calls behind a Vercel API route or Supabase Edge Function that holds the real key and enforces per-user daily spend caps (apply ECC skill: `dual-llm-provider-budget-defense`).
  4. Purge keys from git history with `git filter-repo` and force-push after team coordination.
  5. Remove the anon key from `<meta>` tags on printed invoices.
- **Effort:** M (rotation is hours; cleanup and history purge is days; moving AI behind functions is ~1 week).

### C2. Replace the "fetch user row + bcrypt in browser" auth with Supabase Auth (or at minimum move the compare to a server function)
- **Title:** Password hashes are readable by the browser and bcrypt compare runs client-side.
- **Evidence:** `src/contexts/AuthContext.tsx:220–270`, `src/utils/auth.ts:1–10`, `src/contexts/AuthContext.tsx:281` (full user including role persisted to `localStorage`), `src/contexts/AuthContext.tsx:261–264` (plaintext-password fallback still live).
- **Why it matters:** Even after S3 is sealed, this flow ships every hash to every caller of `from('User').select('*')`. The `staff_pin` flow lets a 4–6 digit PIN be enumerated from the browser against a table with no rate limit. The plaintext fallback means some production users currently have unencrypted passwords in the DB.
- **Recommended fix:**
  1. Short path: move login to a Supabase Edge Function (`/auth-login`). Accepts `{ email, password }`, fetches the User row with service role, compares bcrypt, issues a signed session. The browser never sees the hash.
  2. Preferred path: migrate to Supabase Auth (`supabase.auth.signInWithPassword`) and deprecate the custom `User.password` column. Keep `User` as a profile table linked to `auth.users.id`.
  3. Stop persisting `role` in localStorage. Derive role from a verified claim (Supabase JWT `app_metadata.role`) on every render.
  4. Force a password reset for every user currently stored as plaintext (`WHERE password NOT LIKE '$2%'`).
- **Effort:** L (2–3 weeks end to end).

### C3. Turn on RLS on every table, remove `USING (true)`, remove all `TO anon` grants on non-public tables
- **Title:** 82% of policies are permissive; 14 sensitive tables have RLS off; 27 policies grant full CRUD to anon.
- **Evidence:** see S3 above. Specific migrations to revisit:
  - `supabase/migrations/20260109000000_create_marketing_tables.sql:134–158` — marketing tables open to anon.
  - `supabase/migrations/20250611012633-672d082e-4204-4b0b-8cf5-1088a96bbacc.sql:106–107` — audit_trail open.
  - `supabase/migrations/20260407150001_create_daily_allocation_saves.sql:23` — `FOR ALL TO anon USING (true) WITH CHECK (true)`.
  - Every migration that contains `DISABLE ROW LEVEL SECURITY` touching `clinical_services`, `chart_of_accounts`, `vouchers`, `voucher_entries`, `patient_ledgers`, `lab`, `radiology`, `medication`.
- **Why it matters:** Without this, every other security fix is cosmetic. The app may look locked down, but the database is a public read endpoint to anyone with the anon key.
- **Recommended fix:**
  1. One migration that `ENABLE`s RLS on every table in `public`, with a `DO $$` loop over `information_schema.tables`.
  2. Replace every `USING (true)` with a real predicate tied to `auth.uid()` or `auth.jwt()->>'hospital_type'` / `->>'role'`.
  3. Remove all `TO anon` grants except for intentionally-public endpoints (likely none — patient self-check-in should go through an Edge Function, not raw tables).
  4. Add RLS policy tests in `supabase/tests/` — two per table (allowed + denied). Run in CI against a shadow DB.
- **Effort:** L (~2 weeks; the 14 RLS-disabled tables + 27 anon-granted policies can be closed in ~2 days as a first pass).

### C4. Remove `eval()` on lab formulas
- **Title:** `eval()` executes user-configurable formula strings to compute lab results.
- **Evidence:** `src/components/lab/LabOrders.tsx:2941` — `const result = eval(formula);`
- **Why it matters:**
  - **Clinical safety:** A wrong formula silently returns a wrong number that a clinician acts on. Direct patient-harm vector.
  - **Security:** Anyone with permission to configure a lab formula can run arbitrary JavaScript in every clinician's browser. Combined with the localStorage-based role (C3), that's enough to escalate privileges via the inbound clinician session (`localStorage.setItem('hmis_user', ...)`).
- **Recommended fix:** Replace with a sandboxed expression evaluator (e.g., `mathjs` with a scoped symbol table, or a parsed AST that allows only `+ - * / ( ) sqrt log`, numeric literals, and named lab variables). Validate formulas at creation. Add unit tests with reference formulas for the lab tests currently in production.
- **Effort:** M (3–5 days including tests).

### C5. `@ts-nocheck` on the 25,098-line billing file and 40 others; dedicated type-bypass files
- **Title:** TypeScript is structurally disabled across the most sensitive code paths.
- **Evidence:**
  - `src/pages/FinalBill.tsx:1` — `// @ts-nocheck` on a 25,098-line file handling final billing, with 308 `.from()` queries.
  - Total `@ts-nocheck` count: **41 files**.
  - Files that exist only to disable the type system: `src/global-types-bypass.ts`, `src/typescript-override.d.ts`, `src/global-ts-ignore.ts`, `src/global.d.ts`, `src/types/bypass.ts`, `src/types/final-bypass.d.ts`, `src/types/complete-bypass.d.ts`, `src/types/ts-suppression.ts`, `src/types/global-suppression.d.ts`. Note `src/types/bypass.ts:4` comment: *"Add @ts-nocheck to window object to disable all checking"*.
  - `35` `@ts-ignore`/`@ts-expect-error` elsewhere.
  - `1,444` `any` / `as any` / `<any>` occurrences.
- **Why it matters:** Money moves through these files. Billing mistakes are financial harm and for CGHS/Ayushman billing also regulatory risk. Types don't catch every bug, but on a 25k-line file they are the cheapest insurance available, and here they're disabled by design.
- **Recommended fix:** Delete the dedicated type-bypass files. Re-enable checking on one module at a time (start with `FinalBill.tsx` — but split it first, see C6). Generate proper Supabase types with `supabase gen types typescript --project-id ...` and commit into `src/integrations/supabase/types.ts` replacing the current generic `Record<string, unknown>` shape.
- **Effort:** L (2–4 weeks, coupled with C6).

### C6. `src/pages/FinalBill.tsx` is 25,098 lines
- **Title:** A single file holds the billing UI, billing state, 308 Supabase calls, OpenAI calls, and printing logic.
- **Evidence:** `wc -l src/pages/FinalBill.tsx` = 25,098. `.from(` count = 308 in that file alone. Both `import.meta.env.VITE_OPENAI_API_KEY` usages live here (lines 4396, 4527, 13023, 13052). `@ts-nocheck` at top.
- **Why it matters:** Beyond C5, this file is the primary source of the crashes and slow interactions. A page this large:
  - Ships a very large chunk (no `React.lazy` split found for it).
  - Rerenders the world on any state change (codebase-wide `useMemo`/`useCallback` count is 151 — spread across 654 files — statistically very little is in this one).
  - Cannot be code-reviewed by a human. AI assistants working on it tend to duplicate logic because they can't see the whole file.
- **Recommended fix:** Treat as a planned refactor, not a quick split. Extract in order:
  1. Data access (`useFinalBillQuery`, `useSaveFinalBill`) → `src/hooks/finalBill/*`.
  2. Line-item editor component.
  3. Deduction / CGHS / Ayushman calculation logic → `src/lib/billing/*` with unit tests.
  4. Print-ready templates → `src/components/print/FinalBill/*`.
  5. OpenAI calls → `/api/billing-suggest` (also closes part of C1).
- **Effort:** L (3–5 weeks — do this alongside moving its queries behind a backend layer).

### C7. Three Supabase clients plus raw `fetch` with hardcoded anon key in Reports pages
- **Title:** The "exactly one Supabase client" guarantee is broken in four places.
- **Evidence:**
  - `src/integrations/supabase/client.ts:58` — canonical `supabase`.
  - `src/utils/supabase-client.ts:1–7` — second client.
  - `src/contexts/AuthContext.tsx:9–12` — third client (`supabaseAnon`).
  - `src/pages/Reports.tsx:28–29` and `src/pages/ReportsIsolated.tsx:27–28` — raw `fetch` with the anon key copy-pasted into `apikey` and `Authorization` headers.
- **Why it matters:** Multiple clients means auth state, session persistence, and refresh tokens can diverge — matching the "session randomly invalid" class of reported symptoms. Raw `fetch` bypasses the SDK's auth refresh entirely.
- **Recommended fix:** One client, exported from `src/integrations/supabase/client.ts`. Delete `src/utils/supabase-client.ts`. Rewrite `Reports.tsx` and `ReportsIsolated.tsx` to use the shared client. The "Isolated" copy appears to be a near-duplicate — pick one and delete the other.
- **Effort:** S (half a day).

---

## High Priority (fix this month)

### H1. No backend: 105 component files and 89 page files call Supabase directly
- **Evidence:** `grep -rlE "import.*supabase" src/components` = 105 files; same under `src/pages` = 89. Top callers by query count: FinalBill (308), IpdDischargeSummary (47), TodaysIpdDashboard (39), LabOrders (39), MarketingDashboard (35), useFinancialSummary (34), Invoice (33), DischargeSummaryEdit (32), AdvanceStatementReport (31), useLabData (31).
- **Why it matters:** Every business rule, validation, and rate limit lives in code the user can edit. Refactoring one rule means hunting through ~200 files. This is the single biggest driver of the "unmaintainable" feeling.
- **Recommended fix:** Introduce a thin backend API — see **Architectural Recommendation** below.
- **Effort:** L (incremental; full migration is 2–3 months).

### H2. 447 `select('*')` queries pull every column including sensitive ones
- **Evidence:** `447` matches in `src/**` for `.select('*')` out of 1,413 total `.select()` calls (32%). The `User` table `.select('*')` in `AuthContext.tsx:224, 234` is how password hashes leak; every other `select('*')` is a latent version of the same mistake.
- **Why it matters:** For `User`, `patients`, `prescriptions`, `ipd_discharge_summary`, this is PHI/PII inflation. Rows carry fields like `aadhar_no`, `phone`, `dob`, `diagnosis`, `medications` into components that only need `id` and `name`.
- **Recommended fix:** Name-every-column policy. Start with PHI-returning tables (`patients`, `User`, `visits`, `prescriptions`, `ipd_discharge_summary`, `lab_results`, `medication_administration`). Replace `select('*')` with explicit lists, then add an ESLint rule forbidding `.select('*')`.
- **Effort:** L per module, S per file. Do it as part of the backend migration (H1) — each server route defines its own projection.

### H3. 1,230 of 1,413 queries have no `.limit()` or pagination (~87% unbounded)
- **Evidence:** `1,413` total `.select()` vs `178` `.limit()` + `5` `.range()` usages.
- **Why it matters:** As the hospital's data grows, every unbounded query gets slower linearly. The crashes reported in big-data pages (DischargedPatients 2,370 lines, TodaysIpdDashboard 4,009 lines) are almost certainly React choking on thousands of unpaginated rows.
- **Recommended fix:** Default `.limit(100)` everywhere. Server-side pagination for tables that exceed a few hundred rows: `patients`, `doctor_visits`, `visits`, `prescriptions`, `bills`, `lab_orders`, `pharmacy_sales`, `pharmacy_sale_items`, `voucher_entries`, `user_activity_log`. Use `useInfiniteQuery` + `.range()`.
- **Effort:** M.

### H4. Polling intervals compound across 20–100 concurrent users
- **Evidence:** `src/pages/PatientPortal.tsx:175` 10s, `src/pages/SelfCheckIn.tsx:76` 15s, `src/components/pharmacy/PrescriptionQueue.tsx:550` 30s, `src/components/radiology/EnhancedRadiologyOrders.tsx:229` 30s, `src/hooks/usePendingBillCount.ts:20` 30s, `src/hooks/useDailyPaymentAllocation.ts:256` 60s, `src/hooks/useTallyIntegration.ts:79` 60s (comment says "reduced from 5s to prevent DB overload"), `src/pages/BillApprovals.tsx:96` 120s, `src/hooks/useBatchInventory.ts:107, 123` 300s.
- **Why it matters:** With 50 concurrent users, PatientPortal alone generates 300 queries/min, SelfCheckIn 200/min. None are on Supabase Realtime — polling is second-best, and when it's unbounded (H3) each poll pulls a full table. Directly drives cost.
- **Recommended fix:** Move legitimately-real-time dashboards (queue tokens, OT status) to Supabase Realtime. Raise other intervals to 5–10 minutes and add a manual Refresh button. Move per-user state to short-TTL server caching.
- **Effort:** M.

### H5. 4,412 `console.log`/`console.error` calls, many leaking PII
- **Evidence:** Total count `4,412`. Sample PII leaks:
  - `src/contexts/AuthContext.tsx:84` — email + role.
  - `src/contexts/AuthContext.tsx:231, 248` — email on login.
  - `src/utils/patientDataTransformer.ts:219` — patient name, visit ID, surgery name.
  - `src/components/CameraUpload.tsx:1912` — patient name and ID during prescription save.
  - `src/components/PatientCard.tsx:343–344` — entire patient object including surgeon.
- **Why it matters:** Browser console logs end up in shared workstations, browser extensions, screen recordings, and support screenshots. Under most health-data regimes, printing PHI to a log is itself disclosure.
- **Recommended fix:** Replace `console.*` with a logger that is a no-op in production. The pattern already exists in one spot (`src/pages/AdvanceStatementReport.tsx:1070` guards on `process.env.NODE_ENV === 'development'`) — generalize it. ESLint rule: fail on `console.*` anywhere in `src/**` except `src/lib/logger.ts`.
- **Effort:** M.

### H6. Realtime subscribe/unsubscribe and setInterval/clearInterval asymmetries — memory-leak class
- **Evidence:** `.subscribe(` = 3, `.unsubscribe(` + `removeChannel(` = 4. `setInterval` = 13, `clearInterval` = 18. Counts don't confirm leaks, but asymmetry with no shared helper suggests cleanup is ad-hoc.
- **Why it matters:** On long sessions (a workstation runs all shift), leaked channels and intervals accumulate into freezes — matches reported symptoms.
- **Recommended fix:** Audit every `setInterval` and `supabase.channel(...).subscribe()` call for a matching teardown in the same `useEffect`. Prefer `useQuery` with short `staleTime` over raw intervals.
- **Effort:** S (afternoon for the ~16 call sites).

### H7. Plaintext passwords still accepted via fallback branch
- **Evidence:** `src/contexts/AuthContext.tsx:261–264` falls back to `data.password === credentials.password` when password does not start with `$2`.
- **Why it matters:** Any user row with a non-bcrypt password is stored in cleartext in a table with permissive RLS. Treat those rows as already breached.
- **Recommended fix:** Migration to force-reset all users with `password NOT LIKE '$2%'`. Block login for that state until reset. Covered inside C2.
- **Effort:** S (covered in C2).

### H8. Hardcoded bootstrap password `"Welcome@2026"`
- **Evidence:** `src/pages/UserManagement.tsx:577` — `const defaultHash = await hashPassword("Welcome@2026");`
- **Why it matters:** Every admin-created user gets the same default password. Most staff never change it; anyone who learns the string logs in as any such user.
- **Recommended fix:** Generate a random password per user, send out-of-band, force change on first login. Never commit a default.
- **Effort:** S.

---

## Medium Priority (fix this quarter)

### M1. Duplicate / backup files committed to `src`
- `src/pages/FinalBill.tsx.backup`, `src/pages/FinancialSummary-backup.tsx`, `src/utils/labTestConfigHelper_v2.ts` (implying a v1 still exists, confirmed), `src/pages/Reports.tsx` vs `src/pages/ReportsIsolated.tsx` (near-duplicates with copy-pasted anon keys).
- **Fix:** Delete. Use git history for rollback. **Effort:** S.

### M2. Components over 1,000 lines — 35 of them, 12 over 2,000
Top offenders beyond C6:
`LabOrders.tsx` 6,009; `IpdDischargeSummary.tsx` 4,775; `DischargeSummaryEdit.tsx` 4,355; `TodaysIpdDashboard.tsx` 4,009; `LabPanelManager.tsx` 3,438; `CameraUpload.tsx` 2,661; `pharmacy/SalesDetails.tsx` 2,604; `Invoice.tsx` 2,430; `DailyPaymentAllocation.tsx` 2,377; `DischargedPatients.tsx` 2,370; `DetailedInvoice.tsx` 2,248; `OperationTheatre.tsx` 2,086. Each is a render-perf liability and a maintenance cliff.
**Effort:** L, spread over ~6 months.

### M3. 174 tables for a hospital — investigate whether many are dead or duplicate
Obvious suspected duplication:
- `medication`, `medications`, `visit_medications`, `medication_administration`.
- `radiology`, `radiology_orders`, `radiology_results`, `radiology_reports`, `radiology_appointments`, `radiology_procedures`, `radiology_qa_checks`, `radiology_technologists`, `radiology_modalities`, `radiology_subspecialties`, `visit_radiology`, `radiologists`.
- `lab`, `lab_orders`, `lab_results`, `lab_reports`, `lab_samples`, `lab_tests`, `lab_test_config`, `lab_test_formulas`, `lab_departments`, `lab_equipment`, `lab_sub_speciality`, `test_categories`, `test_results`, `visit_labs`.
- `bills`, `bill_line_items`, `bill_sections`, `bill_preparation`, `yojna_bills`, `direct_sale_bills`.
- Three parallel `hope_*` / `ayushman_*` tables for consultants, anaesthetists, surgeons, RMOs, instead of a single `doctors` table with a `hospital_type` discriminator (the app already models `HospitalType` in `src/types/hospital.ts`).

**Recommended fix:** Row counts + last-write-time per table. Tables with <100 rows and no recent writes → removal candidates. Collapse `hope_*`/`ayushman_*` pairs with a `hospital_type` column. **Effort:** L — high reward for query performance.

### M4. `logActivity` and `audit_trail` are not tamper-resistant
- **Evidence:** `src/lib/activity-logger.ts` writes to `user_activity_log` (5 frontend call sites). `audit_trail` policies are `USING (true)` (see C3).
- **Recommended fix:** Route `logActivity` through a server function using the service role. On the table, `REVOKE UPDATE, DELETE` from all app roles. Make `SELECT` visible only to `admin`/`superadmin`. **Effort:** M.

### M5. `dangerouslySetInnerHTML` in 18 places, many on AI-generated content
- **Evidence:** 18 occurrences in `src/**`. Discharge-summary and invoice surfaces use this to print. AI-generated discharge summaries (Gemini) end up back in the DOM without sanitization.
- **Recommended fix:** Audit all 18 sites. Route AI content through DOMPurify before render (apply ECC skill `svg-sanitization-dompurify` — same principle). **Effort:** S.

### M6. Bundle bloat — CKEditor, pdfjs-dist 3.x, exceljs, xlsx
- **Evidence:** `package.json:21–22` uses `@ckeditor/ckeditor5-build-classic`. `node_modules` shows ~20 CKEditor plugin trees each ~70–720 MB (mostly hoisted duplicates). `pdfjs-dist@3.11.174` (old major with known CVEs), `xlsx` (historical prototype-pollution), `exceljs`, `html2canvas`, `jspdf`, `recharts` all present. `vite.config.ts` comments note manual chunking was removed because it caused runtime crashes ("Cannot read createContext", "Cannot access 'S' before initialization").
- **Recommended fix:** Generate a bundle visualizer (`rollup-plugin-visualizer`), confirm main-chunk size. Dynamic-import CKEditor only in pages that need it (DischargeSummaryEdit, IpdDischargeSummary). Upgrade `pdfjs-dist` to 4.x behind a controlled PR. Check if `xlsx` can be replaced with a narrower export lib. **Effort:** M.

### M7. React Query cache not tuned; dashboards refetch on every focus
- **Evidence:** No global `defaultOptions: { queries: { staleTime: ... } }` visible on `QueryClient` instantiation in `src/App.tsx`. Default `staleTime` is `0`, so every window-focus triggers refetches.
- **Recommended fix:** Set `staleTime: 60_000` default; override per query when needed. **Effort:** S.

### M8. 63 localStorage writes — some are server-state masquerading as local
- **Evidence:**
  - `src/components/lab/LabPanelManager.tsx:1369, 1498` — entire lab panels in localStorage. Different workstations see different panels.
  - `src/components/CameraUpload.tsx:1172` — extracted OPD notes. Browser closes mid-exam → work lost.
  - `src/contexts/AuthContext.tsx:281, 388` — the full user object including role (already covered in C2/C3).
- **Recommended fix:** Server-owned data → Supabase. localStorage only for client-local preferences (theme, last-visited tab). **Effort:** M.

### M9. `services/` folder holds one file; 344 components embed data access
- **Evidence:** `find src/services -type f` = 1 file. The service layer exists in folder name only.
- **Recommended fix:** Target: `src/features/<feature>/{api,hooks,components}`. Data access in `api/`, shared business logic in `lib/`, components call hooks. **Effort:** L (continuous refactor, aligned with H1).

### M10. Twilio SDK in `dependencies` — confirm it does not reach the client bundle
- **Evidence:** `package.json` lists `twilio`. No `twilio.Twilio(` call in `src/`, only in `/api/twilio-*.ts`. Vite *should* tree-shake it out, but `twilio` pulling Node built-ins could trip Vite's bundling.
- **Recommended fix:** Confirm it's not in the main chunk (via the bundle visualizer above). If it lands in client JS, move to `/api/package.json` or make it `devDependencies` + handle the Vercel function separately. **Effort:** S.

---

## Low Priority / Nice to Have

### L1. 205 `.sql` files and 62 `.md` files at the repo root
Not a technical failure — hostile to newcomers. Move SQL into `supabase/migrations/` or `docs/sql-snippets/`, MDs into `docs/`. **Effort:** S.

### L2. Inconsistent folder taxonomy: `utils/` (18 files) vs `hooks/` (52) vs `services/` (1)
Pick one model. See M9. **Effort:** covered in M9.

### L3. The dedicated type-bypass files should simply be deleted
See C5. `src/types/bypass.ts:4` even has the comment *"Add @ts-nocheck to window object to disable all checking"* — the intent was to silence the compiler, not solve a problem. **Effort:** S (covered in C5).

### L4. Inconsistent setInterval cleanup
13 `setInterval` calls — cheap to audit. Comment at `src/hooks/useTallyIntegration.ts:79` ("reduced from 5s to prevent DB overload") is a past incident that should become a server-side rate limit. **Effort:** S.

### L5. No test runner in `package.json`
`e2e/` folder exists with helpers but no Playwright/Vitest in dependencies. No regression safety for releases. Suggest Playwright + 5 flows: login, register patient, admit IPD, create final bill, discharge. **Effort:** M.

### L6. Mixed casing for tables — `User` (PascalCase) vs `patients` (lowercase)
Postgres is case-sensitive; `User` must always be quoted. Migrate to `snake_case` (`users`) in a dedicated migration. Touches many files but is mechanical. **Effort:** S–M.

### L7. `.npmrc`, `.nvmrc` present but no CI workflows committed
No `.github/workflows/**` found. For a team of 10+, CI for build + lint + tsc + RLS policy tests is necessary. **Effort:** M.

---

## Architectural Recommendation

**Recommendation: Introduce a backend API layer. Do not keep this app as direct-Supabase-from-browser.**

Reasoning from the findings above:

1. **Secrets cannot live in the browser.** The single biggest cost leak (AI keys, S1) and the single biggest auth leak (bcrypt compare, C2) both require a server. There is no policy/config fix for either; the only fix is a physical move to server-side.
2. **RLS is the right defense for data access, not for business rules.** Even with C3 fully done, RLS cannot express "only the attending doctor can change the discharge diagnosis after 24 hours" or "final bill cannot be re-opened after payment cleared." Those rules currently live in 105 component files (H1). They need a server.
3. **AI budget control is impossible client-side.** With keys in the browser, every misbehaving or malicious user burns money. A server can rate-limit per user, per day, and cut off abusers in milliseconds.
4. **Audit logs need to be server-written.** Client-attested audit is not audit.

You asked: *"is it good without backend?"* — The honest answer: **for a calendar app, Supabase-direct is fine. For a hospital, it is not.** Every symptom you listed is explained by the missing backend.

### Minimum Viable Backend (MVB)

Preferred shape: **Supabase Edge Functions (Deno) for new routes, a `/api/` folder for short-lived Node routes**, fronted by your existing Vercel deployment. Pick one of the two per feature, don't mix.

Do **not** rewrite everything. Start with these five routes in weeks 1–4:

1. **`POST /api/auth/login`** — replaces `AuthContext.login`. Accepts `{ email, password }`. Server fetches `User` with service role, compares bcrypt, issues a signed JWT (or uses Supabase Auth admin APIs). Sets httpOnly cookie. Closes C2, H7, H8.
2. **`POST /api/ai/complete`** — single route for both OpenAI and Gemini. Accepts `{ prompt, model, user_id }`. Server holds keys, enforces per-user daily token cap, logs usage. Closes S1/C1 for AI. Apply skill `dual-llm-provider-budget-defense`.
3. **`POST /api/billing/final-bill/save`** — replaces direct `from('bills').upsert(...)` in `FinalBill.tsx`. Server validates totals, deductions, CGHS/Ayushman rules. Writes `bills` + `audit_trail` with service role. Starts carving up C6 and M4.
4. **`POST /api/discharge/summary/finalize`** — replaces direct writes to `ipd_discharge_summary`. Enforces rules that currently cannot exist (e.g., "no changes after 48h without supervisor approval").
5. **`POST /api/lab/formula/evaluate`** — replaces `eval()` in `LabOrders.tsx:2941`. Server runs a sandboxed expression evaluator. Closes C4.

What stays direct-to-Supabase (for now): read-only list views (e.g., `GET` patients for a ward) with proper RLS. Migrate these later. Don't try to boil the ocean.

**Auth on routes:** verify Supabase JWT server-side with `@supabase/supabase-js` + service role. Read `role`, `hospital_type` from `app_metadata` (set these only via an admin server route — the client can never write them). That replaces the localStorage role pattern (C3).

---

## Metrics Snapshot

| Metric | Value |
|---|---|
| TS/TSX files in `src/` | 654 (164 `.ts`, 490 `.tsx`) |
| Lines of code (`src/`) | ~253,900 |
| Components (`.tsx` under `src/components/`) | 344 |
| Components over 300 lines | 40 |
| Components over 1,000 lines | 35 |
| Components over 2,000 lines | 12 |
| Largest component | `src/pages/FinalBill.tsx` — 25,098 lines |
| Pages | 140 files under `src/pages/` |
| Hooks | 52 |
| Services | 1 |
| Supabase tables referenced from frontend | 174 distinct |
| Total `.from()` calls in `src/` | 1,876 |
| `.select('*')` queries | 447 (32% of all selects) |
| Queries without `.limit()` or `.range()` | ~1,230 (~87% of all selects) |
| Supabase client instantiations | 3 (plus 2 raw-fetch duplicates) |
| `any` / `as any` / `<any>` | 1,444 |
| `@ts-ignore` / `@ts-expect-error` | 35 |
| `@ts-nocheck` (whole-file opt-out) | 41 files |
| `console.log/info/warn/error/debug` | 4,412 |
| `dangerouslySetInnerHTML` | 18 |
| `eval()` | 1 (lab formula executor) |
| `localStorage`/`sessionStorage` references | 63 |
| Realtime `.subscribe(` / `.unsubscribe(` | 3 / 4 |
| `refetchInterval` polling call sites | 10 (intervals 10s–5min) |
| RLS `USING (true)` / `WITH CHECK (true)` policies | 308 |
| Policies granted `TO anon` | 27 |
| Tables with RLS explicitly **disabled** | 14 |
| Policies defined total | 377 |
| `CREATE POLICY` vs `DROP POLICY` | 377 / 43 |
| TanStack Query `useQuery`/`useMutation` | 427 |
| Migration files | 316 |
| SQL files at repo root | 205 |
| MD files at repo root | 62 |
| AI API keys bundled into frontend | 2 (OpenAI, Gemini) |
| Supabase Edge Functions | 5 (`generate-letter`, `refine-letter`, `send-admission-reminders`, `send-payment-alerts`, `tally-proxy`) |
| Vercel API functions | 6 (`ai-field-assistant.js`, `health.ts`, `tally-proxy.ts`, `twilio-call.ts`, `twilio-conference.ts`, `twilio-twiml.ts`) |
| Known duplicate/backup files | `FinalBill.tsx.backup`, `FinancialSummary-backup.tsx`, `labTestConfigHelper_v2.ts`, `Reports.tsx` + `ReportsIsolated.tsx` |

---

## What I Did NOT Check

1. **Effective RLS behavior on the live database.** I could not query Supabase directly without dashboard access. All RLS findings come from reading committed migration SQL. If a later migration outside the files I searched tightened policies, my "82% permissive" count is pessimistic. If it loosened them, it's optimistic. Verify in the Supabase dashboard → Authentication → Policies, and in SQL: `SELECT tablename, policyname, qual, with_check FROM pg_policies WHERE schemaname='public';` plus `SELECT relname, relrowsecurity FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname='public' AND c.relkind='r';`.
2. **Production `.env` values.** I read the committed `.env` at the repo root (which is itself a problem — it holds real keys and is in the working tree; `.gitignore` does not list `.env` so it may already be in git history). I did not verify Vercel's actual env or inspect the live bundle. To verify: curl the deployed main JS chunk, grep for `sk-proj-` and the anon key prefix.
3. **Runtime behavior.** I did not run the app, profile renders, measure bundle size, or click through flows. All perf findings are static inferences.
4. **Git history for leaked secrets.** Did not run `git log -p | grep 'sk-proj-'`. The keys in `.env` are very likely in history; confirm before rotating so you know the full blast radius.
5. **Row counts / query plans.** "Queries without `.limit()` are bad" is pattern-matching; the impact depends on actual row counts. A `SELECT COUNT(*)` pass on the ten most-queried tables would quantify real risk.
6. **Which tables are actually unused.** 174 is only what the *frontend* touches. The DB may have more tables used only by Edge Functions or legacy scripts.
7. **The Vercel `/api/*` functions.** I listed them; I did not audit `tally-proxy.ts` (29 KB) or the Twilio handlers — they may have their own secret-handling issues.
8. **The Edge Functions.** Same — noted their existence, did not read contents. They may or may not verify JWTs.
9. **`bcryptjs` salt rounds.** I saw the compare call but did not read `src/utils/auth.ts` for the round count. If it's < 10, leaked hashes are realistically brute-forceable.
10. **Tests.** No unit or integration tests surfaced. Did not exhaustively grep every corner — but the absence in standard locations means regression safety is low.
11. **Accessibility, i18n, mobile responsiveness.** Out of scope for this audit.

---

## Next Session Recommendation

**Do only this, in this order, before anything else:**

1. **Rotate the three leaked key classes today** — OpenAI, Gemini, Supabase anon. ~30 minutes once you have the right dashboards open.
2. **Run a dashboard-level RLS audit.** Execute the `pg_policies` + `pg_class.relrowsecurity` queries from "What I Did NOT Check." Bring the actual list (RLS-on vs RLS-off, permissive vs restrictive) into the next session so subsequent fixes are based on the live state, not migration guesses.
3. **Decide whether to take the `TO anon` marketing tables offline temporarily** (`marketing_users`, `doctor_visits`, `marketing_camps`) — these are full CRUD to anonymous callers today and are the fastest-to-abuse surface.

Do **not** start code refactors yet. The right next session is the one that kills the three leaks in C1, C2, C3. Once those are done, the rest of this report is a normal engineering backlog and the planner agent can sequence it.

Everything else in this report — the 25k-line billing file, the 174 tables, the 4,412 console.logs — is not on fire. These three are on fire. Put those out first.

---
*End of report.*
