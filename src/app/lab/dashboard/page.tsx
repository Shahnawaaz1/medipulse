"use client";

import React, { useEffect, useState } from "react";
import {
  FlaskConical,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function LabDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalOrders: 0, pending: 0, completed: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLabData() {
      try {
        setLoading(true);
        const res = await fetch("/api/laboratory");
        if (res.ok) {
          const d = await res.json();
          setOrders(d.orders || []);
          if (d.stats) setStats(d.stats);
        }
      } catch (e) {
        console.error("Failed to load lab data", e);
      } finally {
        setLoading(false);
      }
    }
    loadLabData();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-200 border border-emerald-400/30">
                Pathology Laboratory
              </span>
              <span className="text-xs text-emerald-300">Section: Diagnostic Pathology & Biochemistry</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              Lab Workstation — {user?.name || "Lab Technician"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-emerald-100/80 max-w-xl">
              Process blood, urine, and biochemical test orders, input automated analyzer readings, and release diagnostic results.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/laboratory"
              className="flex items-center gap-2 rounded-xl bg-white text-emerald-900 px-4 py-2.5 text-xs font-bold shadow-lg hover:bg-emerald-50 transition-all"
            >
              <FlaskConical className="h-4 w-4 text-emerald-600" />
              <span>Lab Test Queue</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Lab Orders"
          value={stats.totalOrders || orders.length}
          icon={FlaskConical}
          change="Diagnostic tests"
          trend="up"
        />
        <StatCard
          title="Pending Processing"
          value={stats.pending || 0}
          icon={Clock}
          change="Samples in lab"
          trend="neutral"
        />
        <StatCard
          title="Results Released"
          value={stats.completed || 0}
          icon={CheckCircle2}
          change="Report verified"
          trend="up"
        />
        <StatCard
          title="Active Test Catalog"
          value="45+ Tests"
          icon={FileText}
          change="NABL Accredited"
          trend="neutral"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Lab Test Orders
            </h2>
            <p className="text-xs text-slate-400">Specimen and test orders pending analysis</p>
          </div>
          <Link
            href="/laboratory"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
          >
            <span>Open Lab Console</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No lab orders recorded</p>
          ) : (
            orders.slice(0, 6).map((ord: any) => (
              <div
                key={ord._id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    LAB
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      {ord.orderId} • {ord.patient?.name || "Patient"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Doctor: {ord.doctor?.name || "Doctor"} • Date: {ord.orderDate} • Tests: {ord.tests?.length || 1} panel(s)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={ord.status || "Pending"} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
