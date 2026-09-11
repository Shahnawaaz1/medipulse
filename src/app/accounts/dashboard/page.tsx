"use client";

import React, { useEffect, useState } from "react";
import {
  DollarSign,
  Receipt,
  TrendingUp,
  FileCheck2,
  Users,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function AccountsDashboardPage() {
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ totalBilled: 0, totalCollected: 0, totalPending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccountsData() {
      try {
        setLoading(true);
        const res = await fetch("/api/billing");
        if (res.ok) {
          const d = await res.json();
          setInvoices(d.invoices || []);
          if (d.summary) setSummary(d.summary);
        }
      } catch (e) {
        console.error("Failed to load accounts data", e);
      } finally {
        setLoading(false);
      }
    }
    loadAccountsData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/30 px-3 py-0.5 text-xs font-bold text-indigo-200 border border-indigo-400/30">
                Finance & Billing Operations
              </span>
              <span className="text-xs text-indigo-300">Desk: Accounts & TPA Claims</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              Financial Station — {user?.name || "Accountant"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-indigo-100/80 max-w-xl">
              Track real-time OPD/IPD billings, insurance TPA claims, patient settlements, and revenue reconciliation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/billing"
              className="flex items-center gap-2 rounded-xl bg-white text-indigo-900 px-4 py-2.5 text-xs font-bold shadow-lg hover:bg-indigo-50 transition-all"
            >
              <Receipt className="h-4 w-4 text-indigo-600" />
              <span>Create New Invoice</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Billed"
          value={formatCurrency(summary.totalBilled || 0)}
          icon={Receipt}
          change={`${invoices.length} Invoices`}
          trend="up"
        />
        <StatCard
          title="Collected Revenue"
          value={formatCurrency(summary.totalCollected || 0)}
          icon={TrendingUp}
          change="Realized cash & online"
          trend="up"
        />
        <StatCard
          title="Outstanding Receivables"
          value={formatCurrency(summary.totalPending || 0)}
          icon={DollarSign}
          change="Pending settlements"
          trend="down"
        />
        <StatCard
          title="TPA Claims Active"
          value={8}
          icon={FileCheck2}
          change="Insurance processing"
          trend="neutral"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Invoices & Payment Status
              </h2>
              <p className="text-xs text-slate-400">Live ledger of billing transactions</p>
            </div>
            <Link
              href="/billing"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
            >
              <span>Manage Invoices</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {invoices.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No invoices recorded</p>
            ) : (
              invoices.slice(0, 6).map((inv: any) => (
                <div
                  key={inv._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                      ₹
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {inv.invoiceNumber} • {inv.patient?.name || "Patient"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Date: {inv.invoiceDate} • Total: {formatCurrency(inv.totalAmount || 0)} • Balance: {formatCurrency(inv.balanceAmount || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={inv.paymentStatus || "Pending"} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Financial Actions
            </h2>
            <div className="space-y-2">
              <Link
                href="/billing"
                className="flex items-center justify-between p-3 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors dark:bg-indigo-950 dark:text-indigo-300"
              >
                <div className="flex items-center gap-2.5">
                  <CreditCard className="h-4 w-4" />
                  <span>Process Payment Counter</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/reports?type=financial"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
              >
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  <span>Financial Analytics & Reports</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
