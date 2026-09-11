import React from "react";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, className, size = "md" }: StatusBadgeProps) {
  const getStyle = (s: string) => {
    const lower = s.toLowerCase();

    // Success states
    if (
      lower === "active" ||
      lower === "completed" ||
      lower === "paid" ||
      lower === "available" ||
      lower === "normal" ||
      lower === "in stock" ||
      lower === "confirmed"
    ) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    }

    // Warning states
    if (
      lower === "scheduled" ||
      lower === "waiting" ||
      lower === "pending" ||
      lower === "partially paid" ||
      lower === "low stock" ||
      lower === "reserved" ||
      lower === "sample collected" ||
      lower === "on leave"
    ) {
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
    }

    // Danger / Busy states
    if (
      lower === "cancelled" ||
      lower === "occupied" ||
      lower === "out of stock" ||
      lower === "expired" ||
      lower === "high" ||
      lower === "abnormal" ||
      lower === "no show" ||
      lower === "terminated" ||
      lower === "emergency"
    ) {
      return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
    }

    // In-progress / Info states
    if (
      lower === "in consultation" ||
      lower === "processing" ||
      lower === "admitted" ||
      lower === "under treatment" ||
      lower === "report generated" ||
      lower === "checked in" ||
      lower === "inpatient" ||
      lower === "outpatient"
    ) {
      return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
    }

    // Neutral / Discharged / Maintenance
    return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border shadow-sm transition-colors",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        getStyle(status),
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80 animate-pulse" />
      {status}
    </span>
  );
}
export default StatusBadge;
