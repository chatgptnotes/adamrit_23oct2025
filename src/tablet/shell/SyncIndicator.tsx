import { useIsFetching, useIsMutating } from "@tanstack/react-query";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOnlineStatus } from "@/tablet/hooks/useOnlineStatus";

/** Connectivity + data-sync status pill for the top bar. */
export function SyncIndicator() {
  const online = useOnlineStatus();
  const busy = useIsFetching() + useIsMutating() > 0;

  if (!online) {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-destructive">
        <WifiOff className="h-4 w-4" /> Offline
      </span>
    );
  }
  return (
    <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Wifi className={cn("h-4 w-4", busy && "animate-pulse text-primary")} />
      {busy ? "Syncing…" : "Online"}
    </span>
  );
}
