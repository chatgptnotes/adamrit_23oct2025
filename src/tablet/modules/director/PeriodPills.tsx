import { cn } from "@/lib/utils";
import type { KpiPeriod } from "@/hooks/useDirectorKpis";

interface Props {
  value: KpiPeriod;
  onChange: (next: KpiPeriod) => void;
}

const OPTIONS: { value: KpiPeriod; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
];

/** Sticky period selector used to drive the KPI grid. Touch-sized pills. */
export function PeriodPills({ value, onChange }: Props) {
  return (
    <div className="sticky top-0 z-20 -mx-4 px-4 pb-2 pt-1 backdrop-blur sm:-mx-6 sm:px-6">
      <div role="tablist" className="flex gap-2 overflow-x-auto">
        {OPTIONS.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                "min-h-[44px] shrink-0 rounded-full border px-5 text-base font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground shadow"
                  : "border-border bg-card text-foreground/80 hover:bg-accent",
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
