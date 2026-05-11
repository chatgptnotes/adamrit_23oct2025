// Default Gemini model used across the app. Bump here when a model is retired.
// `gemini-2.0-flash` was retired for new API keys (April 2026), causing 404s
// at every call site that hardcoded it.
export const GEMINI_MODEL = 'gemini-2.5-flash';

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
