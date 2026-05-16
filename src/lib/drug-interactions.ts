// AI drug-drug interaction advisory. Given the medicines on a prescription,
// asks Gemini to flag clinically significant interactions. This is an ADVISORY
// aid only — it must be verified against a clinical reference and never blocks
// dispensing.
import { geminiGenerateContentUrl, geminiFetch } from './gemini';

export interface DrugInteraction {
  drugs: string[];
  severity: 'major' | 'moderate' | 'minor';
  effect: string;
  recommendation: string;
}

export interface InteractionReport {
  interactions: DrugInteraction[];
  summary: string;
  generatedAt: string; // ISO timestamp
}

export async function checkDrugInteractions(
  medicines: { name: string; generic?: string; strength?: string }[]
): Promise<InteractionReport> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error(
      'Gemini API key is not configured. Add VITE_GEMINI_API_KEY to .env and restart the dev server.'
    );
  }

  const list = medicines
    .filter((m) => (m.name || '').trim())
    .map((m, i) => {
      const extra = [m.generic && `generic: ${m.generic}`, m.strength && `details: ${m.strength}`]
        .filter(Boolean)
        .join('; ');
      return `${i + 1}. ${m.name}${extra ? ` (${extra})` : ''}`;
    })
    .join('\n');

  const prompt = `You are a clinical pharmacology assistant. The following medicines are prescribed together for ONE patient:

${list}

Identify clinically significant DRUG-DRUG INTERACTIONS that occur when these medicines are taken together.
Rules:
- Report ONLY well-established, clinically recognised interactions. Do not speculate or invent.
- For each interaction provide: the interacting medicines, a severity, the effect on the patient, and a short recommendation.
- "severity" MUST be exactly one of: "major", "moderate", "minor".
- If there are no significant interactions, return an empty "interactions" array.
Respond with ONLY valid JSON (no markdown, no commentary) in EXACTLY this shape:
{"interactions":[{"drugs":["Medicine A","Medicine B"],"severity":"major","effect":"what happens","recommendation":"what to do"}],"summary":"one-line overall summary"}`;

  const res = await geminiFetch(geminiGenerateContentUrl(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 1500 },
    }),
  });

  const data = await res.json();
  const text: string = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error('The interaction check returned an unexpected response. Please re-check.');
  }

  const parsed = JSON.parse(match[0]);
  const interactions: DrugInteraction[] = Array.isArray(parsed.interactions)
    ? parsed.interactions
        .filter((x: any) => x && Array.isArray(x.drugs))
        .map((x: any) => {
          const sev = String(x.severity || '').toLowerCase();
          return {
            drugs: x.drugs.map((d: any) => String(d)),
            severity: (['major', 'moderate', 'minor'].includes(sev)
              ? sev
              : 'moderate') as DrugInteraction['severity'],
            effect: String(x.effect || ''),
            recommendation: String(x.recommendation || ''),
          };
        })
    : [];

  return {
    interactions,
    summary: String(parsed.summary || ''),
    generatedAt: new Date().toISOString(),
  };
}
