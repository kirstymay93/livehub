import React from "react";
import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-white mb-2">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "w-full px-4 py-2 bg-livehub-card border border-livehub-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-livehub-accent focus:border-transparent transition-all",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          {...props}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
