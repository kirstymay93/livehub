import React from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  title: string;
  message: string;
  action?: React.ReactNode;
}

const ErrorState = ({ title, message, action }: ErrorStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-center mb-4">{message}</p>
      {action}
    </div>
  );
};

export { ErrorState };
