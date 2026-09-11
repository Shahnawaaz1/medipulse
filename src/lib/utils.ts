import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string = 0): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

export function formatDate(date: string | Date | null | undefined, includeTime = false): string {
  if (!date) return "-";
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "-";
    return includeTime
      ? d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  } catch {
    return "-";
  }
}

export function getInitials(name: string = ""): string {
  if (!name) return "MP";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}
