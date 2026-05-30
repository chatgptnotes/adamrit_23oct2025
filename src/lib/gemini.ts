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

// Fetch wrapper that surfaces the API's actual error body in the thrown
// Error message. Without this, model retirements / quota / auth failures
// surface only as "Gemini API error: 404" with no diagnostic context.
export async function geminiFetch(url: string, init: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gemini API error ${res.status}: ${body || res.statusText}`);
  }
  return res;
}
