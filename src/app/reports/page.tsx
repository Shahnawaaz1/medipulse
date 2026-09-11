"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  DollarSign,
  Calendar,
  Users,
  Pill,
  Bed,
  Printer,
  Download,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#0284c7", "#0d9488", "#f59e0b", "#8b5cf6", "#ec4899", "#10b981"];

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<
    "financial" | "appointments" | "patients" | "pharmacy" | "beds"
  >("financial");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (type: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/reports?type=${type}`);
      if (res.ok) {
        const json = await res.json();
        setData(json.data || {});
      }
    } catch {
      toast.error("Failed to load analytical report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hospital Analytics & Executive Reports
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive business intelligence, department performance, bed turns, and financial audits
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Printer className="h-4 w-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
        {[
          { id: "financial", label: "Financial & Revenue", icon: DollarSign },
          { id: "appointments", label: "Appointment Trends", icon: Calendar },
          { id: "patients", label: "Patient Demographics", icon: Users },
          { id: "pharmacy", label: "Pharmacy Stock Valuation", icon: Pill },
          { id: "beds", label: "Bed Occupancy Metrics", icon: Bed },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-800 dark:text-slate-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <LoadingSpinner label="Compiling analytical charts and records..." />
      ) : (
        <div className="space-y-6">
          {/* Financial Tab */}
          {activeTab === "financial" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-400 uppercase">Total Billed</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {formatCurrency(data?.totals?.totalBilled)}
                  </p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm dark:bg-emerald-950/30 dark:border-emerald-900">
                  <p className="text-xs font-semibold text-emerald-700 uppercase">Total Collected</p>
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                    {formatCurrency(data?.totals?.totalCollected)}
                  </p>
                </div>
                <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm dark:bg-rose-950/30 dark:border-rose-900">
                  <p className="text-xs font-semibold text-rose-700 uppercase">Outstanding Dues</p>
                  <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                    {formatCurrency(data?.totals?.totalOutstanding)}
                  </p>
                </div>
              </div>

              {/* Monthly Collections Bar Chart */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                  Monthly Revenue vs Cash Collections
                </h3>
                <div className="mt-4 h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.monthlyRevenue || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `$${v / 1000}k`}
                      />
                      <Tooltip
                        formatter={(v: any) => formatCurrency(v)}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderRadius: "12px",
                          color: "#fff",
                        }}
                      />
                      <Bar dataKey="revenue" fill="#0284c7" radius={[6, 6, 0, 0]} name="Total Billed" />
                      <Bar dataKey="collections" fill="#10b981" radius={[6, 6, 0, 0]} name="Collections" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === "appointments" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                  Appointment Status Distribution
                </h3>
                <div className="mt-4 h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.statusBreakdown || []}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="count"
                        nameKey="status"
                        label={(entry) => `${entry.status}: ${entry.count}`}
                      >
                        {(data?.statusBreakdown || []).map((_: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Patients Tab */}
          {activeTab === "patients" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                  Patient Blood Group Roster
                </h3>
                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.bloodGroupDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="bloodGroup" tickLine={false} />
                      <YAxis tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#f43f5e" radius={[6, 6, 0, 0]} name="Patients" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                  Gender Distribution
                </h3>
                <div className="mt-4 h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.genderDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        dataKey="count"
                        nameKey="gender"
                        label={(entry) => `${entry.gender}: ${entry.count}`}
                      >
                        <Cell fill="#0284c7" />
                        <Cell fill="#ec4899" />
                        <Cell fill="#8b5cf6" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Pharmacy Tab */}
          {activeTab === "pharmacy" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <p className="text-xs font-semibold text-slate-400 uppercase">
                  Total Pharmacy Inventory Valuation
                </p>
                <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                  {formatCurrency(data?.totalStockValue || 0)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 pb-3 dark:border-slate-800">
                  Low Stock Drug Re-order Alerts
                </h3>
                <div className="mt-4 space-y-2">
                  {data?.lowStockItems?.map((m: any) => (
                    <div
                      key={m._id}
                      className="flex items-center justify-between rounded-xl bg-amber-50 p-3 text-xs dark:bg-amber-950/40"
                    >
                      <span className="font-bold text-amber-900 dark:text-amber-200">{m.name}</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-400">
                        {m.stockQuantity} units left (Min threshold: {m.minThreshold})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Beds Tab */}
          {activeTab === "beds" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm dark:bg-emerald-950/30">
                <p className="text-xs font-semibold text-emerald-700 uppercase">Available Beds</p>
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
                  {data?.available || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm dark:bg-rose-950/30">
                <p className="text-xs font-semibold text-rose-700 uppercase">Occupied Beds</p>
                <p className="text-2xl font-bold text-rose-700 dark:text-rose-300 mt-1">
                  {data?.occupied || 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-100 p-5 shadow-sm dark:bg-slate-800">
                <p className="text-xs font-semibold text-slate-600 uppercase">Under Maintenance</p>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
                  {data?.maintenance || 0}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
