import { useCodeAssistantUsage } from '@/hooks/admin/useCodeAssistant';
import { cn } from '@/lib/utils';

export function UsageMeter() {
  const { data } = useCodeAssistantUsage();
  if (!data?.ok) return null;

  const month = data.month;
  const monthPct = (month.used_usd / month.cap_usd) * 100;
  const monthColor =
    monthPct < 80 ? 'text-muted-foreground' :
    monthPct < 95 ? 'text-amber-600' :
    'text-destructive';

  const hour = data.hour;
  const hourPct = (hour.used / hour.cap) * 100;
  const hourColor =
    hourPct < 80 ? 'text-muted-foreground' :
    hourPct < 100 ? 'text-amber-600' :
    'text-destructive';

  return (
    <div className="flex items-center gap-4 text-xs">
      <span className={cn('whitespace-nowrap', monthColor)}>
        This month: ${month.used_usd.toFixed(2)} / ${month.cap_usd.toFixed(2)}
      </span>
      <span className={cn('whitespace-nowrap', hourColor)}>
        This hour: {hour.used} / {hour.cap}
      </span>
    </div>
  );
}
