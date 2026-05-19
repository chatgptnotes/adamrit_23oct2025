import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Loader2, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { inr } from "@/tablet/lib/format";
import { TabletCard } from "@/tablet/ui/TabletCard";
import { useBillAgingReport } from "@/hooks/useBillAgingReport";

interface Props {
  hospital: string;
}

// Collapse the 6-bucket detail view (used on desktop) into 4 buckets the
// director cares about at a glance.
const COLLAPSED = [
  { key: "0-30", label: "0–30 d", tone: "bg-emerald-500" },
  { key: "31-60", label: "31–60 d", tone: "bg-amber-500" },
  { key: "61-90", label: "61–90 d", tone: "bg-orange-500" },
  { key: "90+", label: "90+ d", tone: "bg-red-500" },
] as const;

export function ArAgingCard({ hospital }: Props) {
  const navigate = useNavigate();
  const { summary, isLoading } = useBillAgingReport(hospital);

  const collapsed = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of summary.buckets) {
      const key =
        b.bucket === "0-30" || b.bucket === "31-60" || b.bucket === "61-90"
          ? b.bucket
          : "90+";
      map.set(key, (map.get(key) || 0) + b.total_outstanding_amount);
    }
    return COLLAPSED.map((b) => ({ ...b, value: map.get(b.key) || 0 }));
  }, [summary]);

  const max = Math.max(...collapsed.map((b) => b.value), 1);
  const topCorporates = useMemo(
    () =>
      [...summary.by_corporate]
        .filter((c) => c.total_outstanding > 0)
        .sort((a, b) => b.total_outstanding - a.total_outstanding)
        .slice(0, 3),
    [summary],
  );

  return (
    <TabletCard
      interactive
      onClick={() => navigate("/corporate-bulk-payments")}
      className="space-y-3"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-rose-600" />
          <h3 className="text-base font-semibold">A/R aging</h3>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : summary.total_outstanding_amount === 0 ? (
        <div className="py-6 text-center text-sm text-muted-foreground">
          No outstanding bills
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border bg-card/60 p-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Total outstanding
            </div>
            <div className="mt-1 text-2xl font-bold text-foreground">
              {inr(summary.total_outstanding_amount)}
            </div>
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              avg {summary.average_days_to_payment}d to payment ·{" "}
              {summary.total_bills} bills tracked
            </div>
          </div>

          <ul className="space-y-1.5">
            {collapsed.map((b) => {
              const pct = max > 0 ? (b.value / max) * 100 : 0;
              return (
                <li key={b.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-muted-foreground">{b.label}</span>
                    <span className="font-semibold tabular-nums">{inr(b.value)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-border/50">
                    <div
                      className={cn("h-full rounded-full transition-all", b.tone)}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          {topCorporates.length > 0 && (
            <div className="pt-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Top corporates by dues
              </div>
              <ul className="space-y-1">
                {topCorporates.map((c) => (
                  <li
                    key={c.corporate}
                    className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate">{c.corporate}</span>
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums">
                      {inr(c.total_outstanding)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </TabletCard>
  );
}
