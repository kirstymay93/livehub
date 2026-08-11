import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
}

const LoadingSpinner = ({ size = "md" }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-12 h-12",
  };

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} border-4 border-livehub-border border-t-livehub-accent rounded-full animate-spin`}
      />
    </div>
  );
};

export { LoadingSpinner };
