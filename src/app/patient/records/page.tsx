"use client";

import React, { useState, useEffect } from "react";
import {
  FolderHeart,
  Activity,
  Heart,
  Shield,
  FileText,
  Clock,
  AlertCircle,
  User,
  Phone,
} from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function PatientRecordsPage() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRecord() {
      try {
        setLoading(true);
        const res = await fetch("/api/patients");
        if (res.ok) {
          const d = await res.json();
          if (d.patients && d.patients.length > 0) {
            setPatient(d.patients[0]);
          }
        }
      } catch {
        toast.error("Failed to load medical record");
      } finally {
        setLoading(false);
      }
    }
    loadRecord();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
          My Electronic Health Record (EHR)
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Comprehensive patient profile, medical history, known allergies, and vital metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Patient Identity Card */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 text-2xl font-black dark:bg-teal-950 dark:text-teal-300">
              {patient?.name?.charAt(0) || user?.name?.charAt(0) || "P"}
            </div>
            <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              {patient?.name || user?.name}
            </h2>
            <span className="inline-block mt-1 rounded-full bg-teal-50 px-3 py-0.5 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              {patient?.patientId || user?.patientId || "PAT-8001"}
            </span>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Gender / Age:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {patient?.gender || "Male"} • {patient?.age || 30} yrs
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Blood Group:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">
                {patient?.bloodGroup || "O+"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Mobile Phone:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {patient?.phone || user?.phone || "+91 9876543217"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[160px]">
                {patient?.email || user?.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Location:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {patient?.city || "Delhi NCR"}
              </span>
            </div>
          </div>
        </div>

        {/* Clinical History & Allergies */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Heart className="h-4 w-4 text-rose-500" />
              <h3>Known Allergies & Drug Sensitivities</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {patient?.allergies && patient.allergies.length > 0 ? (
                patient.allergies.map((a: string, i: number) => (
                  <span
                    key={i}
                    className="rounded-xl bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:border-rose-900 dark:text-rose-300"
                  >
                    ⚠ {a}
                  </span>
                ))
              ) : (
                <span className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                  ✓ No known allergies on file
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Activity className="h-4 w-4 text-teal-500" />
              <h3>Medical History & Past Conditions</h3>
            </div>
            <div className="space-y-2">
              {patient?.medicalHistory && patient.medicalHistory.length > 0 ? (
                patient.medicalHistory.map((h: string, i: number) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs font-medium text-slate-700 dark:bg-slate-800/60 dark:border-slate-800 dark:text-slate-300"
                  >
                    • {h}
                  </div>
                ))
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  No chronic illnesses recorded in system.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <Phone className="h-4 w-4 text-brand-500" />
              <h3>Emergency Contact Information</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Name: <span className="font-bold text-slate-800 dark:text-slate-200">{patient?.emergencyContact?.name || "Family Contact"}</span> • Relationship: <span className="font-bold text-slate-800 dark:text-slate-200">{patient?.emergencyContact?.relationship || "Next of Kin"}</span> • Phone: <span className="font-bold text-slate-800 dark:text-slate-200">{patient?.emergencyContact?.phone || "+91 9876543210"}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
