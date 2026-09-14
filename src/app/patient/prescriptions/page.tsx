"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Pill,
  Calendar,
  User,
  Stethoscope,
  Printer,
  Download,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRx() {
      try {
        setLoading(true);
        const res = await fetch("/api/prescriptions");
        if (res.ok) {
          const d = await res.json();
          setPrescriptions(d.prescriptions || []);
        }
      } catch {
        toast.error("Failed to load prescriptions");
      } finally {
        setLoading(false);
      }
    }
    loadRx();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          My Prescriptions & Medicines
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Access your digital doctor prescriptions, medicine dosages, and treatment instructions.
        </p>
      </div>

      <div className="space-y-4">
        {prescriptions.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <EmptyState
              icon={FileText}
              title="No Prescriptions on Record"
              description="Your consulting doctor will upload digital prescriptions directly after your OPD or Inpatient visit."
            />
          </div>
        ) : (
          prescriptions.map((rx) => (
            <div
              key={rx._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      Rx
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {rx.prescriptionId || "e-Prescription"}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Prescribed by: <span className="font-semibold text-slate-700 dark:text-slate-200">{rx.doctor?.name || "Consultant"}</span> • Date: {rx.date}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Diagnosis: {rx.diagnosis || "Clinical Review"}
                  </span>
                </div>
              </div>

              {/* Medicines Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Prescribed Medication List
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400">
                        <th className="pb-2 font-semibold">Medicine</th>
                        <th className="pb-2 font-semibold">Dosage</th>
                        <th className="pb-2 font-semibold">Frequency</th>
                        <th className="pb-2 font-semibold">Duration</th>
                        <th className="pb-2 font-semibold">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {rx.medicines?.map((med: any, idx: number) => (
                        <tr key={idx} className="text-slate-700 dark:text-slate-300">
                          <td className="py-2.5 font-bold flex items-center gap-2">
                            <Pill className="h-3.5 w-3.5 text-teal-600" />
                            <span>{med.medicineName || med.name || med.medicine}</span>
                          </td>
                          <td className="py-2.5">{med.dosage || "1 Tab"}</td>
                          <td className="py-2.5">{med.frequency || "Twice Daily (1-0-1)"}</td>
                          <td className="py-2.5">{med.duration || "5 Days"}</td>
                          <td className="py-2.5 text-slate-400">{med.instructions || "After meals"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
                {rx.notes && (
                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 flex-1">
                    <span className="font-bold text-slate-800 dark:text-slate-200">Doctor Advice: </span>
                    {rx.notes}
                  </div>
                )}
                
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  <Link
                    href={`/prescriptions/${rx._id}`}
                    className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Rx</span>
                  </Link>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
