"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Calendar,
  Bed,
  DollarSign,
  TrendingUp,
  Stethoscope,
  Activity,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  UserPlus,
  Hotel,
  Receipt,
  FileSignature,
  Sparkles,
  QrCode,
  Video,
  Globe,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import Link from "next/link";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { QuickActionModal } from "@/components/layout/QuickActionModal";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quickActionOpen, setQuickActionOpen] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const res = await fetch("/api/dashboard/stats");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to load dashboard stats", e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return <LoadingSpinner label="Loading hospital operations dashboard..." />;
  }

  const stats = data?.stats || {};
  const revenueAnalytics = data?.revenueAnalytics || [];
  const departmentDistribution = data?.departmentDistribution || [];
  const recentAppointments = data?.recentAppointments || [];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute right-0 top-0 -mt-8 -mr-8 h-64 w-64 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-8 h-48 w-48 rounded-full bg-teal-500/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md border border-white/10">
            <Activity className="h-3.5 w-3.5 text-teal-400 animate-pulse" />
            <span>Hospital Operations & Clinical AI Active</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            MediPulse Executive Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Real-time monitoring of patient admissions, clinical queue, doctor schedules, diagnostics, ABHA records, and revenue.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20 transition-all shadow-sm"
          >
            <Globe className="h-4 w-4 text-teal-300" />
            <span>Public Website</span>
          </Link>
          <button
            onClick={() => setQuickActionOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/30 hover:brightness-110 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Quick Action</span>
          </button>
        </div>
      </div>

      {/* Smart Healthcare Hub Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/ai-assistant"
          className="group relative flex items-center justify-between rounded-2xl bg-gradient-to-br from-purple-500/10 via-brand-500/5 to-purple-500/10 border border-purple-500/20 p-4 transition-all hover:shadow-lg hover:border-purple-500/40"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-500/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">AI Doctor Co-Pilot</h4>
                <span className="rounded-full bg-purple-100 dark:bg-purple-950 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:text-purple-300">
                  AI 2.0
                </span>
              </div>
              <p className="text-xs text-slate-500">Symptom analysis, differential diagnosis & RX</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-purple-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        <Link
          href="/abha"
          className="group relative flex items-center justify-between rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 p-4 transition-all hover:shadow-lg hover:border-emerald-500/40"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/30">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">ABDM & ABHA Cards</h4>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-300">
                  M3 Certified
                </span>
              </div>
              <p className="text-xs text-slate-500">14-digit ABHA creation, QR & Care contexts</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-emerald-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        <Link
          href="/teleconsultation"
          className="group relative flex items-center justify-between rounded-2xl bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-sky-500/10 border border-sky-500/20 p-4 transition-all hover:shadow-lg hover:border-sky-500/40"
        >
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-600 text-white shadow-md shadow-sky-500/30">
              <Video className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Teleconsultation Room</h4>
                <span className="rounded-full bg-sky-100 dark:bg-sky-950 px-2 py-0.5 text-[10px] font-extrabold text-sky-700 dark:text-sky-300">
                  HD Live
                </span>
              </div>
              <p className="text-xs text-slate-500">Virtual clinic, WebRTC video & instant e-Rx</p>
            </div>
          </div>
          <ArrowUpRight className="h-5 w-5 text-sky-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      </div>

      {/* KPI Stats 4-Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Registered Patients"
          value={stats.totalPatients || 0}
          subtitle="+12% from last month"
          trend={{ value: "+12%", isPositive: true }}
          icon={Users}
          colorScheme="blue"
        />
        <StatCard
          title="Today's Appointments"
          value={stats.todayAppointments || 0}
          subtitle="8 pending check-in"
          trend={{ value: "Live Queue", isPositive: true }}
          icon={Calendar}
          colorScheme="teal"
        />
        <StatCard
          title="Bed Occupancy"
          value={`${stats.occupiedBeds || 0} / ${stats.totalBeds || 0}`}
          subtitle={`${stats.bedOccupancyRate || 0}% Occupied`}
          trend={{ value: `${stats.bedOccupancyRate || 0}%`, isPositive: stats.bedOccupancyRate < 90 }}
          icon={Bed}
          colorScheme="indigo"
        />
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue || 0)}
          subtitle="+18.4% monthly growth"
          trend={{ value: "+18.4%", isPositive: true }}
          icon={DollarSign}
          colorScheme="emerald"
        />
      </div>

      {/* Charts & Graphs Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue Analytics Area Chart */}
        <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Revenue & Financial Performance
              </h3>
              <p className="text-xs text-slate-400">
                Monthly trends for OPD, IPD, Pharmacy, and Diagnostics
              </p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="hidden sm:flex items-center gap-2.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-sky-500"></span> Total</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-teal-500"></span> IPD</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-500"></span> OPD</span>
                <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-purple-500"></span> Pharmacy</span>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full dark:bg-emerald-950/60 dark:text-emerald-400">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>+18.4% Growth</span>
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={revenueAnalytics}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorIpd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOpd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  tickFormatter={(val) => `₹${val >= 1000 ? Math.round(val / 1000) + 'k' : val}`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatCurrency(Number(value)),
                    name === "revenue" || name === "amount" ? "Total Revenue" : String(name).toUpperCase(),
                  ]}
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Total Revenue"
                  stroke="#0284c7"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
                <Area
                  type="monotone"
                  dataKey="ipd"
                  name="IPD Admissions"
                  stroke="#14b8a6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorIpd)"
                />
                <Area
                  type="monotone"
                  dataKey="opd"
                  name="OPD Consultations"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorOpd)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Patient Distribution */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Department Patient Load
            </h3>
            <p className="text-xs text-slate-400">
              Active patient volume across clinical specialities
            </p>
          </div>

          <div className="h-48 w-full my-4 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={departmentDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {departmentDistribution.map((entry: any, index: number) => {
                    const colors = ["#0284c7", "#14b8a6", "#6366f1", "#f59e0b", "#ec4899", "#8b5cf6"];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2">
            {departmentDistribution.slice(0, 4).map((dept: any, idx: number) => {
              const colors = ["bg-sky-500", "bg-teal-500", "bg-indigo-500", "bg-amber-500"];
              return (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${colors[idx % colors.length]}`} />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {dept.name}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {dept.value} Patients
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Appointments & Live OPD Matrix */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Appointments Table */}
        <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Today's Appointments & Consultations
              </h3>
              <p className="text-xs text-slate-400">
                Live patient appointments scheduled for today
              </p>
            </div>
            <Link
              href="/appointments"
              className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              <span>View All</span>
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3 font-semibold">Patient</th>
                  <th className="py-3 px-3 font-semibold">Doctor & Dept</th>
                  <th className="py-3 px-3 font-semibold">Time Slot</th>
                  <th className="py-3 px-3 font-semibold">Type</th>
                  <th className="py-3 px-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {recentAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-400">
                      No appointments found for today.
                    </td>
                  </tr>
                ) : (
                  recentAppointments.map((apt: any) => (
                    <tr key={apt._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {apt.patient?.name || "Unknown Patient"}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {apt.patient?.patientId || "PID-N/A"}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {apt.doctor?.name || "Dr. Unassigned"}
                        </div>
                        <div className="text-[10px] text-slate-400">{apt.department}</div>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-600 dark:text-slate-400">
                        {apt.timeSlot}
                      </td>
                      <td className="py-3 px-3">
                        <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {apt.type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={apt.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Quick Links Panel */}
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Emergency & Quick Actions
            </h3>
            <p className="text-xs text-slate-400">One-click hospital workflows</p>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <Link
              href="/patients/new"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs font-bold text-slate-800 transition-all hover:border-brand-500 hover:bg-brand-50/50 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
                <UserPlus className="h-4 w-4" />
              </div>
              <div>
                <p>Register New Patient</p>
                <p className="text-[10px] font-normal text-slate-400">With instant ABHA Linking</p>
              </div>
            </Link>

            <Link
              href="/appointments/schedule"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs font-bold text-slate-800 transition-all hover:border-teal-500 hover:bg-teal-50/50 hover:text-teal-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p>Doctor Slot Matrix</p>
                <p className="text-[10px] font-normal text-slate-400">View live OPD schedules</p>
              </div>
            </Link>

            <Link
              href="/beds"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs font-bold text-slate-800 transition-all hover:border-indigo-500 hover:bg-indigo-50/50 hover:text-indigo-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
                <Bed className="h-4 w-4" />
              </div>
              <div>
                <p>Bed Occupancy Radar</p>
                <p className="text-[10px] font-normal text-slate-400">ICU, Deluxe & General wards</p>
              </div>
            </Link>

            <Link
              href="/billing"
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/50 p-3 text-xs font-bold text-slate-800 transition-all hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-700 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 text-white">
                <Receipt className="h-4 w-4" />
              </div>
              <div>
                <p>TPA & Invoicing Desk</p>
                <p className="text-[10px] font-normal text-slate-400">Cashless claims & GST bills</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      <QuickActionModal isOpen={quickActionOpen} onClose={() => setQuickActionOpen(false)} />
    </div>
  );
}
