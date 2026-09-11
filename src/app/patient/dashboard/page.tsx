"use client";

import React, { useEffect, useState } from "react";
import {
  HeartPulse,
  Calendar,
  FileText,
  FlaskConical,
  CreditCard,
  UserCheck,
  Video,
  QrCode,
  ArrowRight,
  Clock,
  ShieldCheck,
  Phone,
  Plus,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatientData() {
      try {
        setLoading(true);
        const [aptRes, rxRes, invRes, labRes] = await Promise.all([
          fetch("/api/appointments"),
          fetch("/api/prescriptions"),
          fetch("/api/billing"),
          fetch("/api/laboratory"),
        ]);

        if (aptRes.ok) {
          const d = await aptRes.json();
          setAppointments(d.appointments || []);
        }
        if (rxRes.ok) {
          const d = await rxRes.json();
          setPrescriptions(d.prescriptions || []);
        }
        if (invRes.ok) {
          const d = await invRes.json();
          setInvoices(d.invoices || []);
        }
        if (labRes.ok) {
          const d = await labRes.json();
          setLabOrders(d.orders || []);
        }
      } catch (e) {
        console.error("Failed to load patient portal data", e);
      } finally {
        setLoading(false);
      }
    }
    loadPatientData();
  }, []);

  if (loading) return <LoadingSpinner />;

  const upcomingApts = appointments.filter((a) => a.status !== "Cancelled");
  const pendingBills = invoices.filter((i) => i.paymentStatus !== "Paid");

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-teal-700 via-brand-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-teal-400/20 px-3 py-0.5 text-xs font-bold text-teal-200 border border-teal-400/30">
                Patient Health Portal
              </span>
              <span className="text-xs text-teal-300">
                Patient ID: {user?.patientId || "PAT-8001"}
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              Hello, {user?.name || "Valued Patient"}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-teal-100/80 max-w-xl">
              Welcome to your personal MediPulse healthcare portal. View your clinical records, book doctor appointments, track prescriptions, and access reports securely.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/patient/appointments"
              className="flex items-center gap-2 rounded-xl bg-white text-teal-900 px-4 py-2.5 text-xs font-extrabold shadow-lg hover:bg-teal-50 transition-all"
            >
              <Plus className="h-4 w-4 text-teal-600" />
              <span>Book Appointment</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Patient Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Upcoming Appointments"
          value={upcomingApts.length}
          icon={Calendar}
          change="Scheduled visits"
          trend="up"
        />
        <StatCard
          title="Active Prescriptions"
          value={prescriptions.length}
          icon={FileText}
          change="Doctor e-Prescriptions"
          trend="neutral"
        />
        <StatCard
          title="Lab & Diagnostic Reports"
          value={labOrders.length}
          icon={FlaskConical}
          change="Pathology & Radiology"
          trend="neutral"
        />
        <StatCard
          title="Pending Invoices"
          value={pendingBills.length}
          icon={CreditCard}
          change={pendingBills.length === 0 ? "All settled" : "Due for payment"}
          trend={pendingBills.length === 0 ? "up" : "down"}
        />
      </div>

      {/* Main Grid: Appointments and Prescriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Appointments Section */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                My Appointments
              </h2>
              <p className="text-xs text-slate-400">Doctor consultations and OPD schedules</p>
            </div>
            <Link
              href="/patient/appointments"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {appointments.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No appointments scheduled</p>
                <Link
                  href="/patient/appointments"
                  className="mt-2 inline-block text-xs font-bold text-teal-600 hover:underline"
                >
                  Book your first appointment
                </Link>
              </div>
            ) : (
              appointments.slice(0, 4).map((apt: any) => (
                <div
                  key={apt._id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      <Calendar className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">
                        {apt.doctor?.name || "Hospital Physician"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {apt.doctor?.department || "Department"} • {apt.appointmentDate} ({apt.timeSlot})
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={apt.status || "Confirmed"} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Prescriptions Section */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                My Recent Prescriptions
              </h2>
              <p className="text-xs text-slate-400">Electronic medication orders</p>
            </div>
            <Link
              href="/patient/prescriptions"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 dark:text-teal-400 flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {prescriptions.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No active prescriptions</p>
            ) : (
              prescriptions.slice(0, 3).map((rx: any) => (
                <div
                  key={rx._id}
                  className="rounded-xl border border-slate-100 p-3.5 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      {rx.prescriptionId || "Rx Record"}
                    </p>
                    <span className="text-[10px] text-slate-400">{rx.date}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Doctor: {rx.doctor?.name || "Attending Physician"} • Diagnosis: {rx.diagnosis || "General Consultation"}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    {rx.medicines?.map((m: any, i: number) => (
                      <span
                        key={i}
                        className="rounded-lg bg-teal-50 px-2 py-0.5 text-[10px] font-semibold text-teal-700 dark:bg-teal-950 dark:text-teal-300"
                      >
                        {m.name || m.medicine} ({m.dosage})
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Services Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/abha"
          className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">
              ABHA Health Card (ABDM)
            </h3>
            <p className="text-[11px] text-slate-400">Ayushman Bharat Digital Health ID</p>
          </div>
        </Link>

        <Link
          href="/teleconsultation"
          className="flex items-center gap-3 p-4 rounded-2xl border border-slate-200 bg-white hover:border-teal-500 hover:shadow-md transition-all dark:border-slate-800 dark:bg-slate-900 group"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-500 group-hover:text-white transition-colors">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-white">
              Video Teleconsultation
            </h3>
            <p className="text-[11px] text-slate-400">Direct call with your doctor</p>
          </div>
        </Link>

        <div className="flex items-center gap-3 p-4 rounded-2xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/40 dark:bg-rose-950/20">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500 text-white shrink-0">
            <Phone className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-rose-900 dark:text-rose-200">
              Emergency Hotline 24x7
            </h3>
            <a
              href="tel:18009110000"
              className="text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:underline"
            >
              +91 1800-911-0000
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
