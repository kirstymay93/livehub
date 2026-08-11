import React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const Avatar = ({ src, alt, initials, size = "md", className }: AvatarProps) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  return (
    <div
      className={cn(
        "rounded-full bg-livehub-card border border-livehub-border flex items-center justify-center font-semibold text-white overflow-hidden",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        initials || "?"
      )}
    </div>
  );
};

export { Avatar };
