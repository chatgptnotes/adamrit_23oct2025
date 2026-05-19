import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  OPD: "bg-sky-100 text-sky-700",
  IPD: "bg-violet-100 text-violet-700",
  Emergency: "bg-rose-100 text-rose-700",
};

function normalize(type: string): string {
  const t = type.trim();
  if (t.toLowerCase().includes("emerg")) return "Emergency";
  if (t.toUpperCase().includes("IPD")) return "IPD";
  if (t.toUpperCase().includes("OPD")) return "OPD";
  return t;
}

/** Small OPD / IPD / Emergency pill for tablet list cards. */
export function PatientTypeBadge({
  type,
  className,
}: {
  type?: string | null;
  className?: string;
}) {
  if (!type) return null;
  const norm = normalize(type);
  return (
    <span
      className={cn(
        "flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold",
        STYLES[norm] || "bg-muted text-muted-foreground",
        className,
      )}
    >
      {norm}
    </span>
  );
}
