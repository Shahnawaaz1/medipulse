"use client";

import React, { useEffect, useState } from "react";
import {
  Hotel,
  Bed,
  Users,
  Activity,
  HeartPulse,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function NurseDashboardPage() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNurseData() {
      try {
        setLoading(true);
        const [admRes, bedRes] = await Promise.all([
          fetch("/api/admissions"),
          fetch("/api/beds"),
        ]);
        if (admRes.ok) {
          const d = await admRes.json();
          setAdmissions(d.admissions || []);
        }
        if (bedRes.ok) {
          const d = await bedRes.json();
          setBeds(d.beds || []);
        }
      } catch (e) {
        console.error("Failed to load nurse data", e);
      } finally {
        setLoading(false);
      }
    }
    loadNurseData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
  const availableBeds = beds.filter((b) => b.status === "Available").length;
  const activeAdmissions = admissions.filter((a) => a.status === "Admitted");

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-700 via-rose-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-500/30 px-3 py-0.5 text-xs font-bold text-rose-200 border border-rose-400/30">
                Nursing Station & Inpatient Care
              </span>
              <span className="text-xs text-rose-300">Ward: {user?.department || "General Ward & ICU"}</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              Nursing Console — {user?.name || "Staff Nurse"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-rose-100/80 max-w-xl">
              Monitor active IPD admissions, bed allocations, vitals recording, and medication schedules across your assigned hospital wing.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/beds"
              className="flex items-center gap-2 rounded-xl bg-white text-rose-900 px-4 py-2.5 text-xs font-bold shadow-lg hover:bg-rose-50 transition-all"
            >
              <Bed className="h-4 w-4 text-rose-600" />
              <span>Live Bed Matrix</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Inpatients"
          value={activeAdmissions.length}
          icon={Hotel}
          change="Admitted in wards"
          trend="neutral"
        />
        <StatCard
          title="Occupied Beds"
          value={occupiedBeds}
          icon={Bed}
          change={`${beds.length} Total beds`}
          trend="up"
        />
        <StatCard
          title="Available Beds"
          value={availableBeds}
          icon={Bed}
          change="Ready for admission"
          trend="neutral"
        />
        <StatCard
          title="Critical Alerts"
          value={2}
          icon={Activity}
          change="Vitals check required"
          trend="down"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Admissions List */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Current Inpatient Ward Patients
              </h2>
              <p className="text-xs text-slate-400">Patients admitted under nursing supervision</p>
            </div>
            <Link
              href="/ipd"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 flex items-center gap-1"
            >
              <span>Full IPD Register</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {activeAdmissions.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No current admissions</p>
            ) : (
              activeAdmissions.slice(0, 6).map((adm: any) => (
                <div
                  key={adm._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-xs font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                      {adm.bed?.bedNumber || "Bed"}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {adm.patient?.name || "Patient Record"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Room: {adm.bed?.roomNumber || "General"} • Ward: {adm.bed?.ward || "Main"} • Dr: {adm.doctor?.name || "Attending"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={adm.status || "Admitted"} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Nursing Shortcuts */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Ward Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href="/beds"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 transition-colors text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950 dark:hover:text-rose-300"
              >
                <div className="flex items-center gap-2.5">
                  <Bed className="h-4 w-4 text-rose-600" />
                  <span>Update Bed Status</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/patients"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 transition-colors text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950 dark:hover:text-rose-300"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-brand-600" />
                  <span>Check Patient Vitals</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/prescriptions"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-rose-50 hover:text-rose-700 transition-colors text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950 dark:hover:text-rose-300"
              >
                <div className="flex items-center gap-2.5">
                  <ClipboardList className="h-4 w-4 text-teal-600" />
                  <span>View Medication Administration</span>
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
