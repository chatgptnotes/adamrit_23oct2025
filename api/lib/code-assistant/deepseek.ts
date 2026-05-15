// DeepSeek client wrapper. OpenAI-compatible API.
// See: bettroi-vault/Adamrit/Super-Admin-Code-Assistant-Plan.md §10 (system prompt) and §24.1

import OpenAI from 'openai';

export class AIError extends Error {
  constructor(public code: string, public details?: unknown) {
    super(code);
  }
}

export type ContextFile = { path: string; content: string };

export type AIResult = {
  plan: string;
  files: Array<{ path: string; action: 'modify' | 'create'; content: string }>;
  warnings: string[];
  request_tokens: number;
  response_tokens: number;
  cost_usd: number;
  provider: 'deepseek';
};

const SYSTEM_PROMPT = `You are a senior React + TypeScript developer assisting a super-admin of
Adamrit, a hospital management system. The admin describes a change in
natural language; you return precise code edits as structured JSON.

## Adamrit stack

- React 18 (function components, hooks)
- TypeScript strict
- Vite 5
- shadcn-ui (Radix primitives) for components
- Tailwind CSS for styling (NO styled-components, CSS-in-JS, SCSS)
- React Router v6 (BrowserRouter)
- @tanstack/react-query for server state
- react-hook-form + Zod for forms
- Supabase client from \`src/integrations/supabase/client.ts\`

## File layout

- src/pages/*.tsx                 — route components
- src/components/**/*.tsx         — reusable UI
- src/hooks/*.ts                  — data + state hooks
- src/lib/*.ts                    — utilities
- src/services/*.ts               — business-logic wrappers
- src/queries/*.ts                — react-query wrappers
- src/utils/*.ts                  — helpers
- src/contexts/*.tsx              — providers

## Conventions

- Pages are routed in \`src/components/AppRoutes.tsx\`. New page → also add a Route.
- Sidebar is \`src/components/AppSidebar.tsx\`. Navigable page → add menu entry.
- Use shadcn-ui (\`Button\`, \`Card\`, \`Dialog\`, \`Input\`, etc.) — never roll your own.
- For data: \`useQuery\` from \`@tanstack/react-query\`; don't use raw \`useEffect\` for fetching.
- Never bypass RLS — use the Supabase client.

## Files you MAY edit

src/pages/*.tsx (except locklist), src/components/**, src/hooks/*.ts, src/services/*.ts,
src/queries/*.ts, src/utils/*.ts, src/lib/*.ts (except locklist), src/contexts/*.tsx

## Files you MUST NOT edit (return files: [] and explain)

src/pages/FinalBill.tsx, FinalBillTest.tsx, EditFinalBill.tsx, FinalBill.tsx.backup,
src/pages/FinancialSummary.tsx, FinancialSummary-backup.tsx,
src/lib/permissions.ts, src/lib/ruleEngine.ts, src/lib/sandbox.*, src/lib/code-assistant/**,
src/integrations/supabase/types.ts, .github/**, supabase/migrations/**, scripts/**,
package.json, vite.config.ts, tsconfig.json, tailwind.config.ts, postcss.config.js

If the request needs a locked file: explain in \`plan\` and return \`files: []\`.

## Output format

Respond with exactly one fenced JSON code block — no prose before or after:

\`\`\`json
{
  "plan": "<2-5 paragraph markdown — what you'll change and why>",
  "files": [
    {
      "path": "<repo-relative path>",
      "action": "modify" | "create",
      "content": "<FULL new file content; not a diff>"
    }
  ],
  "warnings": ["<optional caveats>"]
}
\`\`\`

Rules:
- Return FULL new content per file (not a diff).
- Include all imports.
- Don't reference files or symbols that don't exist.
- Don't add npm dependencies — only use existing.
- Max 5 files per response.
- If ambiguous: ask in \`plan\`, return \`files: []\`.
`;

function getClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY ?? '';
  if (!apiKey) throw new AIError('missing-api-key');
  return new OpenAI({
    baseURL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com/v1',
    apiKey,
    timeout: parseInt(process.env.DEEPSEEK_TIMEOUT_MS ?? '90000', 10),
  });
}

export async function callDeepSeek(prompt: string, contextFiles: ContextFile[]): Promise<AIResult> {
  const client = getClient();
  const userMessage = buildUserMessage(prompt, contextFiles);

  let completion;
  try {
    completion = await client.chat.completions.create({
      model: process.env.DEEPSEEK_MODEL ?? 'deepseek-coder',
      temperature: 0.2,
      max_tokens: 8000,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    });
  } catch (e: any) {
    throw mapDeepSeekError(e);
  }

  const raw = completion.choices[0]?.message?.content ?? '';
  const parsed = parseJsonBlock(raw);

  return {
    plan: parsed.plan,
    files: parsed.files,
    warnings: parsed.warnings ?? [],
    request_tokens: completion.usage?.prompt_tokens ?? 0,
    response_tokens: completion.usage?.completion_tokens ?? 0,
    cost_usd: estimateCost(completion.usage),
    provider: 'deepseek',
  };
}

function mapDeepSeekError(e: any): AIError {
  if (e.status === 401) return new AIError('deepseek-auth-failed', { message: e.message });
  if (e.status === 429) return new AIError('deepseek-rate-limit', { message: e.message });
  if (e.status === 400 && /content/i.test(e.message ?? '')) {
    return new AIError('deepseek-content-filter', { message: e.message });
  }
  if (e.status >= 500) return new AIError('deepseek-server-error', { message: e.message });
  if (e.code === 'ETIMEDOUT' || e.name === 'AbortError') return new AIError('deepseek-timeout', { message: e.message });
  if (e.code === 'ECONNREFUSED' || e.code === 'ENOTFOUND') return new AIError('deepseek-network-error', { message: e.message });
  return new AIError('deepseek-unknown', { message: e.message, status: e.status });
}

function buildUserMessage(prompt: string, files: ContextFile[]): string {
  const filesBlock = files.length === 0
    ? '(no files attached)'
    : files.map(f => `--- ${f.path} ---\n${f.content}`).join('\n\n');
  return `The super-admin wants the following change:\n\n<<<\n${prompt}\n>>>\n\nRelevant files:\n${filesBlock}\n\nRespond with the JSON block as specified.`;
}

function parseJsonBlock(raw: string): { plan: string; files: any[]; warnings?: string[] } {
  const match = raw.match(/```json\s*([\s\S]+?)```/) ?? raw.match(/(\{[\s\S]+\})/);
  if (!match) throw new AIError('malformed-response', { raw });
  try {
    const parsed = JSON.parse(match[1]);
    if (typeof parsed.plan !== 'string' || !Array.isArray(parsed.files)) {
      throw new AIError('malformed-response', { raw, parsed });
    }
    return parsed;
  } catch (e) {
    throw new AIError('malformed-response', { raw, parseErr: String(e) });
  }
}

function estimateCost(usage: { prompt_tokens?: number; completion_tokens?: number } | undefined): number {
  const inT = usage?.prompt_tokens ?? 0;
  const outT = usage?.completion_tokens ?? 0;
  // deepseek-coder pricing approx (USD per token)
  return inT * 0.14e-6 + outT * 0.28e-6;
}
