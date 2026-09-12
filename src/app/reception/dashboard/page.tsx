"use client";

import React, { useEffect, useState } from "react";
import {
  UserPlus,
  Calendar,
  Stethoscope,
  Clock,
  Users,
  Search,
  ArrowUpRight,
  CheckCircle2,
  Phone,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function ReceptionDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [opdQueue, setOpdQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReceptionData() {
      try {
        setLoading(true);
        const [aptRes, opdRes] = await Promise.all([
          fetch("/api/appointments"),
          fetch("/api/opd"),
        ]);
        if (aptRes.ok) {
          const d = await aptRes.json();
          setAppointments(d.appointments || []);
        }
        if (opdRes.ok) {
          const d = await opdRes.json();
          setOpdQueue(d.records || []);
        }
      } catch (e) {
        console.error("Failed to load reception data", e);
      } finally {
        setLoading(false);
      }
    }
    loadReceptionData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-700 via-purple-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-purple-500/30 px-3 py-0.5 text-xs font-bold text-purple-200 border border-purple-400/30">
                Front Desk & Registration Hub
              </span>
              <span className="text-xs text-purple-300">Desk: Central Reception Desk #1</span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              Reception Desk — {user?.name || "Front Desk"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-purple-100/80 max-w-xl">
              Register walk-in patients, manage appointment bookings, check-in OPD queues, and assist visitors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/patients/new"
              className="flex items-center gap-2 rounded-xl bg-white text-purple-900 px-4 py-2.5 text-xs font-bold shadow-lg hover:bg-purple-50 transition-all"
            >
              <UserPlus className="h-4 w-4 text-purple-600" />
              <span>Register New Patient</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Bookings"
          value={appointments.length}
          icon={Calendar}
          change="Scheduled visits"
          trend="up"
        />
        <StatCard
          title="OPD Tokens Active"
          value={opdQueue.length}
          icon={Stethoscope}
          change="In queue & consult"
          trend="neutral"
        />
        <StatCard
          title="Doctor Schedules"
          value="16 Active"
          icon={Clock}
          change="Available on floor"
          trend="up"
        />
        <StatCard
          title="Emergency Hotline"
          value="24x7 Ready"
          icon={Phone}
          change="+91 1800-911-0000"
          trend="neutral"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Desk Schedule */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Upcoming Appointment Check-Ins
              </h2>
              <p className="text-xs text-slate-400">Arriving patients ready for token allocation</p>
            </div>
            <Link
              href="/appointments"
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 flex items-center gap-1"
            >
              <span>View Desk</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {appointments.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No appointments scheduled</p>
            ) : (
              appointments.slice(0, 6).map((apt: any) => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-xs font-bold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {apt.timeSlot ? apt.timeSlot.split(" ")[0] : "Slot"}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {apt.patient?.name || "Patient Record"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Doctor: {apt.doctor?.name || "Attending"} • {apt.doctor?.department || "OPD"} • Slot: {apt.timeSlot}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={apt.status || "Confirmed"} />
                    <Link
                      href="/opd"
                      className="rounded-lg bg-purple-50 px-2.5 py-1 text-[11px] font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300"
                    >
                      Check-In
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Front Desk Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href="/patients/new"
                className="flex items-center justify-between p-3 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs hover:bg-purple-100 transition-colors dark:bg-purple-950 dark:text-purple-300"
              >
                <div className="flex items-center gap-2.5">
                  <UserPlus className="h-4 w-4" />
                  <span>Register Walk-in Patient</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/opd"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:text-purple-700 transition-colors text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-purple-950 dark:hover:text-purple-300"
              >
                <div className="flex items-center gap-2.5">
                  <Stethoscope className="h-4 w-4 text-teal-600" />
                  <span>Issue Live OPD Token</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/appointments/schedule"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:text-purple-700 transition-colors text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-purple-950 dark:hover:text-purple-300"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-sky-600" />
                  <span>Check Doctor Rosters</span>
                </div>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/beds"
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50 hover:text-purple-700 transition-colors text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-purple-950 dark:hover:text-purple-300"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 text-brand-600" />
                  <span>Bed Availability Matrix</span>
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
