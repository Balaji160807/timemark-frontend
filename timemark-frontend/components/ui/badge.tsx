import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        pending: "bg-amber-bg text-amber",
        approved: "bg-forest-bg text-forest",
        rejected: "bg-brick-bg text-brick",
        present: "bg-forest-bg text-forest",
        late: "bg-amber-bg text-amber",
        absent: "bg-brick-bg text-brick",
        on_leave: "bg-[#F6EDDA] text-ochre-dark",
        neutral: "bg-paper text-slate",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
