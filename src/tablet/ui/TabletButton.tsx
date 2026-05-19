import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Touch-first wrapper over the shadcn Button. Enforces a >=56px tap target
 * and a larger type scale. Behaviour/accessibility stays in the base Button.
 */
export const TabletButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, size, ...props }, ref) => (
    <Button
      ref={ref}
      size={size ?? "lg"}
      className={cn(
        "min-h-[56px] rounded-xl px-6 text-lg font-semibold shadow-sm transition-all duration-200 active:scale-[0.97]",
        className,
      )}
      {...props}
    />
  ),
);
TabletButton.displayName = "TabletButton";
