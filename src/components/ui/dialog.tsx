"use client";

import React from "react";
import { X } from "lucide-react";

interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  title?: string;
}

const Dialog = ({ open = false, onOpenChange, children, title }: DialogProps) => {
  return (
    <>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-livehub-card border border-livehub-border rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {title && (
              <div className="flex justify-between items-center p-6 border-b border-livehub-border">
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                <button
                  onClick={() => onOpenChange?.(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </div>
        </div>
      )}
    </>
  );
};

export { Dialog };
