import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  /** Tailwind gradient stops, e.g. "from-blue-400 to-blue-600". */
  tint: string;
  loading?: boolean;
  onClick?: () => void;
}

/**
 * Big-number tile used in the Director KPI grid. Mirrors the gradient-chip
 * pattern from the tablet home tiles for visual consistency.
 */
export function KpiTile({ label, value, subtitle, icon: Icon, tint, loading, onClick }: Props) {
  const interactive = !!onClick;
  return (
    <button
      type={interactive ? "button" : undefined}
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        "tablet-tile tablet-glass flex flex-col gap-3 rounded-2xl p-4 text-left sm:p-5",
        interactive
          ? "cursor-pointer transition-transform active:scale-[0.98]"
          : "cursor-default",
      )}
    >
      <span
        className={cn(
          "inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br shadow-md",
          tint,
        )}
      >
        <Icon className="h-5 w-5 text-white" />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="mt-1 block text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
          {loading ? "…" : value}
        </span>
        {subtitle && (
          <span className="mt-1 block text-xs text-muted-foreground">{subtitle}</span>
        )}
      </span>
    </button>
  );
}
