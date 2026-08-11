import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "success" | "warning" | "danger";
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const variants = {
      primary: "bg-livehub-accent text-white",
      success: "bg-green-600 text-white",
      warning: "bg-yellow-600 text-white",
      danger: "bg-red-600 text-white",
    };

    return (
      <span
        ref={ref}
        className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", variants[variant], className)}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
