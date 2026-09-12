"use client";

import React, { useEffect, useState } from "react";
import {
  Stethoscope,
  Calendar,
  Users,
  FileText,
  Clock,
  Sparkles,
  Video,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { toast } from "sonner";

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [opdQueue, setOpdQueue] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aptTab, setAptTab] = useState<"Virtual" | "In-Person">("Virtual");

  useEffect(() => {
    async function loadDoctorData() {
      try {
        setLoading(true);
        const [aptRes, opdRes, rxRes] = await Promise.all([
          fetch(`/api/appointments`),
          fetch(`/api/opd`),
          fetch(`/api/prescriptions`),
        ]);

        if (aptRes.ok) {
          const data = await aptRes.json();
          setAppointments(data.appointments || []);
        }
        if (opdRes.ok) {
          const data = await opdRes.json();
          setOpdQueue(data.records || []);
        }
        if (rxRes.ok) {
          const data = await rxRes.json();
          setPrescriptions(data.prescriptions || []);
        }
      } catch (e) {
        console.error("Failed to load doctor clinical data", e);
      } finally {
        setLoading(false);
      }
    }
    loadDoctorData();
  }, []);

  const todayAppointments = appointments.slice(0, 5);
  const virtualAppointments = appointments.filter(
    (a) => a.consultationType === "Virtual Teleconsultation" || a.type === "Teleconsultation"
  );
  const inPersonAppointments = appointments.filter(
    (a) => a.consultationType !== "Virtual Teleconsultation" && a.type !== "Teleconsultation"
  );
  const activeOpd = opdQueue.filter((q) => q.status === "Waiting" || q.status === "In Consultation");

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-500/30 px-3 py-0.5 text-xs font-bold text-teal-200 border border-teal-400/30">
                Doctor Practice Workspace
              </span>
              <span className="text-xs text-teal-300">
                Dept: {user?.department || "Cardiology & General Medicine"}
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              Welcome back, {user?.name || "Doctor"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-teal-100/80 max-w-xl">
              Here is your clinical overview for today. You have {todayAppointments.length} scheduled consultations and {activeOpd.length} OPD patients waiting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/ai-assistant"
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-700 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>AI Co-Pilot</span>
            </Link>
            <Link
              href="/teleconsultation"
              className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
            >
              <Video className="h-4 w-4 text-sky-300" />
              <span>Teleconsultation</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Today's Appointments"
          value={appointments.length}
          icon={Calendar}
          change={`${todayAppointments.length} Active Slots`}
          trend="up"
        />
        <StatCard
          title="Live OPD Queue"
          value={activeOpd.length}
          icon={Stethoscope}
          change="Average wait 12 mins"
          trend="neutral"
        />
        <StatCard
          title="Prescriptions Issued"
          value={prescriptions.length}
          icon={FileText}
          change="Electronic Rx 2.0"
          trend="up"
        />
        <StatCard
          title="Teleconsult Calls"
          value={4}
          icon={Video}
          change="HD WebRTC Video"
          trend="up"
        />
      </div>

      {/* Main Grid: OPD Queue and Today's Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Active OPD Consultations */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Live OPD Consultation Queue
              </h2>
              <p className="text-xs text-slate-400">Patients checked in and waiting for consult</p>
            </div>
            <Link
              href="/opd"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 flex items-center gap-1"
            >
              <span>Manage OPD Desk</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {opdQueue.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No patients in OPD queue</p>
            ) : (
              opdQueue.slice(0, 5).map((rec: any, idx: number) => (
                <div
                  key={rec._id || idx}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      #{rec.tokenNumber || idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {rec.patient?.name || "Patient Record"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {rec.chiefComplaint || "General Checkup"} • BP: {rec.vitals?.bloodPressure || "120/80"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={rec.status || "Waiting"} />
                    <Link
                      href="/prescriptions"
                      className="rounded-lg bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300"
                    >
                      Write Rx
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Today's Appointments & Quick Tools */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Today's Scheduled Consultations
                </h2>
                <p className="text-[11px] text-slate-400">Manage virtual video clinics and in-person visits</p>
              </div>
              <Link
                href="/appointments"
                className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
              >
                View All
              </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 mt-3">
              <button
                onClick={() => setAptTab("Virtual")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  aptTab === "Virtual"
                    ? "bg-white text-sky-700 shadow-sm dark:bg-slate-900 dark:text-sky-300"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <Video className="h-3.5 w-3.5" />
                <span>Virtual Video ({virtualAppointments.length})</span>
              </button>
              <button
                onClick={() => setAptTab("In-Person")}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  aptTab === "In-Person"
                    ? "bg-white text-teal-700 shadow-sm dark:bg-slate-900 dark:text-teal-300"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                }`}
              >
                <span>🏥 In-Person ({inPersonAppointments.length})</span>
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {(aptTab === "Virtual" ? virtualAppointments : inPersonAppointments).length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  <p>No {aptTab.toLowerCase()} appointments scheduled today</p>
                </div>
              ) : (
                (aptTab === "Virtual" ? virtualAppointments : inPersonAppointments).slice(0, 5).map((apt: any) => {
                  const isVirtual = apt.consultationType === "Virtual Teleconsultation" || apt.type === "Teleconsultation";
                  const sessionRoom = apt.teleconsultationSession?.roomId || `TEL-${apt.appointmentId?.replace("APT-", "") || apt._id?.slice(-4)}`;

                  return (
                    <div
                      key={apt._id}
                      className={`flex flex-col gap-2 rounded-xl p-3 border transition-colors ${
                        isVirtual
                          ? "bg-sky-50/50 border-sky-100 dark:bg-sky-950/20 dark:border-sky-900/40"
                          : "bg-slate-50 border-slate-100 dark:bg-slate-800/60 dark:border-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-white">
                            {apt.patient?.name || "Patient Record"}
                          </p>
                          <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>{apt.timeSlot}</span>
                            <span>• {apt.reason || "General Checkup"}</span>
                          </p>
                        </div>
                        <StatusBadge status={apt.status || "Confirmed"} />
                      </div>

                      {isVirtual && apt.status !== "Completed" && (
                        <div className="flex items-center justify-between pt-2 border-t border-sky-100/70 dark:border-sky-900/30">
                          <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                            Room: {sessionRoom}
                          </span>
                          <Link
                            href={`/teleconsultation?room=${sessionRoom}&appointment=${apt.appointmentId}&role=doctor`}
                            className="rounded-lg bg-sky-600 px-3 py-1 text-[11px] font-extrabold text-white hover:bg-sky-700 transition-all flex items-center gap-1 shadow-sm"
                          >
                            <Video className="h-3 w-3" />
                            <span>Start Consultation</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
              Clinical Shortcuts
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/prescriptions"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 transition-colors text-center text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-950 dark:hover:text-brand-300"
              >
                <FileText className="h-5 w-5 mb-1 text-teal-600" />
                <span>Prescriptions</span>
              </Link>
              <Link
                href="/laboratory"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 transition-colors text-center text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-950 dark:hover:text-brand-300"
              >
                <Stethoscope className="h-5 w-5 mb-1 text-purple-600" />
                <span>Lab Orders</span>
              </Link>
              <Link
                href="/radiology"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 transition-colors text-center text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-950 dark:hover:text-brand-300"
              >
                <Sparkles className="h-5 w-5 mb-1 text-sky-600" />
                <span>Imaging Scans</span>
              </Link>
              <Link
                href="/patients"
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-700 transition-colors text-center text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-brand-950 dark:hover:text-brand-300"
              >
                <Users className="h-5 w-5 mb-1 text-brand-600" />
                <span>Patient Records</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
