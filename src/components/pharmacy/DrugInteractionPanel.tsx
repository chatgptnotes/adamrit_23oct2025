// Click-triggered drug-interaction advisory panel. Given a set of medicines it
// runs the AI interaction check and renders severity-graded warnings.
// Display-only — it never blocks billing or dispensing.
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { checkDrugInteractions, InteractionReport } from '@/lib/drug-interactions';

interface DrugInteractionPanelProps {
  medicines: { name: string; generic?: string; strength?: string }[];
}

export const DrugInteractionPanel: React.FC<DrugInteractionPanelProps> = ({ medicines }) => {
  const [report, setReport] = useState<InteractionReport | null>(null);
  const [status, setStatus] = useState<'idle' | 'checking' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // De-dupe by lowercased medicine name.
  const uniqueMedicines = useMemo(() => {
    const seen = new Set<string>();
    const out: { name: string; generic?: string; strength?: string }[] = [];
    for (const m of medicines || []) {
      const key = (m?.name || '').trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(m);
    }
    return out;
  }, [medicines]);

  const runCheck = async () => {
    setStatus('checking');
    setError(null);
    try {
      const result = await checkDrugInteractions(uniqueMedicines);
      setReport(result);
      setStatus('done');
    } catch (err: any) {
      setStatus('error');
      setError(err?.message || 'Interaction check failed.');
    }
  };

  // Auto-run the check when the medicine set is available / changes — same as
  // the Pharmacy prescription modal. Advisory only; it never blocks any flow.
  const medicineKey = useMemo(
    () => uniqueMedicines.map((m) => (m.name || '').toLowerCase()).sort().join('|'),
    [uniqueMedicines]
  );
  useEffect(() => {
    if (uniqueMedicines.length > 0) runCheck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicineKey]);

  return (
    <div className="border rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <h4 className="font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          Drug Interaction Check
        </h4>
        <Button
          size="sm"
          variant="outline"
          onClick={runCheck}
          disabled={status === 'checking' || uniqueMedicines.length === 0}
        >
          {status === 'checking'
            ? 'Checking…'
            : status === 'done' || status === 'error'
              ? 'Re-check'
              : 'Check Drug Interactions'}
        </Button>
      </div>

      {uniqueMedicines.length === 0 && (
        <p className="text-sm text-muted-foreground">No prescription medicines to check.</p>
      )}
      {status === 'checking' && (
        <p className="text-sm text-muted-foreground">Analyzing medicines for interactions…</p>
      )}
      {status === 'error' && <p className="text-sm text-red-600">{error}</p>}
      {status === 'done' &&
        report &&
        (report.interactions.length === 0 ? (
          <p className="text-sm text-green-700">
            No significant interactions found among these medicines.
          </p>
        ) : (
          <div className="space-y-2">
            {report.interactions.map((ix, i) => {
              const sev = (ix.severity || 'minor').toLowerCase();
              const box =
                sev === 'major'
                  ? 'border-red-200 bg-red-50'
                  : sev === 'moderate'
                    ? 'border-amber-200 bg-amber-50'
                    : 'border-gray-200 bg-gray-50';
              const badge =
                sev === 'major'
                  ? 'bg-red-100 text-red-700 border-red-200'
                  : sev === 'moderate'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-gray-100 text-gray-700 border-gray-200';
              return (
                <div key={i} className={`border rounded p-2 ${box}`}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] uppercase ${badge}`}>{sev}</Badge>
                    <span className="font-medium text-sm">{(ix.drugs || []).join('  +  ')}</span>
                  </div>
                  {ix.effect && <p className="text-sm mt-1">{ix.effect}</p>}
                  {ix.recommendation && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Advice: {ix.recommendation}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}

      <p className="text-[11px] text-muted-foreground mt-2">
        ⚠️ AI-generated advisory — verify against a clinical drug-interaction reference. Does not
        block billing.
      </p>
    </div>
  );
};

export default DrugInteractionPanel;
