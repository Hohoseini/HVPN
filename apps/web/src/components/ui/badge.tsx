import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-base border-2 border-border px-2.5 py-0.5 text-xs font-heading transition-colors",
  {
    variants: {
      variant: {
        default: "bg-main text-mtext",
        neutral: "bg-bw text-text",
        success: "bg-lime-300 text-black",
        danger: "bg-red-300 text-black",
        warning: "bg-yellow-300 text-black",
        info: "bg-sky-300 text-black",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
