import React from "react";
import { LucideIcon, FileQuestion } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/30">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-100 text-slate-400 dark:bg-slate-800 dark:border-slate-700">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-slate-800 dark:text-white">
        {title}
      </h3>
      <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition-colors"
        >
          {actionText}
        </button>
      )}
    </div>
  );
}
export default EmptyState;
