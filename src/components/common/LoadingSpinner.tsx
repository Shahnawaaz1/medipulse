import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg" | string;
}

export function LoadingSpinner({
  label = "Loading hospital data...",
  className = "py-16",
  size = "md",
}: LoadingSpinnerProps) {
  const iconSize =
    size === "sm"
      ? "h-5 w-5"
      : size === "lg"
      ? "h-12 w-12"
      : "h-8 w-8";

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center">
        <Loader2 className={`${iconSize} animate-spin text-brand-600 dark:text-brand-400`} />
      </div>
      {label && (
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {label}
        </p>
      )}
    </div>
  );
}
export default LoadingSpinner;
