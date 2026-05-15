import { useCodeAssistantHealth } from '@/hooks/admin/useCodeAssistant';
import { cn } from '@/lib/utils';

export function ConnectionBadges() {
  const { data } = useCodeAssistantHealth();
  const checks = data?.checks ?? { deepseek: { ok: false }, github: { ok: false }, vercel: { ok: false }, supabase: { ok: false } };

  return (
    <div className="flex items-center gap-3 text-xs">
      <Badge label="DeepSeek" ok={checks.deepseek?.ok} reason={checks.deepseek?.error} />
      <Badge label="GitHub"   ok={checks.github?.ok}   reason={checks.github?.error} />
      <Badge label="Vercel"   ok={checks.vercel?.ok}   reason={checks.vercel?.error} />
    </div>
  );
}

function Badge({ label, ok, reason }: { label: string; ok?: boolean; reason?: string }) {
  return (
    <span className="flex items-center gap-1" title={reason ?? ''}>
      <span className={cn('inline-block w-2 h-2 rounded-full', ok ? 'bg-emerald-500' : 'bg-destructive')} />
      <span className="text-muted-foreground">{label}</span>
    </span>
  );
}
