import { useNavigate } from "react-router-dom";
import { ArrowRight, Banknote, Loader2, Wallet } from "lucide-react";
import { inr, todayISO } from "@/tablet/lib/format";
import { TabletCard } from "@/tablet/ui/TabletCard";
import {
  useDailyPaymentSchedule,
  useFundAccounts,
  useTodayCashCollections,
} from "@/hooks/useDailyPaymentAllocation";

interface Props {
  hospital: string;
}

interface StatProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "good" | "warn";
}

const TONE: Record<NonNullable<StatProps["tone"]>, string> = {
  default: "text-foreground",
  good: "text-emerald-600 dark:text-emerald-400",
  warn: "text-red-600 dark:text-red-400",
};

function Stat({ label, value, hint, tone = "default" }: StatProps) {
  return (
    <div className="rounded-xl border border-border bg-card/60 p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div className={`mt-1 text-xl font-bold ${TONE[tone]}`}>{value}</div>
      {hint && <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

/**
 * Director read-only money snapshot: today's cash in hand, total due across
 * obligations, and surplus/shortfall. Tap to drill into the editor.
 */
export function CashFundsCard({ hospital }: Props) {
  const navigate = useNavigate();
  const today = todayISO();

  const { schedule, isLoading: scheduleLoading } = useDailyPaymentSchedule(today, hospital);
  const { funds, isLoading: fundsLoading } = useFundAccounts(today);
  const { data: cashInHand, isLoading: cashLoading } = useTodayCashCollections(today);

  const isLoading = scheduleLoading || fundsLoading || cashLoading;

  const totalDue = schedule
    .filter((s) => s.status !== "paid" && s.status !== "skipped")
    .reduce((s, r) => s + Number(r.total_due || 0), 0);
  const totalPaid = schedule.reduce((s, r) => s + Number(r.paid_amount || 0), 0);
  const available = funds.totalActual || funds.totalLedger;
  const surplus = available - totalDue;

  // Top 3 fund accounts by ledger balance (most material to the director)
  const topAccounts = [...funds.accounts]
    .sort((a, b) => b.ledger_balance - a.ledger_balance)
    .slice(0, 3);

  return (
    <TabletCard
      interactive
      onClick={() => navigate("/daily-payment-allocation")}
      className="space-y-3"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-emerald-600" />
          <h3 className="text-base font-semibold">Cash & today's dues</h3>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Cash in Hand" value={inr(cashInHand || 0)} hint="today's collections" />
            <Stat label="Today's dues" value={inr(totalDue)} hint={`${schedule.length} items`} />
            <Stat
              label="Available – Due"
              value={`${surplus >= 0 ? "+" : ""}${inr(surplus)}`}
              tone={surplus >= 0 ? "good" : "warn"}
              hint={`paid ${inr(totalPaid)}`}
            />
          </div>

          {topAccounts.length > 0 && (
            <ul className="space-y-1 pt-1">
              {topAccounts.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="truncate">{a.name}</span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    {inr(a.actual_balance ?? a.ledger_balance)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </TabletCard>
  );
}
