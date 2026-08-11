import React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "bg-livehub-card border border-livehub-border rounded-lg overflow-hidden",
        className
      )}
      {...props}
    />
  )
);

Card.displayName = "Card";

export { Card };
