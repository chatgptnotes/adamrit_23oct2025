# Adamrit zip 31march2026

## Project Overview

**Languages:** python, typescript
**Frameworks:** nextjs, react
**Primary:** nextjs

## Code Style

- Linter: ruff or flake8
- Formatter: black or ruff format
- Type checking: mypy or pyright

## Testing

- Test framework: pytest
- Run tests: `pytest`
- Coverage: `pytest --cov`

## Security

- No hardcoded secrets — use environment variables
- Validate all user inputs
- Parameterized queries for database access


<!-- IRONBARK:START - Auto-generated, do not edit -->
## Ironbark

This project uses the Ironbark learning loop with auto-sync to the community skill repo (`chatgptnotes/ironbark`).

- **Auto-harvest**: After 15+ tool calls, Ironbark nudges you to run `/ironbark`
- **Manual harvest**: Run `/ironbark` at any time to extract reusable patterns
- **Background sync**: Every 30 min, `sync-cli.js` pulls new community skills and pushes local ones
- **Opt-out**: `IRONBARK_SYNC_DISABLED=1`

### Available Harvested Skills (49)

Loaded from `~/.claude/skills/harvested/`. Reference any skill below by name or path when the task matches.

| Skill | Description | Path |
|-------|-------------|------|
| `Auto-Tenant Fetch Wrapper` | Modify the frontend API fetch wrapper to auto-append tenant_id from session storage so all existing API calls get tenant scoping without per | `/Users/murali/.claude/skills/harvested/auto-tenant-fetch-wrapper/SKILL.md` |
| `Claude Code Permanent SSH Access to VPS` | Set up passwordless SSH key access so Claude Code can run remote commands on a VPS directly via Bash tool, without prompting for a password  | `/Users/murali/.claude/skills/harvested/claude-vps-ssh-access/SKILL.md` |
| `cloud-to-vps-http-bridge` | Lightweight Node.js HTTP bridge that lets a serverless cloud platform (Vercel, Railway, etc.) trigger actions on a self-hosted VPS service — | `/Users/murali/.claude/skills/harvested/cloud-to-vps-http-bridge/SKILL.md` |
| `Credential Survivorship Audit` | When a credentials-based failure recurs after a previous fix, the credential was only partially removed. Grep all config locations first, fi | `/Users/murali/.claude/skills/harvested/credential-survivorship-audit/SKILL.md` |
| `Dual LLM Provider Budget Defense` | Production budget-burn protection when running two LLM providers — per-user app-layer daily cap (not nginx per-IP), burst detection, provide | `/Users/murali/.claude/skills/harvested/dual-llm-provider-budget-defense/SKILL.md` |
| `Exhaustive Error Hunting — Never Stop at the First Fix` | When debugging a broken feature, NEVER assume the first error found is the only one. Systematically trace the entire data path and fix ALL b | `/Users/murali/.claude/skills/harvested/exhaustive-error-hunting/SKILL.md` |
| `Express Rate Limit Hardening` | Security fixes for express-rate-limit — never trust X-Forwarded-For in keyGenerator, handle IPv6, use validate options | `/Users/murali/.claude/skills/harvested/express-rate-limit-hardening/SKILL.md` |
| `Express Tenant Middleware Chain` | requireAuth → requireTenantAccess → route pattern with profile caching and role-based tenant resolution for multi-tenant Express apps | `/Users/murali/.claude/skills/harvested/express-tenant-middleware-chain/SKILL.md` |
| `Google OAuth COOP Popup Fix on Vercel` | Two-stage fix for Google OAuth popup blocked by Cross-Origin-Opener-Policy (COOP) on Vercel — first add permissive headers, then switch to c | `/Users/murali/.claude/skills/harvested/google-oauth-coop-vercel-fix/SKILL.md` |
| `Industrial Rollback Policy Pattern` | PLC batch write rollback with persistence, exponential retry, timeout, and real-time operator notifications via Socket.IO | `/Users/murali/.claude/skills/harvested/rollback-policy-pattern/SKILL.md` |
| `LLM Model Routing` | Regex-based classifier to route simple user queries to cheap models (Haiku) and complex ones to expensive models (Sonnet), with conservative | `/Users/murali/.claude/skills/harvested/llm-model-routing/SKILL.md` |
| `LLM Provider baseUrl + API-Type URL Construction Bug` | When a custom LLM provider's baseUrl already includes a version suffix and the gateway appends /v1/messages, you get /{version}/v1/messages  | `/Users/murali/.claude/skills/harvested/llm-provider-url-construction-bug/SKILL.md` |
| `LLM Vision Confidence Escalation Cascade` | Two-stage vision pipeline — cheap primary model on every request, expensive model only on low-confidence results. Cuts cost ~80% vs single-m | `/Users/murali/.claude/skills/harvested/llm-vision-confidence-escalation-cascade/SKILL.md` |
| `Multi-Channel Alert Gateway` | BaseChannel abstraction + severity-based routing + parallel delivery via Promise.allSettled + retry + delivery tracking table | `/Users/murali/.claude/skills/harvested/multi-channel-alert-gateway/SKILL.md` |
| `Multi-Tenant Audit Checklist` | Systematic methodology for finding multi-tenant data leaks — check every GET endpoint, AI context, external clients, and trace ownership cha | `/Users/murali/.claude/skills/harvested/multi-tenant-audit-checklist/SKILL.md` |
| `No Mock Data in Production SCADA/Multi-Modal Apps` | Eliminate hardcoded mock arrays in CRUD pages and backend demo-data fallbacks — every feature must use real API calls with database persiste | `/Users/murali/.claude/skills/harvested/no-mock-data-in-production/SKILL.md` |
| `No Unwired Placeholders — Wire Everything on First Pass` | Every button, link, and interactive element must have a working onClick/navigation handler from the moment it's created. Never leave placeho | `/Users/murali/.claude/skills/harvested/no-unwired-placeholders/SKILL.md` |
| `oauth-headless-ssh-tunnel` | Complete an OAuth2 browser flow on a headless Linux server by forwarding the redirect URI port via SSH tunnel — no browser, VNC, or public p | `/Users/murali/.claude/skills/harvested/oauth-headless-ssh-tunnel/SKILL.md` |
| `OpenClaw WhatsApp Echo Loop & LLM Quota Fix` | Stop infinite WhatsApp message loops caused by selfChatMode and quota-exceeded LLM keys in OpenClaw. Also covers zai/custom provider 404 bug | `/Users/murali/.claude/skills/harvested/openclaw-whatsapp-loop-fix/SKILL.md` |
| `openwrt-busybox-shell-scripting` | Practical shell scripting on OpenWrt/BusyBox edge devices (Teltonika TRB/RUT, GL.iNet, etc.). Covers what doesn't work (bash, jq, arrays) an | `/Users/murali/.claude/skills/harvested/openwrt-busybox-shell-scripting/SKILL.md` |
| `Pentest-Driven Architecture Review` | Validate architectural decisions against the most recent pentest report + a handful of targeted live probes — faster and more precise than r | `/Users/murali/.claude/skills/harvested/pentest-driven-architecture-review/SKILL.md` |
| `pgvector Multi-Tenant Retrieval` | Multi-tenant pgvector RAG pattern — enforce project/tenant isolation at the query layer with WHERE project_id = ANY($ids), never trust RLS w | `/Users/murali/.claude/skills/harvested/pgvector-multitenant-retrieval/SKILL.md` |
| `Placeholder Audit and Resolution Pattern` | Systematic scan for empty placeholders, disabled buttons, stub endpoints, dead files, and unmounted routes — then resolve each by either imp | `/Users/murali/.claude/skills/harvested/placeholder-audit-pattern/SKILL.md` |
| `Plan File Versioned Evolution` | How to evolve a committed roadmap document incrementally via targeted Edit calls, version-bump footers, and commit messages that explain WHY | `/Users/murali/.claude/skills/harvested/plan-file-versioned-evolution/SKILL.md` |
| `PLC Live Integration Test Infrastructure` | Software PLC simulators + test harness for validating SCADA protocol adapters with real TCP traffic instead of mocks | `/Users/murali/.claude/skills/harvested/plc-live-test-infrastructure/SKILL.md` |
| `PM2 Cluster Mode Breaks In-Memory SCADA State` | PM2 cluster mode causes polling engine, tag engine, and Socket.IO room subscriptions to split across workers — use single instance for SCADA | `/Users/murali/.claude/skills/harvested/pm2-cluster-scada-pitfall/SKILL.md` |
| `Prisma SQL Injection Defense` | Safe patterns for dynamic SQL with Prisma $queryRawUnsafe — allowlist maps instead of string interpolation for identifiers | `/Users/murali/.claude/skills/harvested/prisma-sql-injection-defense/SKILL.md` |
| `Process Log Tracing — Find Logs When Not Under Named Systemd Service` | When a process logs to systemd journal but isn't registered as a named service, journalctl -u <name> returns nothing. Trace via fd/1 socket  | `/Users/murali/.claude/skills/harvested/process-log-tracing/SKILL.md` |
| `Project Gate Pattern` | Enforce project selection before accessing project-scoped pages — gate at layout level, not per-page | `/Users/murali/.claude/skills/harvested/project-gate-pattern/SKILL.md` |
| `pull-based-remote-agent-architecture` | Remote shell execution on NAT-bound IoT/edge devices via cloud-polling agent. Device pulls commands from HTTPS API instead of accepting inbo | `/Users/murali/.claude/skills/harvested/pull-based-remote-agent-architecture/SKILL.md` |
| `React Error Object Rendering Guard` | Prevent React error #31 when API proxy/intermediary returns {code, message} objects instead of {error: string} — always coerce error state t | `/Users/murali/.claude/skills/harvested/react-error-object-guard/SKILL.md` |
| `ReactFlow Node Data Persistence` | Fix silent data loss in ReactFlow editors where elementsToNodes/nodesToElements serialization drops custom fields like tag bindings, animati | `/Users/murali/.claude/skills/harvested/reactflow-data-persistence/SKILL.md` |
| `SCADA Real-Time ReactFlow — Complete Debugging Case Study` | 12-issue chain that prevented live PLC tag values from updating ReactFlow HMI elements. Documents every failure point and the final working  | `/Users/murali/.claude/skills/harvested/scada-realtime-reactflow-debugging/SKILL.md` |
| `SCADA Screen Persistence Pattern` | HMI screens stored in Zustand must persist to database via API — loadScreens on mount, save on create/update/delete | `/Users/murali/.claude/skills/harvested/screen-persistence-pattern/SKILL.md` |
| `SCADA Tag Autocomplete Component` | Inline searchable dropdown for selecting PLC/SCADA tags scoped to the active project — fetches once, filters client-side | `/Users/murali/.claude/skills/harvested/scada-tag-autocomplete/SKILL.md` |
| `Screenshot-to-Root-Cause Error Diagnosis` | Decode minified React/production errors from browser screenshots — decode error URLs, trace stack traces, identify the actual component and  | `/Users/murali/.claude/skills/harvested/screenshot-error-diagnosis/SKILL.md` |
| `Socket.IO Room Subscription Chain` | Complete the subscribe chain — frontend store must emit subscribe event to server, server must join client to room, then room-scoped emit wo | `/Users/murali/.claude/skills/harvested/socketio-room-subscription-chain/SKILL.md` |
| `Split Auth Modal — Sign-In vs Sign-Up Mode` | Single AuthModal component with a `mode` prop that drives distinct UX flows — sign-in rejects new users, sign-up shows details form for new  | `/Users/murali/.claude/skills/harvested/split-auth-modal-signin-signup/SKILL.md` |
| `Supabase Tenant Filtering via Inner Joins` | Use !inner join + dot-notation filtering to scope Supabase queries through related tables for multi-tenant isolation | `/Users/murali/.claude/skills/harvested/supabase-tenant-filtering/SKILL.md` |
| `SVG Sanitization with DOMPurify` | Replace regex-based SVG sanitizers with DOMPurify SVG profile — regex is trivially bypassable | `/Users/murali/.claude/skills/harvested/svg-sanitization-dompurify/SKILL.md` |
| `Timezone-Aware Hourly Cron Fanout` | Run an hourly cron that uses Intl.DateTimeFormat to check each user's local hour — only deliver to users whose timezone hour matches the tar | `/Users/murali/.claude/skills/harvested/timezone-aware-cron-fanout/SKILL.md` |
| `Vercel Prebuilt Deploy Workaround` | When Vercel remote builds fail silently (empty error message), build locally with vercel build --prod then deploy with vercel deploy --prebu | `/Users/murali/.claude/skills/harvested/vercel-prebuilt-deploy/SKILL.md` |
| `Vite Environment URL Auto-Detection` | Frontend apps deployed to Vercel must auto-detect API/WebSocket URLs for production vs development — never default to localhost for both API | `/Users/murali/.claude/skills/harvested/vite-env-url-detection/SKILL.md` |
| `WhatsApp Instant Acknowledgment Before Slow Processing` | Send an immediate ack message to the user before kicking off a long-running operation (AI inference, email fetch, DB query). Prevents user t | `/Users/murali/.claude/skills/harvested/whatsapp-instant-ack/SKILL.md` |
| `WhatsApp Personalized Research Before Replying` | Before replying to any BNI member on WhatsApp, research their company, specialty, city, and prior conversation context. Never send generic r | `/Users/murali/.claude/skills/harvested/whatsapp-personalized-research/SKILL.md` |
| `WhatsApp Self-Chat Loop — Token Drain Diagnosis` | When LLM balance drains faster than expected on a WhatsApp bot, check for self-chat loop (bot replying to its own number) and oversized per- | `/Users/murali/.claude/skills/harvested/whatsapp-selfchat-token-drain/SKILL.md` |
| `Worker Read-Only DB Role Pattern` | Background workers (BullMQ, cron, etc.) should read operational data via a dedicated SELECT-only Postgres role with its own DATABASE_URL — n | `/Users/murali/.claude/skills/harvested/worker-readonly-db-role-pattern/SKILL.md` |
| `Z.AI (Zhipu GLM) Provider Config — OpenAI-Compatible Format` | Z.AI (bigmodel.cn / zhipuai.cn) uses OpenAI-compatible /chat/completions API. Setting api type to "anthropic-messages" appends /v1/messages  | `/Users/murali/.claude/skills/harvested/zai-openai-compatible-provider/SKILL.md` |
| `Zero Mock, Zero Fallback — Honest Data or Honest Error` | Enforce strict no-mock, no-fallback policy across frontend and backend. API failure shows error, empty data shows blank — never fake data, n | `/Users/murali/.claude/skills/harvested/zero-mock-zero-fallback/SKILL.md` |

_Catalog auto-regenerated on every Claude Code session start. Do not edit between the IRONBARK markers, manual edits outside the block are preserved._

<!-- IRONBARK:END -->