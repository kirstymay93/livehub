import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, disabled, ...props }, ref) => {
    const baseStyles = "font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-livehub-accent disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary: "bg-livehub-accent hover:bg-livehub-accent-hover text-white",
      secondary: "bg-livehub-card border border-livehub-border hover:bg-livehub-hover text-white",
      ghost: "hover:bg-livehub-card text-white",
      danger: "bg-red-600 hover:bg-red-700 text-white",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? "Loading..." : props.children}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
