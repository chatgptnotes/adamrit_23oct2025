import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Touch-first wrapper over the shadcn Input — taller field, larger text. */
export const TabletInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    className={cn("h-14 rounded-xl px-4 text-lg", className)}
    {...props}
  />
));
TabletInput.displayName = "TabletInput";

/** Standard field label for tablet forms. */
export function TabletLabel({
  children,
  className,
  htmlFor,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-1.5 block text-sm font-medium text-muted-foreground", className)}
    >
      {children}
    </label>
  );
}
