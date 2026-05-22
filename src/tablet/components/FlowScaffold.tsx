import * as React from "react";
import { cn } from "@/lib/utils";
import { PullToRefresh } from "@/tablet/components/PullToRefresh";

interface FlowScaffoldProps {
  /** 1-based current step. Omit for single-screen flows. */
  step?: number;
  totalSteps?: number;
  /** Heading shown above the body. */
  heading?: string;
  subheading?: string;
  /** Body content — scrolls independently of header/footer. */
  children: React.ReactNode;
  /** Action bar content, pinned to the bottom thumb zone. */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Shared flow chrome: optional stepper, a scrollable body, and a fixed bottom
 * action bar in the thumb zone. Holds no business state.
 */
export function FlowScaffold({
  step,
  totalSteps,
  heading,
  subheading,
  children,
  actions,
  className,
}: FlowScaffoldProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      {(step && totalSteps) || heading ? (
        <div className="flex-shrink-0 border-b px-4 py-3">
          {step && totalSteps ? (
            <div className="mb-2 flex items-center gap-2">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors",
                    i < step ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
          ) : null}
          {heading ? (
            <div>
              <h2 className="text-xl font-bold">{heading}</h2>
              {subheading ? (
                <p className="text-sm text-muted-foreground">{subheading}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <PullToRefresh className="p-4">{children}</PullToRefresh>

      {actions ? (
        <div className="tablet-safe-bottom tablet-elevate flex flex-shrink-0 gap-3 border-t border-border bg-card/90 px-4 pt-3 backdrop-blur-md">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
