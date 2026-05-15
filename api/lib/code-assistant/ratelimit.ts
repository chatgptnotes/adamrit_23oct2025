// Per-user rate limit + cost cap enforcement.
// See: bettroi-vault/Adamrit/Super-Admin-Code-Assistant-Plan.md §22.4

import { getServiceClient } from './serviceClient';

export class RateLimitError extends Error {
  constructor(public code: string, public details?: Record<string, unknown>) {
    super(code);
  }
}

const HOURLY = parseInt(process.env.CODE_ASSIST_HOURLY_LIMIT ?? '20', 10);
const DAILY_USD = parseFloat(process.env.CODE_ASSIST_DAILY_COST_USD ?? '5');
const MONTHLY_USD = parseFloat(process.env.CODE_ASSIST_MONTHLY_COST_USD ?? '50');

export async function checkAndIncrementRateLimit(userId: string): Promise<void> {
  const sb = getServiceClient();
  const now = new Date();

  const { data: row } = await sb
    .from('code_assistant_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (!row) {
    await sb.from('code_assistant_rate_limits').insert({
      user_id: userId,
      prompts_this_hour: 1,
      hour_started_at: now.toISOString(),
      cost_today_usd: 0,
      day_started_at: now.toISOString().slice(0, 10),
      cost_this_month_usd: 0,
      month_started_at: monthStart(now),
    });
    return;
  }

  // Roll-overs
  const hourElapsedMs = now.getTime() - new Date(row.hour_started_at).getTime();
  let newPrompts = row.prompts_this_hour;
  let newHourStart = row.hour_started_at;
  if (hourElapsedMs > 60 * 60 * 1000) {
    newPrompts = 0;
    newHourStart = now.toISOString();
  }

  let newCostToday = parseFloat(row.cost_today_usd);
  if (row.day_started_at !== now.toISOString().slice(0, 10)) {
    newCostToday = 0;
  }

  let newCostMonth = parseFloat(row.cost_this_month_usd);
  if (row.month_started_at !== monthStart(now)) {
    newCostMonth = 0;
  }

  if (newPrompts >= HOURLY) {
    const resetMs = new Date(newHourStart).getTime() + 60 * 60 * 1000 - now.getTime();
    throw new RateLimitError('rate-limit-prompts', { minutes_until_reset: Math.ceil(resetMs / 60000) });
  }
  if (newCostToday >= DAILY_USD) {
    throw new RateLimitError('rate-limit-cost-daily', { spent: newCostToday, cap: DAILY_USD });
  }
  if (newCostMonth >= MONTHLY_USD) {
    throw new RateLimitError('rate-limit-cost-monthly', { spent: newCostMonth, cap: MONTHLY_USD });
  }

  await sb.from('code_assistant_rate_limits').update({
    prompts_this_hour: newPrompts + 1,
    hour_started_at: newHourStart,
    cost_today_usd: newCostToday,
    day_started_at: now.toISOString().slice(0, 10),
    cost_this_month_usd: newCostMonth,
    month_started_at: monthStart(now),
  }).eq('user_id', userId);
}

export async function addCost(userId: string, costUsd: number): Promise<void> {
  const sb = getServiceClient();
  const { data: row } = await sb
    .from('code_assistant_rate_limits')
    .select('cost_today_usd, cost_this_month_usd')
    .eq('user_id', userId)
    .maybeSingle();
  if (!row) return;
  await sb.from('code_assistant_rate_limits').update({
    cost_today_usd: parseFloat(row.cost_today_usd) + costUsd,
    cost_this_month_usd: parseFloat(row.cost_this_month_usd) + costUsd,
  }).eq('user_id', userId);
}

export async function getUsage(userId: string) {
  const sb = getServiceClient();
  const { data: row } = await sb
    .from('code_assistant_rate_limits')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const now = new Date();
  const hourResetsAt = row ? new Date(new Date(row.hour_started_at).getTime() + 60 * 60 * 1000) : new Date(now.getTime() + 60 * 60 * 1000);
  const dayResetsAt = new Date(now); dayResetsAt.setHours(24, 0, 0, 0);
  const monthResetsAt = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  return {
    hour: { used: row?.prompts_this_hour ?? 0, cap: HOURLY, resets_at: hourResetsAt.toISOString() },
    day:  { used_usd: parseFloat(row?.cost_today_usd ?? '0'), cap_usd: DAILY_USD, resets_at: dayResetsAt.toISOString() },
    month: { used_usd: parseFloat(row?.cost_this_month_usd ?? '0'), cap_usd: MONTHLY_USD, resets_at: monthResetsAt.toISOString() },
  };
}

function monthStart(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}
