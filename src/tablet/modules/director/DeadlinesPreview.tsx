import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarClock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { inr, shortDate } from "@/tablet/lib/format";
import { TabletCard } from "@/tablet/ui/TabletCard";
import { usePaymentDeadlines } from "@/hooks/usePaymentDeadlines";

const DAY_MS = 24 * 60 * 60 * 1000;

function daysUntil(dateISO: string): number {
  const now = new Date();
  const target = new Date(dateISO);
  return Math.round((target.getTime() - now.getTime()) / DAY_MS);
}

function urgencyTone(days: number): string {
  if (days < 0) return "border-red-500/50 bg-red-500/10 text-red-700 dark:text-red-300";
  if (days <= 3) return "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  if (days <= 7) return "border-yellow-500/40 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300";
  return "border-border bg-card text-foreground/80";
}

function urgencyLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "due today";
  if (days === 1) return "due tomorrow";
  return `in ${days}d`;
}

/** Next five active payment deadlines, read-only. Tap to drill into editor. */
export function DeadlinesPreview() {
  const navigate = useNavigate();
  const { data: deadlines = [], isLoading } = usePaymentDeadlines();

  const next = useMemo(
    () =>
      deadlines
        .filter((d) => d.status !== "paid")
        .slice(0, 5)
        .map((d) => ({ ...d, days: daysUntil(d.due_date) })),
    [deadlines],
  );

  return (
    <TabletCard
      interactive
      onClick={() => navigate("/director-dashboard")}
      className="space-y-3"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-violet-600" />
          <h3 className="text-base font-semibold">Next deadlines</h3>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : next.length === 0 ? (
        <div className="py-4 text-center text-sm text-muted-foreground">
          No active deadlines
        </div>
      ) : (
        <ul className="space-y-2">
          {next.map((d) => (
            <li
              key={d.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-sm",
                urgencyTone(d.days),
              )}
            >
              <div className="min-w-0">
                <div className="truncate font-semibold">{d.service_name}</div>
                <div className="text-[11px] opacity-80">
                  {shortDate(d.due_date)} · {urgencyLabel(d.days)}
                </div>
              </div>
              <div className="shrink-0 font-bold tabular-nums">{inr(d.amount)}</div>
            </li>
          ))}
        </ul>
      )}
    </TabletCard>
  );
}
