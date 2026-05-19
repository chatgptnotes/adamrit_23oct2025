import * as React from "react";
import { cn } from "@/lib/utils";

interface TabletCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Adds press feedback + pointer cursor for tappable cards. */
  interactive?: boolean;
  /** "elevated" = soft premium shadow (default). "flat" = thin border + ultra-subtle shadow. */
  variant?: "elevated" | "flat";
}

/** Large, rounded card surface tuned for touch. */
export const TabletCard = React.forwardRef<HTMLDivElement, TabletCardProps>(
  ({ className, interactive, variant = "elevated", ...props }, ref) => (
    <div
      ref={ref}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      className={cn(
        "rounded-2xl border bg-card p-5 text-card-foreground",
        variant === "elevated" && "tablet-elevate border-border",
        variant === "flat" && "tablet-elevate-flat border-border",
        interactive &&
          "cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      {...props}
    />
  ),
);
TabletCard.displayName = "TabletCard";
