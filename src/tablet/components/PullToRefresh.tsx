import * as React from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { haptics } from "@/tablet/lib/haptics";

const THRESHOLD = 72; // px of pull required to trigger a refresh
const MAX_PULL = 110; // px the indicator can travel
const REST = THRESHOLD * 0.6; // resting offset while refreshing

interface PullToRefreshProps {
  /** Refresh action. Defaults to refetching all active React Query data. */
  onRefresh?: () => void | Promise<unknown>;
  className?: string;
  children: React.ReactNode;
}

/**
 * Touch pull-to-refresh wrapper. Replaces a plain scroll container — owns the
 * `overflow-y-auto` itself. Pull only engages at the top of the scroll; release
 * past the threshold runs `onRefresh` (defaults to invalidating active queries).
 */
export function PullToRefresh({
  onRefresh,
  className,
  children,
}: PullToRefreshProps) {
  const qc = useQueryClient();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const startY = React.useRef<number | null>(null);
  const passedThreshold = React.useRef(false);
  const [pull, setPull] = React.useState(0);
  const [refreshing, setRefreshing] = React.useState(false);

  const dragging = startY.current !== null;

  const handleTouchStart = (e: React.TouchEvent) => {
    const el = scrollRef.current;
    if (!el || refreshing) return;
    startY.current = el.scrollTop <= 0 ? e.touches[0].clientY : null;
    passedThreshold.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta <= 0) {
      setPull(0);
      return;
    }
    const dist = Math.min(MAX_PULL, delta * 0.5); // resistance
    setPull(dist);
    if (!passedThreshold.current && dist >= THRESHOLD) {
      passedThreshold.current = true;
      haptics.tap();
    }
  };

  const handleTouchEnd = async () => {
    if (startY.current === null) return;
    const shouldRefresh = pull >= THRESHOLD;
    startY.current = null;
    if (!shouldRefresh) {
      setPull(0);
      return;
    }
    setRefreshing(true);
    setPull(REST);
    try {
      await Promise.resolve(onRefresh ? onRefresh() : qc.invalidateQueries());
    } finally {
      setRefreshing(false);
      setPull(0);
    }
  };

  const offset = refreshing ? REST : pull;

  return (
    <div
      ref={scrollRef}
      className={cn(
        "tablet-no-scrollbar relative min-h-0 flex-1 overflow-y-auto",
        className,
      )}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center"
        style={{ height: offset, opacity: offset > 0 ? 1 : 0 }}
      >
        <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-primary shadow-md">
          {refreshing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowDown
              className="h-5 w-5 transition-transform"
              style={{
                transform: pull >= THRESHOLD ? "rotate(180deg)" : "none",
              }}
            />
          )}
        </div>
      </div>
      <div
        style={{
          transform: `translateY(${offset}px)`,
          transition: dragging ? "none" : "transform 0.2s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
