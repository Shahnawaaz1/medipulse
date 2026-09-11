import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner({
  label = "Loading hospital data...",
  className = "py-16",
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex h-10 w-10 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
      </div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </div>
  );
}
export default LoadingSpinner;
