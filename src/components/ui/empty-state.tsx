import React from "react";

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

const EmptyState = ({ title, message, icon, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {icon && <div className="mb-4 text-gray-400">{icon}</div>}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-center mb-4">{message}</p>
      {action}
    </div>
  );
};

export { EmptyState };
