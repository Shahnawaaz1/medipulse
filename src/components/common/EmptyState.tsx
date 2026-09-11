import React from "react";
import { LucideIcon, FileQuestion } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon | any;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon = FileQuestion,
  title,
  description,
  actionText,
  onAction,
  action,
}: EmptyStateProps) {
  const btnLabel = actionText || action?.label;
  const btnClick = onAction || action?.onClick;

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
      {btnLabel && btnClick && (
        <button
          onClick={btnClick}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all"
        >
          {btnLabel}
        </button>
      )}
    </div>
  );
}
export default EmptyState;
