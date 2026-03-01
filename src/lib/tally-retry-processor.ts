import { supabase } from "@/integrations/supabase/client";

async function isTallyActive() {
  const { data } = await supabase.from("tally_config").select("*").eq("is_active", true).limit(1).single();
  if (!data) return { active: false, serverUrl: "", companyName: "" };
  return { active: true, serverUrl: data.server_url, companyName: data.company_name };
}

export async function processRetryQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const config = await isTallyActive();
  if (!config.active) return { processed: 0, succeeded: 0, failed: 0 };

  const now = new Date().toISOString();
  const { data: items } = await supabase
    .from("tally_push_queue")
    .select("*")
    .eq("status", "pending")
    .lte("next_retry_at", now)
    .order("created_at", { ascending: true })
    .limit(10);

  let processed = 0, succeeded = 0, failed = 0;

  for (const item of (items || [])) {
    try {
      const response = await fetch("/api/tally-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: "push",
          action: item.push_action,
          serverUrl: config.serverUrl,
          companyName: config.companyName,
          data: item.payload
        })
      });
      const result = await response.json();

      if (result.success) {
        await supabase.from("tally_push_queue").update({
          status: "completed",
          completed_at: new Date().toISOString()
        }).eq("id", item.id);
        succeeded++;
      } else {
        const newCount = item.retry_count + 1;
        const backoffMs = Math.min(newCount * 5 * 60 * 1000, 60 * 60 * 1000);
        await supabase.from("tally_push_queue").update({
          retry_count: newCount,
          last_error: result.errors?.join("; ") || result.message || "Unknown",
          last_retry_at: new Date().toISOString(),
          next_retry_at: new Date(Date.now() + backoffMs).toISOString(),
          status: newCount >= item.max_retries ? "failed_permanent" : "pending"
        }).eq("id", item.id);
        failed++;
      }
      processed++;
    } catch (err: any) {
      const newCount = item.retry_count + 1;
      await supabase.from("tally_push_queue").update({
        retry_count: newCount,
        last_error: err.message || String(err),
        last_retry_at: new Date().toISOString(),
        status: newCount >= item.max_retries ? "failed_permanent" : "pending"
      }).eq("id", item.id);
      failed++;
      processed++;
    }
  }

  return { processed, succeeded, failed };
}

export async function getQueueStats() {
  const { data: pending } = await supabase.from("tally_push_queue").select("id", { count: "exact" }).eq("status", "pending");
  const { data: failedPerm } = await supabase.from("tally_push_queue").select("id", { count: "exact" }).eq("status", "failed_permanent");
  const { data: completed } = await supabase.from("tally_push_queue").select("id", { count: "exact" }).eq("status", "completed");
  return {
    pending: pending?.length || 0,
    failedPermanent: failedPerm?.length || 0,
    completed: completed?.length || 0
  };
}

export async function retryItem(id: string) {
  await supabase.from("tally_push_queue").update({
    status: "pending",
    next_retry_at: new Date().toISOString(),
    retry_count: 0
  }).eq("id", id);
}

export async function deleteQueueItem(id: string) {
  await supabase.from("tally_push_queue").delete().eq("id", id);
}
