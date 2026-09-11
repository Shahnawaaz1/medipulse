"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  ScanLine,
  Calendar,
  FileCheck2,
  Clock,
  Download,
  AlertCircle,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function PatientReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"LAB" | "RADIOLOGY">("LAB");
  const [labOrders, setLabOrders] = useState<any[]>([]);
  const [radOrders, setRadOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        setLoading(true);
        const [labRes, radRes] = await Promise.all([
          fetch("/api/laboratory"),
          fetch("/api/radiology"),
        ]);
        if (labRes.ok) {
          const d = await labRes.json();
          setLabOrders(d.orders || []);
        }
        if (radRes.ok) {
          const r = await radRes.json();
          setRadOrders(r.orders || []);
        }
      } catch {
        toast.error("Failed to load diagnostic reports");
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            My Diagnostic & Lab Reports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Access verified pathology blood panels, urine tests, and radiology imaging scans.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            onClick={() => setActiveTab("LAB")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "LAB"
                ? "bg-white text-emerald-700 shadow dark:bg-slate-900 dark:text-emerald-300"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            <span>Pathology Lab ({labOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("RADIOLOGY")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === "RADIOLOGY"
                ? "bg-white text-sky-700 shadow dark:bg-slate-900 dark:text-sky-300"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <ScanLine className="h-4 w-4" />
            <span>Radiology & Scans ({radOrders.length})</span>
          </button>
        </div>
      </div>

      {activeTab === "LAB" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {labOrders.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No Pathology Reports Yet"
              description="When your doctor orders blood tests or lab diagnostics, results will be published here securely."
            />
          ) : (
            <div className="space-y-4">
              {labOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-white">
                          {ord.orderId}
                        </span>
                        <span className="text-[11px] text-slate-400">• Ordered: {ord.orderDate}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Doctor: {ord.doctor?.name || "Consultant"}
                      </p>
                    </div>
                    <StatusBadge status={ord.status || "Pending"} />
                  </div>

                  {ord.tests && ord.tests.length > 0 && (
                    <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                        Test Panels & Results
                      </p>
                      <div className="space-y-1">
                        {ord.tests.map((t: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800"
                          >
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              {t.test?.name || "Diagnostic Panel"}
                            </span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                              {t.result || "Processing in Lab"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "RADIOLOGY" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {radOrders.length === 0 ? (
            <EmptyState
              icon={ScanLine}
              title="No Radiology Reports Yet"
              description="X-Ray, MRI, CT Scan, and Ultrasound imaging records will appear here once verified by the radiologist."
            />
          ) : (
            <div className="space-y-4">
              {radOrders.map((rad) => (
                <div
                  key={rad._id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 dark:text-white">
                          {rad.orderId} — {rad.modality || "Imaging"} ({rad.bodyPart || "Scan"})
                        </span>
                        <span className="text-[11px] text-slate-400">• Date: {rad.orderDate}</span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Doctor: {rad.doctor?.name || "Physician"}
                      </p>
                    </div>
                    <StatusBadge status={rad.status || "Scheduled"} />
                  </div>

                  {rad.findings && (
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">Radiology Findings: </span>
                      <span className="text-slate-600 dark:text-slate-400">{rad.findings}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
