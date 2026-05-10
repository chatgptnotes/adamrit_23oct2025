import React, { useState, useEffect, useCallback } from 'react';
import { supabaseClient } from '@/utils/supabase-client';
import { PurchaseOrderService } from '@/lib/purchase-order-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Brain, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

// Feature flag gate — component is invisible when flag is not 'true'
const BRAIN_ENABLED = import.meta.env.VITE_BRAIN_PHARMACY === 'true';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface POSuggestion {
  id: number;
  run_id: string;
  medicine_id: string;
  medicine_name: string;
  on_hand: number;
  avg_daily_sales: number;
  days_of_cover: number;
  suggested_qty: number;
  supplier: string | null;
  expected_stockout: string | null;
  confidence: number;
  rationale: string;
  status: string;
  promoted_to_po_id: string | null;
  created_at: string;
}

interface ThresholdRecommendation {
  id: number;
  medicine_id: string;
  medicine_name: string;
  current_min_level: number;
  observed_avg_daily: number;
  observation_window_days: number;
  recommended_min_level: number;
  direction: 'increase' | 'decrease' | 'keep';
  confidence: number;
  rationale: string;
  status: string;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const AIReorderTab: React.FC = () => {
  if (!BRAIN_ENABLED) return null;

  const [suggestions, setSuggestions] = useState<POSuggestion[]>([]);
  const [thresholds, setThresholds] = useState<ThresholdRecommendation[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: sug, error: sugErr }, { data: thr, error: thrErr }] = await Promise.all([
        supabaseClient
          .from('agent_po_suggestions')
          .select('*')
          .eq('status', 'pending')
          .order('days_of_cover', { ascending: true })
          .limit(100),
        supabaseClient
          .from('agent_threshold_recommendations')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);
      if (sugErr) throw sugErr;
      if (thrErr) throw thrErr;
      setSuggestions(sug ?? []);
      setThresholds(thr ?? []);
      setSelected(new Set());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load AI suggestions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // -------------------------------------------------------------------------
  // Toggle checkbox
  // -------------------------------------------------------------------------
  const toggleRow = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === suggestions.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(suggestions.map((s) => s.id)));
    }
  };

  // -------------------------------------------------------------------------
  // Generate POs from selected suggestions
  // -------------------------------------------------------------------------
  const generatePOs = async () => {
    if (selected.size === 0) return;
    setPromoting(true);
    setError(null);
    setSuccessMsg(null);

    const rows = suggestions.filter((s) => selected.has(s.id));

    // Group by supplier (null supplier goes into its own group keyed '')
    const bySupplier: Record<string, POSuggestion[]> = {};
    for (const row of rows) {
      const key = row.supplier ?? '';
      if (!bySupplier[key]) bySupplier[key] = [];
      bySupplier[key].push(row);
    }

    let created = 0;
    let failed = 0;

    for (const [supplier, items] of Object.entries(bySupplier)) {
      try {
        const poNumber = await PurchaseOrderService.generatePONumber();
        const po = await PurchaseOrderService.create({
          po_number: poNumber,
          order_date: new Date().toISOString().slice(0, 10),
          status: 'PENDING',
          notes:
            `Auto-generated from AI Reorder Brain (run_id: ${items[0].run_id}). ` +
            `Items: ${items.map((i) => i.medicine_name).join(', ')}.`,
          ...(supplier ? { order_for: supplier } : {}),
        });

        // Mark each suggestion as promoted
        const ids = items.map((i) => i.id);
        await supabaseClient
          .from('agent_po_suggestions')
          .update({ status: 'promoted', promoted_to_po_id: po.id })
          .in('id', ids);

        created++;
      } catch (e: unknown) {
        console.error('PO creation failed for supplier group', supplier, e);
        failed++;
      }
    }

    setPromoting(false);
    if (failed === 0) {
      setSuccessMsg(`${created} purchase order(s) created successfully.`);
    } else {
      setError(`${created} PO(s) created, ${failed} failed. Check console for details.`);
    }
    await load();
  };

  // -------------------------------------------------------------------------
  // Threshold actions (Accept / Reject — do NOT update medicines table)
  // -------------------------------------------------------------------------
  const updateThreshold = async (id: number, status: 'accepted' | 'rejected') => {
    try {
      const { error: e } = await supabaseClient
        .from('agent_threshold_recommendations')
        .update({ status })
        .eq('id', id);
      if (e) throw e;
      setThresholds((prev) => prev.filter((r) => r.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update recommendation');
    }
  };

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------
  const directionBadge = (dir: string) => {
    if (dir === 'increase') return <Badge className="bg-orange-100 text-orange-800">↑ Increase</Badge>;
    if (dir === 'decrease') return <Badge className="bg-blue-100 text-blue-800">↓ Decrease</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">= Keep</Badge>;
  };

  const confidencePct = (c: number) => `${Math.round(c * 100)}%`;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          <h2 className="text-xl font-semibold">AI Reorder Brain</h2>
          <Badge className="bg-purple-100 text-purple-800 text-xs">v1 · Deterministic</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Reorder Suggestions                                      */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Reorder Suggestions
              {suggestions.length > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({suggestions.length} pending)
                </span>
              )}
            </CardTitle>
            <Button
              size="sm"
              disabled={selected.size === 0 || promoting}
              onClick={generatePOs}
            >
              {promoting ? 'Creating POs…' : `Generate POs from selected (${selected.size})`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No pending reorder suggestions. Run the AI agent to generate new ones.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3">
                      <input
                        type="checkbox"
                        checked={selected.size === suggestions.length && suggestions.length > 0}
                        onChange={toggleAll}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="pb-2 pr-3">Medicine</th>
                    <th className="pb-2 pr-3 text-right">On Hand</th>
                    <th className="pb-2 pr-3 text-right">Avg Daily</th>
                    <th className="pb-2 pr-3 text-right">Days Cover</th>
                    <th className="pb-2 pr-3 text-right">Suggest Qty</th>
                    <th className="pb-2 pr-3">Stockout</th>
                    <th className="pb-2 pr-3 text-right">Confidence</th>
                    <th className="pb-2">Rationale</th>
                  </tr>
                </thead>
                <tbody>
                  {suggestions.map((s) => (
                    <tr
                      key={s.id}
                      className={`border-b hover:bg-gray-50 ${selected.has(s.id) ? 'bg-purple-50' : ''}`}
                    >
                      <td className="py-2 pr-3">
                        <input
                          type="checkbox"
                          checked={selected.has(s.id)}
                          onChange={() => toggleRow(s.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      <td className="py-2 pr-3 font-medium">{s.medicine_name}</td>
                      <td className="py-2 pr-3 text-right">{s.on_hand}</td>
                      <td className="py-2 pr-3 text-right">{s.avg_daily_sales.toFixed(1)}</td>
                      <td className="py-2 pr-3 text-right">
                        <span
                          className={
                            s.days_of_cover < 7
                              ? 'text-red-600 font-semibold'
                              : s.days_of_cover < 14
                              ? 'text-orange-600 font-semibold'
                              : ''
                          }
                        >
                          {s.days_of_cover.toFixed(1)}d
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right font-semibold">{s.suggested_qty}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground">
                        {s.expected_stockout ?? '—'}
                      </td>
                      <td className="py-2 pr-3 text-right">{confidencePct(s.confidence)}</td>
                      <td className="py-2 text-xs text-muted-foreground max-w-xs truncate" title={s.rationale}>
                        {s.rationale}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Threshold Recommendations                                */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Threshold Recommendations
            {thresholds.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({thresholds.length} pending review)
              </span>
            )}
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Accepting a recommendation does NOT change <code>minimum_stock_level</code> automatically.
            A separate manual review step is required.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
          ) : thresholds.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No pending threshold recommendations.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 pr-3">Medicine</th>
                    <th className="pb-2 pr-3 text-right">Current Min</th>
                    <th className="pb-2 pr-3 text-right">Avg Daily</th>
                    <th className="pb-2 pr-3 text-right">Recommended Min</th>
                    <th className="pb-2 pr-3">Direction</th>
                    <th className="pb-2 pr-3 text-right">Confidence</th>
                    <th className="pb-2 pr-3">Rationale</th>
                    <th className="pb-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {thresholds.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 pr-3 font-medium">{r.medicine_name}</td>
                      <td className="py-2 pr-3 text-right">{r.current_min_level}</td>
                      <td className="py-2 pr-3 text-right">{r.observed_avg_daily.toFixed(1)}</td>
                      <td className="py-2 pr-3 text-right font-semibold">{r.recommended_min_level}</td>
                      <td className="py-2 pr-3">{directionBadge(r.direction)}</td>
                      <td className="py-2 pr-3 text-right">{confidencePct(r.confidence)}</td>
                      <td className="py-2 pr-3 text-xs text-muted-foreground max-w-xs truncate" title={r.rationale}>
                        {r.rationale}
                      </td>
                      <td className="py-2 text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-green-700 border-green-300 hover:bg-green-50"
                            onClick={() => updateThreshold(r.id, 'accepted')}
                          >
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => updateThreshold(r.id, 'rejected')}
                          >
                            <XCircle className="h-3 w-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIReorderTab;
