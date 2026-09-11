import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  colorScheme?: "blue" | "teal" | "emerald" | "amber" | "rose" | "indigo" | "purple";
  className?: string;
}

const colorMap = {
  blue: {
    bg: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    border: "border-blue-100 dark:border-blue-900/40",
    glow: "hover:border-blue-300 dark:hover:border-blue-700",
  },
  teal: {
    bg: "bg-teal-50 text-teal-600 dark:bg-teal-950/50 dark:text-teal-400",
    border: "border-teal-100 dark:border-teal-900/40",
    glow: "hover:border-teal-300 dark:hover:border-teal-700",
  },
  emerald: {
    bg: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    border: "border-emerald-100 dark:border-emerald-900/40",
    glow: "hover:border-emerald-300 dark:hover:border-emerald-700",
  },
  amber: {
    bg: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    border: "border-amber-100 dark:border-amber-900/40",
    glow: "hover:border-amber-300 dark:hover:border-amber-700",
  },
  rose: {
    bg: "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
    border: "border-rose-100 dark:border-rose-900/40",
    glow: "hover:border-rose-300 dark:hover:border-rose-700",
  },
  indigo: {
    bg: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    border: "border-indigo-100 dark:border-indigo-900/40",
    glow: "hover:border-indigo-300 dark:hover:border-indigo-700",
  },
  purple: {
    bg: "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400",
    border: "border-purple-100 dark:border-purple-900/40",
    glow: "hover:border-purple-300 dark:hover:border-purple-700",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = "blue",
  className,
}: StatCardProps) {
  const scheme = colorMap[colorScheme] || colorMap.blue;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-white p-5 shadow-sm transition-all duration-200 dark:bg-slate-900 dark:border-slate-800",
        scheme.glow,
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {value}
            </span>
            {trend && (
              <span
                className={cn(
                  "inline-flex items-center text-xs font-medium",
                  trend.isPositive ? "text-emerald-600" : "text-rose-600"
                )}
              >
                {trend.isPositive ? "↑" : "↓"} {trend.value}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl p-2.5", scheme.bg)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
export default StatCard;
