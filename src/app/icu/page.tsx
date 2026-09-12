"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  HeartPulse,
  Clock,
  User,
  Bed as BedIcon,
  Wind,
  Droplet,
  FileText,
  CheckCircle2,
  Stethoscope,
  Share2,
  ArrowRight,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { StatCard } from "@/components/common/StatCard";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function IcuManagementPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [icuBeds, setIcuBeds] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalIcuBeds: 0,
    occupiedIcuBeds: 0,
    availableIcuBeds: 0,
    ventilatedPatients: 0,
    activeCriticalAlerts: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState("All");

  // Modals
  const [isNewIcuOpen, setIsNewIcuOpen] = useState(false);
  const [isTelemetryModalOpen, setIsTelemetryModalOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [availableAdmissions, setAvailableAdmissions] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [icuForm, setIcuForm] = useState({
    patient: "",
    admission: "",
    bed: "",
    unit: "MICU" as "MICU" | "SICU" | "CCU" | "NICU" | "PICU",
    ventilatorStatus: "None" as any,
    ventilatorSettings: {
      mode: "AC/VC",
      fio2: "40%",
      peep: "5 cmH2O",
      tidalVolume: "450 mL",
      pip: "22 cmH2O",
    },
    attendingIntensivist: "",
    assignedNurse: "Nurse Clara Oswald",
    dailyNotes: "",
  });

  const [telemetryForm, setTelemetryForm] = useState({
    heartRate: 85,
    bpSystolic: 125,
    bpDiastolic: 82,
    spo2: 97,
    temperature: 98.6,
    respiratoryRate: 18,
    cpcOrGcs: 15,
    ventilatorStatus: "None" as any,
    dailyNotes: "",
  });

  const fetchIcuData = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/icu", window.location.origin);
      if (selectedUnit !== "All") url.searchParams.set("unit", selectedUnit);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setIcuBeds(data.icuBeds || []);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      toast.error("Failed to load ICU telemetry");
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportingData = async () => {
    try {
      const [docRes, admRes] = await Promise.all([
        fetch("/api/doctors"),
        fetch("/api/admissions"),
      ]);

      if (docRes.ok) {
        const d = await docRes.json();
        setDoctors(d.doctors || []);
        if (d.doctors?.length > 0) {
          setIcuForm((prev) => ({ ...prev, attendingIntensivist: d.doctors[0]._id }));
        }
      }

      if (admRes.ok) {
        const a = await admRes.json();
        const active = (a.admissions || []).filter(
          (item: any) => item.status !== "Discharged"
        );
        setAvailableAdmissions(active);
        if (active.length > 0) {
          setIcuForm((prev) => ({
            ...prev,
            admission: active[0]._id,
            patient: active[0].patient?._id || active[0].patient,
            bed: active[0].bed?._id || active[0].bed,
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIcuData();
    fetchSupportingData();
  }, [selectedUnit]);

  const handleNewIcuSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!icuForm.admission || !icuForm.bed) {
      toast.error("Please select an admission and bed");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/icu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(icuForm),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`ICU record ${data.record.icuId} created!`);
        setIsNewIcuOpen(false);
        fetchIcuData();
      } else {
        toast.error(data.error || "Failed to create ICU record");
      }
    } catch {
      toast.error("Error creating ICU record");
    } finally {
      setSubmitting(false);
    }
  };

  const openTelemetry = (record: any) => {
    setActiveRecord(record);
    const latestVital = record.telemetryVitals?.[record.telemetryVitals.length - 1] || {};
    setTelemetryForm({
      heartRate: latestVital.heartRate || 80,
      bpSystolic: latestVital.bpSystolic || 120,
      bpDiastolic: latestVital.bpDiastolic || 80,
      spo2: latestVital.spo2 || 98,
      temperature: latestVital.temperature || 98.6,
      respiratoryRate: latestVital.respiratoryRate || 18,
      cpcOrGcs: latestVital.cpcOrGcs || 15,
      ventilatorStatus: record.ventilatorStatus || "None",
      dailyNotes: record.dailyNotes || "",
    });
    setIsTelemetryModalOpen(true);
  };

  const handleTelemetrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord) return;

    try {
      setSubmitting(true);
      const newVitals = [
        ...(activeRecord.telemetryVitals || []),
        {
          timestamp: new Date(),
          heartRate: telemetryForm.heartRate,
          bpSystolic: telemetryForm.bpSystolic,
          bpDiastolic: telemetryForm.bpDiastolic,
          spo2: telemetryForm.spo2,
          temperature: telemetryForm.temperature,
          respiratoryRate: telemetryForm.respiratoryRate,
          cpcOrGcs: telemetryForm.cpcOrGcs,
        },
      ];

      const res = await fetch(`/api/icu/${activeRecord._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          telemetryVitals: newVitals,
          ventilatorStatus: telemetryForm.ventilatorStatus,
          dailyNotes: telemetryForm.dailyNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("ICU Telemetry updated successfully!");
        setIsTelemetryModalOpen(false);
        fetchIcuData();
      } else {
        toast.error(data.error || "Failed to update ICU telemetry");
      }
    } catch {
      toast.error("Error updating telemetry");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStepDown = async (rec: any) => {
    if (!confirm(`Step down patient ${rec.patient?.name} from ICU to General Inpatient Ward?`)) return;

    try {
      const res = await fetch(`/api/icu/${rec._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Transferred to Ward",
          transferredAt: new Date(),
        }),
      });

      if (res.ok) {
        toast.success("Patient stepped down from ICU to Ward!");
        fetchIcuData();
      }
    } catch {
      toast.error("Error updating ICU status");
    }
  };

  return (
    <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-600 text-white shadow-lg shadow-amber-600/30">
              <Activity className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Intensive Care Unit (ICU) Command
              </h1>
              <p className="text-xs text-slate-500">
                Live Ventilator, Telemetry & Multi-Parameter Patient Monitoring
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewIcuOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-amber-600/20 hover:bg-amber-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Admit to ICU</span>
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="ICU Bed Occupancy"
            value={`${stats.occupiedIcuBeds} / ${stats.totalIcuBeds}`}
            icon={BedIcon}
            trend={{ value: 85, isPositive: true }}
            description={`${stats.availableIcuBeds} Beds Currently Available`}
          />
          <StatCard
            title="Ventilated Patients"
            value={stats.ventilatedPatients}
            icon={Wind}
            trend={{ value: 4, isPositive: false }}
            description="Active Mechanical / NIV Support"
          />
          <StatCard
            title="Critical Telemetry Alerts"
            value={stats.activeCriticalAlerts}
            icon={ShieldAlert}
            trend={{ value: 0, isPositive: true }}
            description="Arrhythmia / Desaturation Flags"
          />
          <StatCard
            title="Active ICU Stays"
            value={records.length}
            icon={HeartPulse}
            trend={{ value: 6, isPositive: true }}
            description="Under continuous monitoring"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">ICU Unit Wing:</span>
            {["All", "MICU", "SICU", "CCU", "NICU", "PICU"].map((u) => (
              <button
                key={u}
                onClick={() => setSelectedUnit(u)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedUnit === u
                    ? "bg-amber-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* ICU Live Cards */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : records.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <Activity className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No active ICU telemetry records found
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select "Admit to ICU" to assign a critical inpatient to an ICU suite.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {records.map((r) => {
              const latestVital =
                r.telemetryVitals?.[r.telemetryVitals.length - 1] || {};
              const isVentilated =
                r.ventilatorStatus && !["None", "Room Air"].includes(r.ventilatorStatus);

              return (
                <div
                  key={r._id}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-500">{r.icuId}</span>
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          {r.unit}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                          Bed: {r.bed?.bedNumber || "ICU-01"}
                        </span>
                        <StatusBadge status={r.status} />
                      </div>

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1.5">
                        {r.patient?.name || "Patient Record"}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {r.patient?.age || "--"} yrs • {r.patient?.gender || "--"} • Admitted:{" "}
                        {formatDate(r.admittedAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-slate-500">
                        Intensivist: {r.attendingIntensivist?.name || "Dr. Sarah Jenkins"}
                      </span>
                    </div>
                  </div>

                  {/* Telemetry Multi-Parameter Monitor */}
                  <div className="mt-4 rounded-xl bg-slate-950 p-3.5 text-white shadow-inner border border-slate-800">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <Zap className="h-4 w-4 animate-pulse" />
                        <span>LIVE TELEMETRY STREAM</span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Updated {formatDate(latestVital.timestamp || r.updatedAt)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-rose-400">
                          HR (bpm)
                        </span>
                        <p className="text-xl font-black text-rose-300">
                          {latestVital.heartRate || 82}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-amber-400">
                          BP (Art)
                        </span>
                        <p className="text-xl font-black text-amber-300">
                          {latestVital.bpSystolic || 120}/{latestVital.bpDiastolic || 80}
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-sky-400">
                          SpO2 (%)
                        </span>
                        <p className="text-xl font-black text-sky-300">
                          {latestVital.spo2 || 98}%
                        </p>
                      </div>

                      <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                        <span className="text-[10px] uppercase font-bold text-emerald-400">
                          GCS Score
                        </span>
                        <p className="text-xl font-black text-emerald-300">
                          {latestVital.cpcOrGcs || 15}/15
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ventilator Settings Bar */}
                  <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <Wind
                        className={`h-4 w-4 ${
                          isVentilated ? "text-cyan-500 animate-pulse" : "text-slate-400"
                        }`}
                      />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Support: {r.ventilatorStatus || "Room Air"}
                      </span>
                    </div>

                    {isVentilated && r.ventilatorSettings && (
                      <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                        <span>FiO2: {r.ventilatorSettings.fio2}</span>
                        <span>PEEP: {r.ventilatorSettings.peep}</span>
                        <span>Vt: {r.ventilatorSettings.tidalVolume}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                    {r.patient?._id && (
                      <Link
                        href={`/patients/${r.patient._id}`}
                        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        Patient 360
                      </Link>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStepDown(r)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                      >
                        Step-Down to Ward
                      </button>
                      <button
                        onClick={() => openTelemetry(r)}
                        className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 shadow-sm"
                      >
                        <Activity className="h-3.5 w-3.5" />
                        <span>Update Telemetry</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Admit Patient to ICU */}
        <Modal
          isOpen={isNewIcuOpen}
          onClose={() => setIsNewIcuOpen(false)}
          title="Admit Critical Patient to ICU"
          size="lg"
        >
          <form onSubmit={handleNewIcuSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Inpatient Admission *
                </label>
                <select
                  required
                  value={icuForm.admission}
                  onChange={(e) => {
                    const selected = availableAdmissions.find((a) => a._id === e.target.value);
                    setIcuForm({
                      ...icuForm,
                      admission: e.target.value,
                      patient: selected?.patient?._id || selected?.patient || "",
                      bed: selected?.bed?._id || selected?.bed || "",
                    });
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {availableAdmissions.map((adm) => (
                    <option key={adm._id} value={adm._id}>
                      {adm.patient?.name} ({adm.admissionId}) - Bed: {adm.bed?.bedNumber || "General"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  ICU Unit Wing *
                </label>
                <select
                  value={icuForm.unit}
                  onChange={(e) => setIcuForm({ ...icuForm, unit: e.target.value as any })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="MICU">Medical ICU (MICU)</option>
                  <option value="SICU">Surgical ICU (SICU)</option>
                  <option value="CCU">Coronary Care Unit (CCU)</option>
                  <option value="NICU">Neonatal ICU (NICU)</option>
                  <option value="PICU">Pediatric ICU (PICU)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ventilator Support Mode
                </label>
                <select
                  value={icuForm.ventilatorStatus}
                  onChange={(e) =>
                    setIcuForm({ ...icuForm, ventilatorStatus: e.target.value as any })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="None">None (Room Air)</option>
                  <option value="Invasive Mechanical">Invasive Mechanical (Endotracheal / Tracheostomy)</option>
                  <option value="Non-Invasive (NIV)">Non-Invasive (NIV Mask)</option>
                  <option value="CPAP">CPAP</option>
                  <option value="BiPAP">BiPAP</option>
                  <option value="High Flow Nasal Cannula">High Flow Nasal Cannula (HFNC)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Attending Intensivist Doctor
                </label>
                <select
                  value={icuForm.attendingIntensivist}
                  onChange={(e) =>
                    setIcuForm({ ...icuForm, attendingIntensivist: e.target.value })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                ICU Admission Clinical Notes
              </label>
              <textarea
                rows={2}
                placeholder="Document indications for ICU care, inotropes, sedation protocol..."
                value={icuForm.dailyNotes}
                onChange={(e) => setIcuForm({ ...icuForm, dailyNotes: e.target.value })}
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewIcuOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-md shadow-amber-600/20"
              >
                {submitting ? "Admitting..." : "Admit to ICU"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Update Telemetry & Vitals */}
        <Modal
          isOpen={isTelemetryModalOpen}
          onClose={() => setIsTelemetryModalOpen(false)}
          title={`Update ICU Telemetry: ${activeRecord?.icuId || ""}`}
          size="md"
        >
          <form onSubmit={handleTelemetrySubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400">Heart Rate (bpm)</label>
                <input
                  type="number"
                  value={telemetryForm.heartRate}
                  onChange={(e) =>
                    setTelemetryForm({
                      ...telemetryForm,
                      heartRate: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400">BP Systolic</label>
                <input
                  type="number"
                  value={telemetryForm.bpSystolic}
                  onChange={(e) =>
                    setTelemetryForm({
                      ...telemetryForm,
                      bpSystolic: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400">BP Diastolic</label>
                <input
                  type="number"
                  value={telemetryForm.bpDiastolic}
                  onChange={(e) =>
                    setTelemetryForm({
                      ...telemetryForm,
                      bpDiastolic: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400">SpO2 (%)</label>
                <input
                  type="number"
                  value={telemetryForm.spo2}
                  onChange={(e) =>
                    setTelemetryForm({
                      ...telemetryForm,
                      spo2: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400">Temp (°F)</label>
                <input
                  type="number"
                  step="0.1"
                  value={telemetryForm.temperature}
                  onChange={(e) =>
                    setTelemetryForm({
                      ...telemetryForm,
                      temperature: parseFloat(e.target.value) || 98.6,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400">GCS (1-15)</label>
                <input
                  type="number"
                  min="3"
                  max="15"
                  value={telemetryForm.cpcOrGcs}
                  onChange={(e) =>
                    setTelemetryForm({
                      ...telemetryForm,
                      cpcOrGcs: parseInt(e.target.value) || 15,
                    })
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Ventilator Mode
              </label>
              <select
                value={telemetryForm.ventilatorStatus}
                onChange={(e) =>
                  setTelemetryForm({ ...telemetryForm, ventilatorStatus: e.target.value as any })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="None">None (Room Air)</option>
                <option value="Invasive Mechanical">Invasive Mechanical</option>
                <option value="Non-Invasive (NIV)">Non-Invasive (NIV)</option>
                <option value="CPAP">CPAP</option>
                <option value="BiPAP">BiPAP</option>
                <option value="High Flow Nasal Cannula">High Flow Nasal Cannula</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsTelemetryModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-md shadow-amber-600/20"
              >
                {submitting ? "Saving..." : "Log Telemetry Vitals"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
  );
}
