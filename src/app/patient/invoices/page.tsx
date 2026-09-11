"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  Receipt,
  Download,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function PatientInvoicesPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBills() {
      try {
        setLoading(true);
        const res = await fetch("/api/billing");
        if (res.ok) {
          const d = await res.json();
          setInvoices(d.invoices || []);
        }
      } catch {
        toast.error("Failed to load bills");
      } finally {
        setLoading(false);
      }
    }
    loadBills();
  }, []);

  const handlePayNow = (inv: any) => {
    toast.success(`Online payment gateway initiated for ${inv.invoiceNumber} (${formatCurrency(inv.balanceAmount || inv.totalAmount)})`);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          My Bills & Invoices
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Review consultation receipts, medication invoices, diagnostic billings, and payment settlements.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {invoices.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No Invoices Found"
            description="All hospital and clinic bills will appear here with instant digital payment settlement options."
          />
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div
                key={inv._id}
                className="p-5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3 dark:border-slate-700/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs dark:bg-indigo-950 dark:text-indigo-300">
                        <Receipt className="h-4 w-4" />
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Invoice Date: {inv.invoiceDate} • Doctor: {inv.doctor?.name || "MediPulse Hospital"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <StatusBadge status={inv.paymentStatus || "Pending"} />
                    {inv.paymentStatus !== "Paid" && (
                      <button
                        onClick={() => handlePayNow(inv)}
                        className="rounded-xl bg-gradient-to-r from-teal-600 to-brand-600 px-4 py-2 text-xs font-bold text-white shadow hover:brightness-110 transition-all"
                      >
                        Pay Online Now
                      </button>
                    )}
                  </div>
                </div>

                {/* Items */}
                {inv.items && inv.items.length > 0 && (
                  <div className="space-y-1 text-xs">
                    {inv.items.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex justify-between text-slate-600 dark:text-slate-300"
                      >
                        <span>
                          {item.description} (x{item.quantity || 1})
                        </span>
                        <span className="font-semibold">{formatCurrency(item.total || 0)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between pt-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
                  <span className="text-slate-500">Total Billed: {formatCurrency(inv.totalAmount || 0)}</span>
                  <span className="text-slate-900 dark:text-white">
                    Balance Due: {formatCurrency(inv.balanceAmount || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
