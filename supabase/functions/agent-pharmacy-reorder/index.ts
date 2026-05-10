import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const MAX_SUGGESTIONS = 50;
const REORDER_WINDOW_DAYS = 14;       // suggest if days_of_cover < this
const ANALYSIS_WINDOW_DAYS = 90;      // sales lookback for avg daily calc
const THRESHOLD_WINDOW_DAYS = 14;     // consumption window for threshold rec
const IDEMPOTENCY_WINDOW_DAYS = 7;    // skip if live suggestion exists in this window
const DEFAULT_LEAD_TIME_DAYS = 7;     // assumed supplier lead time when unknown
const MAX_SUGGESTED_QTY_MULTIPLE = 4; // cap: supplier_moq × 4
const MAX_ONHAND_MULTIPLE = 10;       // cap: current_stock × 10
const CONTROLLED_SCHEDULES = ['H', 'H1', 'X'];
const AGENT_SLUG = 'pharmacy-reorder-v1';

// ---------------------------------------------------------------------------
// SHA-256 helper (no raw PHI stored, just counts)
// ---------------------------------------------------------------------------
async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const runId = crypto.randomUUID();
  const now = new Date();
  let errorMessage: string | null = null;
  let suggestionCount = 0;
  let recommendationCount = 0;
  let medicineCount = 0;
  const controlledNotes: string[] = [];

  try {
    // -----------------------------------------------------------------------
    // a. Load all active medicines + aggregated current_stock
    // -----------------------------------------------------------------------
    const { data: medicines, error: medErr } = await supabase
      .from('medicines')
      .select(
        'id, medicine_name, schedule_type, controlled_substance, ' +
        'minimum_stock_level, pack_size, is_active'
      )
      .eq('is_active', true);

    if (medErr) throw new Error(`medicines fetch: ${medErr.message}`);

    // Aggregate inventory: sum current_stock per medicine_id
    const { data: invRows, error: invErr } = await supabase
      .from('medicine_inventory')
      .select('medicine_id, current_stock')
      .eq('is_active', true);

    if (invErr) throw new Error(`inventory fetch: ${invErr.message}`);

    const stockMap: Record<string, number> = {};
    for (const row of invRows ?? []) {
      stockMap[row.medicine_id] = (stockMap[row.medicine_id] ?? 0) + (row.current_stock ?? 0);
    }

    // -----------------------------------------------------------------------
    // b. Aggregate medicine_sale_items for last 90 days
    // -----------------------------------------------------------------------
    const ninetyDaysAgo = new Date(now.getTime() - ANALYSIS_WINDOW_DAYS * 86400_000)
      .toISOString()
      .slice(0, 10);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400_000)
      .toISOString()
      .slice(0, 10);

    // Join medicine_sale_items → medicine_sales for the sale_date filter
    const { data: saleItems, error: saleErr } = await supabase
      .from('medicine_sale_items')
      .select('medicine_id, quantity_sold, medicine_sales!inner(sale_date)')
      .gte('medicine_sales.sale_date', ninetyDaysAgo);

    if (saleErr) throw new Error(`sale_items fetch: ${saleErr.message}`);

    type SalesAgg = { total90: number; total30: number; distinctDays: Set<string> };
    const salesMap: Record<string, SalesAgg> = {};

    for (const item of saleItems ?? []) {
      const saleDate = (item.medicine_sales as any)?.sale_date?.slice(0, 10) ?? '';
      if (!salesMap[item.medicine_id]) {
        salesMap[item.medicine_id] = { total90: 0, total30: 0, distinctDays: new Set() };
      }
      salesMap[item.medicine_id].total90 += item.quantity_sold ?? 0;
      salesMap[item.medicine_id].distinctDays.add(saleDate);
      if (saleDate >= thirtyDaysAgo) {
        salesMap[item.medicine_id].total30 += item.quantity_sold ?? 0;
      }
    }

    // -----------------------------------------------------------------------
    // c. Idempotency: fetch existing live suggestions (last 7 days, not rejected)
    // -----------------------------------------------------------------------
    const sevenDaysAgo = new Date(now.getTime() - IDEMPOTENCY_WINDOW_DAYS * 86400_000).toISOString();
    const { data: existingSuggestions, error: existErr } = await supabase
      .from('agent_po_suggestions')
      .select('medicine_id')
      .gte('created_at', sevenDaysAgo)
      .neq('status', 'rejected');

    if (existErr) throw new Error(`idempotency check: ${existErr.message}`);
    const alreadySuggestedIds = new Set((existingSuggestions ?? []).map((r: any) => r.medicine_id));

    // -----------------------------------------------------------------------
    // d. Build suggestion candidates
    // -----------------------------------------------------------------------
    type SuggestionRow = {
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
    };

    type ThresholdRow = {
      run_id: string;
      medicine_id: string;
      medicine_name: string;
      current_min_level: number;
      observed_avg_daily: number;
      observation_window_days: number;
      recommended_min_level: number;
      direction: string;
      confidence: number;
      rationale: string;
      status: string;
    };

    const suggestions: SuggestionRow[] = [];
    const thresholds: ThresholdRow[] = [];
    type ScoredSuggestion = SuggestionRow & { risk_score: number };
    const scored: ScoredSuggestion[] = [];

    medicineCount = (medicines ?? []).length;

    for (const med of medicines ?? []) {
      // d-1. Controlled / scheduled — skip to notes
      const isControlled =
        med.controlled_substance === true ||
        CONTROLLED_SCHEDULES.includes(med.schedule_type ?? '');
      if (isControlled) {
        controlledNotes.push(
          `${med.medicine_name} (${med.schedule_type ?? 'controlled'}) — excluded from auto-suggestion`
        );
        continue;
      }

      const agg = salesMap[med.id];

      // d-2. Skip medicines with 0 sales in last 30 days
      if (!agg || agg.total30 === 0) continue;

      const onHand = stockMap[med.id] ?? 0;
      const avgDailySales90 = agg.total90 / ANALYSIS_WINDOW_DAYS;
      const daysOfCover = avgDailySales90 > 0 ? onHand / avgDailySales90 : 999;
      const packSize = med.pack_size ?? 1;
      const minStockLevel = med.minimum_stock_level ?? 10;

      // d-3. Threshold recommendation (14-day window)
      const avgDaily14 = avgDailySales90; // same rate, 14-day window label
      const expectedConsumption14 = avgDaily14 * THRESHOLD_WINDOW_DAYS;
      let threshDirection: 'increase' | 'decrease' | 'keep' = 'keep';
      let threshRationale = '';
      let threshRecommended = minStockLevel;
      let threshConfidence = 0.7;

      if (expectedConsumption14 > minStockLevel * 2) {
        threshDirection = 'increase';
        threshRecommended = Math.ceil(expectedConsumption14 * 1.5);
        threshRationale =
          `14-day expected consumption (${expectedConsumption14.toFixed(0)} units) is more than ` +
          `2× current minimum_stock_level (${minStockLevel}). ` +
          `Recommend raising to ${threshRecommended} (1.5× expected consumption).`;
        threshConfidence = 0.85;
      } else if (expectedConsumption14 < minStockLevel / 2) {
        threshDirection = 'decrease';
        threshRecommended = Math.max(1, Math.ceil(expectedConsumption14 * 1.25));
        threshRationale =
          `14-day expected consumption (${expectedConsumption14.toFixed(0)} units) is less than ` +
          `half of current minimum_stock_level (${minStockLevel}). ` +
          `Recommend lowering to ${threshRecommended} (1.25× expected consumption).`;
        threshConfidence = 0.75;
      } else {
        threshRationale =
          `14-day expected consumption (${expectedConsumption14.toFixed(0)} units) is within ` +
          `2× of minimum_stock_level (${minStockLevel}). Current threshold is appropriate.`;
        threshConfidence = 0.9;
      }

      thresholds.push({
        run_id: runId,
        medicine_id: med.id,
        medicine_name: med.medicine_name,
        current_min_level: minStockLevel,
        observed_avg_daily: parseFloat(avgDailySales90.toFixed(2)),
        observation_window_days: THRESHOLD_WINDOW_DAYS,
        recommended_min_level: threshRecommended,
        direction: threshDirection,
        confidence: threshConfidence,
        rationale: threshRationale,
        status: 'pending',
      });

      // d-4. Reorder suggestion — only if at-risk
      if (daysOfCover >= REORDER_WINDOW_DAYS && daysOfCover >= DEFAULT_LEAD_TIME_DAYS) continue;

      // d-5. Idempotency — skip if live suggestion exists
      if (alreadySuggestedIds.has(med.id)) continue;

      // d-6. Compute suggested_qty
      let rawQty = Math.ceil((avgDailySales90 * 30) / packSize) * packSize;
      const capByOnHand = onHand > 0 ? onHand * MAX_ONHAND_MULTIPLE : rawQty;
      // No MOQ data in schema; treat packSize as minimum order unit, no explicit MOQ cap
      let cappedQty = Math.min(rawQty, capByOnHand);
      if (cappedQty < packSize) cappedQty = packSize;

      const flagged = cappedQty < rawQty;
      const stockoutDate =
        avgDailySales90 > 0 && onHand >= 0
          ? new Date(now.getTime() + (daysOfCover * 86400_000)).toISOString().slice(0, 10)
          : null;

      const confidence = Math.min(
        0.95,
        0.5 + (agg.distinctDays.size / ANALYSIS_WINDOW_DAYS) * 0.45
      );

      const rationale =
        `On-hand: ${onHand} units. ` +
        `Avg daily sales (90d): ${avgDailySales90.toFixed(2)} units/day. ` +
        `Days of cover: ${daysOfCover.toFixed(1)}. ` +
        `Suggested order: ${cappedQty} units (30-day cover at current velocity).` +
        (flagged ? ` [CAPPED from ${rawQty} — on-hand ×${MAX_ONHAND_MULTIPLE} limit applied]` : '');

      scored.push({
        run_id: runId,
        medicine_id: med.id,
        medicine_name: med.medicine_name,
        on_hand: onHand,
        avg_daily_sales: parseFloat(avgDailySales90.toFixed(2)),
        days_of_cover: parseFloat(daysOfCover.toFixed(2)),
        suggested_qty: cappedQty,
        supplier: null,
        expected_stockout: stockoutDate,
        confidence,
        rationale,
        status: 'pending',
        risk_score: daysOfCover === 0 ? -1 : daysOfCover,
      });
    }

    // d-7. Sort by risk (lowest days_of_cover first), cap at MAX_SUGGESTIONS
    scored.sort((a, b) => a.risk_score - b.risk_score);
    const topSuggestions = scored.slice(0, MAX_SUGGESTIONS);
    for (const s of topSuggestions) {
      const { risk_score: _, ...row } = s;
      suggestions.push(row);
    }

    // -----------------------------------------------------------------------
    // e. Insert suggestions (single upsert-style insert — all or nothing)
    // -----------------------------------------------------------------------
    if (suggestions.length > 0) {
      const { error: insErr } = await supabase
        .from('agent_po_suggestions')
        .insert(suggestions);
      if (insErr) throw new Error(`insert suggestions: ${insErr.message}`);
    }
    suggestionCount = suggestions.length;

    // -----------------------------------------------------------------------
    // f. Insert threshold recommendations
    // -----------------------------------------------------------------------
    if (thresholds.length > 0) {
      const { error: thrErr } = await supabase
        .from('agent_threshold_recommendations')
        .insert(thresholds);
      if (thrErr) throw new Error(`insert thresholds: ${thrErr.message}`);
    }
    recommendationCount = thresholds.length;

    // -----------------------------------------------------------------------
    // g. Write audit log row
    // -----------------------------------------------------------------------
    const inputHash = await sha256(
      JSON.stringify({ medicines_processed: medicineCount, run_id: runId, timestamp: now.toISOString() })
    );
    const outputHash = await sha256(
      JSON.stringify({ suggestions: suggestionCount, recommendations: recommendationCount })
    );

    await supabase.from('agent_audit_log').insert({
      request_id: runId,
      agent_slug: AGENT_SLUG,
      input_hash: inputHash,
      output_hash: outputHash,
      confidence: suggestions.length > 0
        ? suggestions.reduce((s, r) => s + r.confidence, 0) / suggestions.length
        : null,
      handed_to_human: true,
      used_fallback: false,
      error_message: null,
    });

    const truncated = scored.length > MAX_SUGGESTIONS;
    return new Response(
      JSON.stringify({
        run_id: runId,
        suggestions_inserted: suggestionCount,
        recommendations_inserted: recommendationCount,
        medicines_processed: medicineCount,
        controlled_excluded: controlledNotes.length,
        truncated,
        controlled_notes: controlledNotes,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : String(err);

    // Best-effort audit log on error
    try {
      const inputHash = await sha256(
        JSON.stringify({ medicines_processed: medicineCount, run_id: runId, error: true })
      );
      await supabase.from('agent_audit_log').insert({
        request_id: runId,
        agent_slug: AGENT_SLUG,
        input_hash: inputHash,
        output_hash: '',
        handed_to_human: false,
        used_fallback: false,
        error_message: errorMessage,
      });
    } catch (_auditErr) {
      // audit write failed — do not obscure the original error
    }

    return new Response(
      JSON.stringify({ error: errorMessage, run_id: runId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
