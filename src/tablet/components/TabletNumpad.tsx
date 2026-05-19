import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabletNumpadProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  allowDecimal?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * On-screen numeric keypad for PIN and amount entry.
 *
 * Touch targets scale with the viewport without distorting proportions:
 * 56px keys on phones, 64px on tablets, 72px on large desktop — always at or
 * above the 48-56px minimum touch-target size. The 3-column grid keeps the
 * key proportions constant; only the cell size and glyph scale up.
 */
export function TabletNumpad({
  value,
  onChange,
  maxLength = 12,
  allowDecimal = false,
  disabled = false,
  className,
}: TabletNumpadProps) {
  const press = (key: string) => {
    if (disabled) return;
    if (key === "back") {
      onChange(value.slice(0, -1));
      return;
    }
    if (key === ".") {
      if (!allowDecimal || value.includes(".") || value === "") return;
      onChange(value + ".");
      return;
    }
    if (value.replace(".", "").length >= maxLength) return;
    if (value === "0") {
      onChange(key);
      return;
    }
    onChange(value + key);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", allowDecimal ? "." : "", "0", "back"];

  return (
    <div className={cn("grid grid-cols-3 gap-2.5 sm:gap-3 lg:gap-4", className)}>
      {keys.map((k, i) =>
        k === "" ? (
          <div key={i} aria-hidden />
        ) : (
          <button
            key={i}
            type="button"
            disabled={disabled}
            onClick={() => press(k)}
            aria-label={k === "back" ? "Delete" : k}
            className={cn(
              "tablet-elevate flex items-center justify-center rounded-2xl border border-black/[0.04]",
              "bg-card font-semibold transition-transform active:scale-95 disabled:opacity-40",
              "h-14 text-xl sm:h-16 sm:text-2xl lg:h-[4.5rem] lg:text-3xl",
            )}
          >
            {k === "back" ? (
              <Delete className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
            ) : (
              k
            )}
          </button>
        ),
      )}
    </div>
  );
}
