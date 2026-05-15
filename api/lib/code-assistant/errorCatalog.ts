// Single source of truth for error titles + messages + hints.
// Server uses this for HTTP responses; frontend imports the same catalog
// (mirrored in src/lib/code-assistant/errorCatalog.ts) for UI consistency.
//
// See: bettroi-vault/Adamrit/Super-Admin-Code-Assistant-Plan.md §10

export type ErrorEntry = {
  title: string;
  message: string;          // {placeholders} are replaced by responses.ts
  hint?: string;
};

export const errorCatalog = {
  // ─── Field validation ─────────────────────────────────────────────────
  'prompt-required':       { title: 'Prompt is empty', message: 'Please describe what you want to change.', hint: 'Type your request in the prompt field.' },
  'prompt-whitespace':     { title: 'Prompt is empty', message: 'Please describe what you want to change (whitespace only).', hint: 'Type your request in the prompt field.' },
  'prompt-too-short':      { title: 'Prompt too short', message: 'Tell us a bit more — at least 5 characters.', hint: 'Be more specific about the change.' },
  'prompt-too-long':       { title: 'Prompt too long', message: 'Prompt is {n} / 10,000 characters.', hint: 'Shorten the prompt or attach a file.' },
  'too-many-files':        { title: 'Too many attached files', message: 'You can attach up to 5 files.', hint: 'Remove a file to add another.' },
  'file-not-in-allowlist': { title: 'File not editable', message: 'This file is locked and cannot be edited: {path}.', hint: 'Pick a different file.' },
  'file-in-locklist':      { title: 'Locked file refused', message: '{path} is feature-frozen and cannot be edited.', hint: 'Describe the desired behavior and ask DeepSeek to create a NEW file.' },
  'file-not-found':        { title: 'File not found', message: '{path} does not exist in the codebase.', hint: 'Re-attach an existing file.' },

  // ─── Auth + rate limits ───────────────────────────────────────────────
  'not-superadmin':        { title: 'Permission denied', message: 'Only super-admin can use this tool.', hint: 'Ask the owner to elevate your role.' },
  'rate-limit-prompts':    { title: 'Hourly limit reached', message: "You've made 20 prompts this hour.", hint: 'Wait or contact the owner.' },
  'rate-limit-cost-daily': { title: 'Daily cost cap reached', message: "Today's DeepSeek spend has hit the cap.", hint: 'Wait until tomorrow.' },
  'rate-limit-cost-monthly': { title: 'Monthly cost cap reached', message: "This month's DeepSeek spend has hit the cap.", hint: 'Contact the owner to raise the cap.' },

  // ─── Backend config ───────────────────────────────────────────────────
  'missing-api-key':       { title: 'DeepSeek not configured', message: 'DEEPSEEK_API_KEY is not set in Vercel env vars.', hint: 'Add the env var in Vercel, then redeploy.' },
  'missing-github-token':  { title: 'GitHub not connected', message: 'GITHUB_TOKEN is not set in Vercel env vars.', hint: 'Add a PAT with repo scope.' },
  'missing-vercel-token':  { title: 'Vercel not connected', message: 'VERCEL_API_TOKEN is not set.', hint: 'Add a Vercel token.' },

  // ─── Context / DeepSeek ───────────────────────────────────────────────
  'context-too-large':     { title: 'Too much context', message: 'Attached files exceed the budget.', hint: 'Attach fewer or smaller files.' },
  'deepseek-auth-failed':  { title: 'DeepSeek auth failed (401)', message: 'DeepSeek rejected the API key.', hint: 'Generate a new key at platform.deepseek.com.' },
  'deepseek-rate-limit':   { title: 'DeepSeek rate-limited (429)', message: 'DeepSeek throttled the request.', hint: 'Wait 60s and retry.' },
  'deepseek-timeout':      { title: 'DeepSeek timeout', message: "DeepSeek didn't respond within 90s.", hint: 'Try a simpler prompt.' },
  'deepseek-server-error': { title: 'DeepSeek server error', message: 'DeepSeek returned a server error.', hint: 'Retry; check status.deepseek.com.' },
  'deepseek-content-filter': { title: 'Prompt rejected', message: 'DeepSeek refused the request (content filter).', hint: 'Rephrase.' },
  'deepseek-network-error': { title: 'Network error', message: "Couldn't reach api.deepseek.com.", hint: 'Check internet.' },
  'deepseek-unknown':      { title: 'DeepSeek error', message: 'Unknown error from DeepSeek.', hint: 'Retry.' },

  // ─── Response parsing / validation ────────────────────────────────────
  'malformed-response':    { title: "Couldn't parse DeepSeek's response", message: "Reply wasn't valid JSON in the expected shape.", hint: 'Click "Show details"; retry.' },
  'empty-changeset':       { title: 'No code changes proposed', message: 'DeepSeek decided no files needed editing. See the plan.', hint: 'Refine the prompt.' },
  'syntax-error':          { title: 'Generated code has syntax errors', message: 'Code for {path} does not parse: {parser_error}.', hint: 'Rephrase the prompt.' },

  // ─── GitHub ───────────────────────────────────────────────────────────
  'github-auth-failed':    { title: 'GitHub auth failed', message: 'GitHub rejected the token.', hint: 'Check GITHUB_TOKEN scope.' },
  'github-rate-limit':     { title: 'GitHub rate limit', message: 'GitHub API rate limit hit.', hint: 'Wait a few minutes.' },
  'github-network-error':  { title: 'GitHub unreachable', message: "Couldn't reach api.github.com.", hint: 'Check internet.' },
  'github-conflict':       { title: 'Branch name collision', message: 'Branch already exists.', hint: 'Click "Generate Code" again.' },
  'github-unknown':        { title: 'GitHub error', message: 'Unknown GitHub error.', hint: 'Retry.' },

  // ─── Vercel ───────────────────────────────────────────────────────────
  'vercel-build-failed':   { title: 'Preview build failed', message: 'Vercel build failed.', hint: 'Open the build log; iterate or revert.' },
  'vercel-build-timeout':  { title: 'Build still running', message: 'Build has been running 5+ minutes.', hint: 'Refresh.' },
  'vercel-network-error':  { title: "Couldn't reach Vercel", message: 'Failed to poll preview status.', hint: 'Retry.' },

  'unknown-error':         { title: 'Something went wrong', message: 'Unexpected error: {message}.', hint: 'Copy details, contact owner.' },
} satisfies Record<string, ErrorEntry>;

export type ErrorCode = keyof typeof errorCatalog;
