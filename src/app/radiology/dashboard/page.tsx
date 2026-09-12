"use client";

import React, { useEffect, useState } from "react";
import {
  ScanLine,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function RadiologyDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRadData() {
      try {
        setLoading(true);
        const res = await fetch("/api/radiology");
        if (res.ok) {
          const d = await res.json();
          setOrders(d.orders || []);
        }
      } catch (e) {
        console.error("Failed to load radiology data", e);
      } finally {
        setLoading(false);
      }
    }
    loadRadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-r from-sky-700 via-sky-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-sky-500/30 px-3 py-0.5 text-xs font-bold text-sky-200 border border-sky-400/30">
                Radiology & Diagnostic Imaging
              </span>
              <span className="text-xs text-sky-300">Modality: MRI, CT Scan, X-Ray & Ultrasound</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              Imaging Console — {user?.name || "Radiologist"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-sky-100/80 max-w-xl">
              Manage incoming scan requisitions, schedule patient imaging appointments, and upload radiologist findings.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/radiology"
              className="flex items-center gap-2 rounded-xl bg-white text-sky-900 px-4 py-2.5 text-xs font-bold shadow-lg hover:bg-sky-50 transition-all"
            >
              <ScanLine className="h-4 w-4 text-sky-600" />
              <span>Imaging Scans Queue</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Scans Ordered"
          value={orders.length}
          icon={ScanLine}
          change="MRI / CT / X-Ray / USG"
          trend="up"
        />
        <StatCard
          title="Pending Imaging"
          value={orders.filter((o) => o.status !== "Completed").length}
          icon={Clock}
          change="In schedule queue"
          trend="neutral"
        />
        <StatCard
          title="Reports Completed"
          value={orders.filter((o) => o.status === "Completed").length}
          icon={CheckCircle2}
          change="Verified scans"
          trend="up"
        />
        <StatCard
          title="Active Modalities"
          value="4 Wings"
          icon={Sparkles}
          change="DICOM & PACS enabled"
          trend="neutral"
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Radiology & Imaging Orders
            </h2>
            <p className="text-xs text-slate-400">Ordered scans across OPD and Inpatient wards</p>
          </div>
          <Link
            href="/radiology"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 flex items-center gap-1"
          >
            <span>Full Imaging Desk</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {orders.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-400">No radiology orders recorded</p>
          ) : (
            orders.slice(0, 6).map((ord: any) => (
              <div
                key={ord._id}
                className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-xs font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    RAD
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      {ord.orderId} • {ord.patient?.name || "Patient"}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Modality: {ord.modality || "X-Ray"} • Body Part: {ord.bodyPart || "Chest"} • Doctor: {ord.doctor?.name || "Physician"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={ord.status || "Scheduled"} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
