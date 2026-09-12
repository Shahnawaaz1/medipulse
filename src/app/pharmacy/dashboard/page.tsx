"use client";

import React, { useEffect, useState } from "react";
import {
  Pill,
  FileText,
  Package,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  TrendingDown,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function PharmacyDashboardPage() {
  const { user } = useAuth();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPharmacyData() {
      try {
        setLoading(true);
        const [medRes, rxRes] = await Promise.all([
          fetch("/api/medicines"),
          fetch("/api/prescriptions"),
        ]);
        if (medRes.ok) {
          const d = await medRes.json();
          setMedicines(d.medicines || []);
        }
        if (rxRes.ok) {
          const d = await rxRes.json();
          setPrescriptions(d.prescriptions || []);
        }
      } catch (e) {
        console.error("Failed to load pharmacy data", e);
      } finally {
        setLoading(false);
      }
    }
    loadPharmacyData();
  }, []);

  const lowStock = medicines.filter((m) => (m.stockQuantity || 0) < 50);
  const pendingRx = prescriptions.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-700 via-amber-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-amber-500/30 px-3 py-0.5 text-xs font-bold text-amber-200 border border-amber-400/30">
                Pharmacy & Medicine Dispensing Unit
              </span>
              <span className="text-xs text-amber-300">Unit: Main Central Pharmacy</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              Pharmacy Station — {user?.name || "Pharmacist"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-amber-100/80 max-w-xl">
              Process electronic doctor prescriptions, dispense medication batches, monitor inventory stock levels, and prevent out-of-stock events.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/pharmacy"
              className="flex items-center gap-2 rounded-xl bg-white text-amber-900 px-4 py-2.5 text-xs font-bold shadow-lg hover:bg-amber-50 transition-all"
            >
              <Pill className="h-4 w-4 text-amber-600" />
              <span>Dispense Medicine (POS)</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Catalog Medicines"
          value={medicines.length}
          icon={Pill}
          change="Available in formulary"
          trend="up"
        />
        <StatCard
          title="Pending Dispensing"
          value={prescriptions.length}
          icon={FileText}
          change="Awaiting pickup"
          trend="neutral"
        />
        <StatCard
          title="Low Stock Alerts"
          value={lowStock.length}
          icon={AlertTriangle}
          change="Below reorder threshold"
          trend="down"
        />
        <StatCard
          title="Stock Valuation"
          value={formatCurrency(450000)}
          icon={Package}
          change="Active pharmacy inventory"
          trend="up"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Electronic Prescriptions */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Recent Doctor Prescriptions for Dispensing
              </h2>
              <p className="text-xs text-slate-400">Electronic Rx queues submitted by OPD/IPD physicians</p>
            </div>
            <Link
              href="/prescriptions"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
            >
              <span>All Prescriptions</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {pendingRx.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No prescriptions found</p>
            ) : (
              pendingRx.map((rx: any) => (
                <div
                  key={rx._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-xs font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                      Rx
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {rx.patient?.name || "Patient"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Prescribed by: {rx.doctor?.name || "Doctor"} • {rx.medicines?.length || 0} items • Diagnosis: {rx.diagnosis || "Consultation"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/pharmacy"
                      className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600 shadow-sm transition-all"
                    >
                      Dispense Now
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span>Low Stock Reorders</span>
            </h2>
            <div className="space-y-2.5">
              {lowStock.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">All stock levels healthy</p>
              ) : (
                lowStock.slice(0, 5).map((med: any) => (
                  <div
                    key={med._id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/40 dark:bg-amber-950/30 dark:border-amber-900/30"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                        {med.name}
                      </p>
                      <p className="text-[10px] text-slate-400">{med.category || "Tablet"}</p>
                    </div>
                    <span className="rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-extrabold px-2 py-0.5">
                      {med.stockQuantity || 0} Left
                    </span>
                  </div>
                ))
              )}
              <Link
                href="/inventory"
                className="block text-center mt-3 text-xs font-bold text-amber-600 hover:underline dark:text-amber-400"
              >
                Go to Inventory Supplies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
