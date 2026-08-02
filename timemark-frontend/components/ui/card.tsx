import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-card border border-border bg-surface p-6 shadow-[0_1px_2px_rgba(27,36,48,0.06),0_8px_24px_rgba(27,36,48,0.06)]",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export { Card };
