// Gemini models, tiered by capability/cost. Route each call to the cheapest
// model that can do the job — this is the single biggest token-cost lever.
//
//  - GEMINI_MODEL       (flash):      vision/OCR, clinical, long-form generation
//  - GEMINI_MODEL_LITE  (flash-lite): plain text -> JSON extraction, low-stakes
//
// `gemini-2.0-flash` was retired for new API keys (April 2026), causing 404s
// at every call site that hardcoded it — bump here when a model is retired.
export const GEMINI_MODEL = 'gemini-2.5-flash';
export const GEMINI_MODEL_LITE = 'gemini-2.5-flash-lite';

export const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export function geminiGenerateContentUrl(
  apiKey: string,
  model: string = GEMINI_MODEL,
): string {
  return `${GEMINI_API_BASE}/models/${model}:generateContent?key=${apiKey}`;
}

// HTTP statuses where retrying on the lighter model can succeed: quota
// exhaustion (429), model unavailability/retirement (404), and transient
// server errors (500/502/503). Auth (401/403) and malformed-request (400)
// errors are NOT retried — flash-lite would fail identically.
const FALLBACK_STATUSES = new Set([404, 429, 500, 502, 503]);

function withModel(url: string, model: string): string {
  return url.replace(/\/models\/[^:]+:generateContent/, `/models/${model}:generateContent`);
}

// Core request with seamless model degradation. When a call targets the
// primary (flash) model and fails for a transient/quota/availability reason,
// the identical request is retried on flash-lite — which has separate quota
// and stays available — so OCR/extraction/generation keeps working instead of
// surfacing a hard error to the user. Calls already on flash-lite are not
// retried (nothing cheaper to fall back to). Returns whichever Response the
// caller should handle: the successful flash-lite Response, or the original
// failed Response so existing `res.ok` checks still see a meaningful status.
// Never throws on HTTP errors — it is a drop-in replacement for `fetch`.
export async function geminiGenerateContent(url: string, init: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (res.ok) return res;

  const targetsPrimary = url.includes(`/models/${GEMINI_MODEL}:`);
  if (targetsPrimary && FALLBACK_STATUSES.has(res.status)) {
    // `init.body` is a JSON string here, so the same init is safely reusable.
    const liteRes = await fetch(withModel(url, GEMINI_MODEL_LITE), init);
    if (liteRes.ok) return liteRes;
  }
  return res;
}

// Fetch wrapper that surfaces the API's actual error body in the thrown
// Error message. Without this, model retirements / quota / auth failures
// surface only as "Gemini API error: 404" with no diagnostic context.
// Routes through geminiGenerateContent so flash failures seamlessly fall back
// to flash-lite before any error is thrown.
export async function geminiFetch(url: string, init: RequestInit): Promise<Response> {
  const res = await geminiGenerateContent(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${body || res.statusText}`);
  }
  return res;
}
