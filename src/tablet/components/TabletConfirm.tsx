import { CheckCircle2, XCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { TabletButton } from "@/tablet/ui/TabletButton";

type ConfirmStatus = "success" | "error" | "info";

interface TabletConfirmProps {
  status: ConfirmStatus;
  title: string;
  message?: string;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
}

const ICON = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

const COLOR = {
  success: "text-emerald-600",
  error: "text-destructive",
  info: "text-sky-600",
} as const;

/** Full-screen result screen shown at the end of a flow. */
export function TabletConfirm({
  status,
  title,
  message,
  primaryAction,
  secondaryAction,
}: TabletConfirmProps) {
  const Icon = ICON[status];
  return (
    <div className="flex h-full flex-col items-center justify-center gap-5 p-8 text-center">
      <Icon className={cn("h-24 w-24", COLOR[status])} />
      <h2 className="text-2xl font-bold">{title}</h2>
      {message ? (
        <p className="max-w-md text-base text-muted-foreground">{message}</p>
      ) : null}
      <div className="mt-4 flex w-full max-w-xs flex-col gap-3">
        {primaryAction ? (
          <TabletButton onClick={primaryAction.onClick}>
            {primaryAction.label}
          </TabletButton>
        ) : null}
        {secondaryAction ? (
          <TabletButton variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </TabletButton>
        ) : null}
      </div>
    </div>
  );
}
