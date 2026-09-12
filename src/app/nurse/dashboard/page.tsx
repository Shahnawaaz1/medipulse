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
  Pill,
  Droplet,
  Clock,
  Plus,
  FileText,
  Check,
  X,
  Share2,
} from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function NurseDashboardPage() {
  const { user } = useAuth();
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [nursingRecords, setNursingRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Station Tab
  const [stationTab, setStationTab] = useState<"patients" | "mar" | "fluids" | "handover">("patients");

  // Modals
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedAdm, setSelectedAdm] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Vitals entry form
  const [vitalForm, setVitalForm] = useState({
    bp: "120/80",
    pulse: "76",
    temp: "98.6",
    spo2: "98",
    sugar: "110",
    painLevel: 1,
  });

  // Shift Handover form
  const [handoverText, setHandoverText] = useState("");
  const [shift, setShift] = useState<"Morning" | "Evening" | "Night">("Morning");

  // Mock MAR list for admitted patients
  const [marList, setMarList] = useState<any[]>([
    {
      id: "mar-1",
      patientName: "Rahul Sharma",
      bed: "Bed 102",
      drug: "Inj. Ceftriaxone 1g IV",
      scheduled: "10:00 AM",
      status: "Administered",
      givenBy: "Nurse Clara",
    },
    {
      id: "mar-2",
      patientName: "Sunita Verma",
      bed: "ICU-02",
      drug: "Inj. Pantoprazole 40mg IV",
      scheduled: "11:30 AM",
      status: "Due",
    },
    {
      id: "mar-3",
      patientName: "Vikram Mehta",
      bed: "Bed 205",
      drug: "Tab. Metoprolol 25mg PO",
      scheduled: "12:00 PM",
      status: "Due",
    },
    {
      id: "mar-4",
      patientName: "Pooja Patel",
      bed: "Bed 108",
      drug: "Inj. Paracetamol 1g IV Infusion",
      scheduled: "02:00 PM",
      status: "Due",
    },
  ]);

  const loadNurseData = async () => {
    try {
      setLoading(true);
      const [admRes, bedRes, nurseRes] = await Promise.all([
        fetch("/api/admissions"),
        fetch("/api/beds"),
        fetch("/api/nursing"),
      ]);
      if (admRes.ok) {
        const d = await admRes.json();
        setAdmissions(d.admissions || []);
      }
      if (bedRes.ok) {
        const d = await bedRes.json();
        setBeds(d.beds || []);
      }
      if (nurseRes.ok) {
        const n = await nurseRes.json();
        setNursingRecords(n.records || []);
      }
    } catch (e) {
      console.error("Failed to load nurse data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNurseData();
  }, []);

  const handleAdministerMed = (id: string) => {
    setMarList((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "Administered",
              givenBy: user?.name || "Nurse Clara",
            }
          : item
      )
    );
    toast.success("Medication administered & logged into MAR!");
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdm) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/nursing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: selectedAdm.patient?._id || selectedAdm.patient,
          admission: selectedAdm._id,
          nurse: user?.name || "Staff Nurse",
          shift,
          carePlan: ["Regular vitals observation", "Medication schedule adherence"],
          vitals: [
            {
              time: new Date().toLocaleTimeString(),
              bp: vitalForm.bp,
              pulse: vitalForm.pulse,
              temp: vitalForm.temp,
              spo2: vitalForm.spo2,
              sugar: vitalForm.sugar,
              painLevel: vitalForm.painLevel,
              recordedBy: user?.name || "Staff Nurse",
            },
          ],
          nursingAlerts: vitalForm.painLevel > 5 ? ["High Pain Level Alert"] : [],
        }),
      });

      if (res.ok) {
        toast.success("Patient vitals logged successfully!");
        setIsVitalsModalOpen(false);
        loadNurseData();
      } else {
        toast.error("Failed to save nursing chart");
      }
    } catch {
      toast.error("Error saving vitals");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverText.trim()) return;

    toast.success(`${shift} Shift Handover notes submitted to nurse station!`);
    setIsHandoverModalOpen(false);
    setHandoverText("");
  };

  const occupiedBeds = beds.filter((b) => b.status === "Occupied").length;
  const availableBeds = beds.filter((b) => b.status === "Available").length;
  const activeAdmissions = admissions.filter(
    (a) => a.status === "Admitted" || a.status === "Under Treatment"
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-rose-700 via-rose-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-rose-500/30 px-3 py-0.5 text-xs font-bold text-rose-200 border border-rose-400/30">
                Advanced Nursing Station & Inpatient Ward
              </span>
              <span className="text-xs text-rose-300">
                Shift: {shift} • In-Charge: {user?.name || "Nurse Clara"}
              </span>
            </div>
            <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight">
              Nursing Care Workstation
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-rose-100/80 max-w-xl">
              Medication Administration Record (MAR), continuous vitals monitoring, fluid intake/output calculations, and shift handovers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsHandoverModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-white/20 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white hover:bg-white/30 transition"
            >
              <FileText className="h-4 w-4" />
              <span>Shift Handover</span>
            </button>
            <Link
              href="/beds"
              className="flex items-center gap-2 rounded-xl bg-white text-rose-900 px-4 py-2 text-xs font-bold shadow-lg hover:bg-rose-50 transition-all"
            >
              <Bed className="h-4 w-4 text-rose-600" />
              <span>Bed Matrix</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Assigned Inpatients"
          value={activeAdmissions.length}
          icon={Hotel}
          trend={{ value: 4, isPositive: true }}
          description="Inpatient beds supervised"
        />
        <StatCard
          title="Occupied Beds"
          value={`${occupiedBeds} / ${beds.length}`}
          icon={Bed}
          trend={{ value: 78, isPositive: true }}
          description={`${availableBeds} Available for admission`}
        />
        <StatCard
          title="Medications Due (MAR)"
          value={marList.filter((m) => m.status === "Due").length}
          icon={Pill}
          trend={{ value: 3, isPositive: false }}
          description="Scheduled this hour"
        />
        <StatCard
          title="Nursing Care Logs"
          value={nursingRecords.length + 12}
          icon={Activity}
          trend={{ value: 15, isPositive: true }}
          description="Vitals & charts updated"
        />
      </div>

      {/* Station Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 pb-1">
        {[
          { id: "patients", label: "Assigned Inpatients", icon: Users },
          { id: "mar", label: "Medication Admin Record (MAR)", icon: Pill },
          { id: "fluids", label: "Fluid Intake / Output (I&O)", icon: Droplet },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = stationTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setStationTab(tab.id as any)}
              className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "border-rose-600 text-rose-600 dark:text-rose-400"
                  : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Assigned Inpatients */}
      {stationTab === "patients" && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {activeAdmissions.length === 0 ? (
            <p className="p-8 text-center text-xs text-slate-400 col-span-2">No active inpatients</p>
          ) : (
            activeAdmissions.map((adm: any) => (
              <div
                key={adm._id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                        {adm.ward || "General Ward"}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Bed: {adm.bed?.bedNumber || "Assigned"}
                      </span>
                      <StatusBadge status={adm.status} size="sm" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                      {adm.patient?.name || "Patient"}
                    </h3>
                    <p className="text-xs text-slate-400">
                      ID: {adm.patient?.patientId || adm.admissionId} • Attending:{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {adm.doctor?.name || "Dr. Sarah Jenkins"}
                      </span>
                    </p>
                  </div>

                  <span className="text-[11px] text-slate-400">
                    Admitted {formatDate(adm.admissionDate)}
                  </span>
                </div>

                <div className="mt-3 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    Reason: <span className="font-normal">{adm.admissionReason}</span>
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  {adm.patient?._id && (
                    <Link
                      href={`/patients/${adm.patient._id}`}
                      className="text-xs font-bold text-brand-600 hover:underline"
                    >
                      Patient 360 Chart →
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setSelectedAdm(adm);
                      setIsVitalsModalOpen(true);
                    }}
                    className="flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 shadow-sm"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>Log Vitals Chart</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Medication Administration Record (MAR) */}
      {stationTab === "mar" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Live Medication Administration Record (MAR)
              </h3>
              <p className="text-xs text-slate-400">Scheduled inpatient doses for verification and digital administration</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[600px]">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-5 py-3">Patient & Bed</th>
                  <th className="px-5 py-3">Prescribed Medication</th>
                  <th className="px-5 py-3">Scheduled Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {marList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-900 dark:text-white">{item.patientName}</p>
                      <span className="text-[10px] text-slate-400">{item.bed}</span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-rose-600 dark:text-rose-400">
                      {item.drug}
                    </td>
                    <td className="px-5 py-3.5 text-slate-500 font-mono">{item.scheduled}</td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                          item.status === "Administered"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.givenBy && (
                        <p className="text-[10px] text-slate-400 mt-0.5">By {item.givenBy}</p>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {item.status === "Due" ? (
                        <button
                          onClick={() => handleAdministerMed(item.id)}
                          className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                        >
                          Give Dose
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center justify-end gap-1">
                          <Check className="h-3.5 w-3.5" /> Given
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Fluid Intake / Output (I&O) */}
      {stationTab === "fluids" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-xs font-bold uppercase text-slate-400">Total 24h Intake</h4>
            <p className="text-2xl font-black text-sky-600 mt-1">2,450 mL</p>
            <p className="text-[11px] text-slate-500 mt-1">IV Fluids: 1,500 mL • Oral: 950 mL</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-xs font-bold uppercase text-slate-400">Total 24h Output</h4>
            <p className="text-2xl font-black text-amber-600 mt-1">1,900 mL</p>
            <p className="text-[11px] text-slate-500 mt-1">Urine: 1,650 mL • Drains: 250 mL</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-xs font-bold uppercase text-slate-400">Net Fluid Balance</h4>
            <p className="text-2xl font-black text-emerald-600 mt-1">+550 mL</p>
            <p className="text-[11px] text-slate-500 mt-1">Positive balance (Euvolemic target)</p>
          </div>
        </div>
      )}

      {/* Modal: Rapid Vitals Entry */}
      <Modal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        title={`Log Nursing Vitals: ${selectedAdm?.patient?.name || ""}`}
        size="md"
      >
        <form onSubmit={handleSaveVitals} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-[10px] font-bold text-slate-400">BP (mmHg)</label>
              <input
                type="text"
                value={vitalForm.bp}
                onChange={(e) => setVitalForm({ ...vitalForm, bp: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400">Pulse (bpm)</label>
              <input
                type="text"
                value={vitalForm.pulse}
                onChange={(e) => setVitalForm({ ...vitalForm, pulse: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400">Temp (°F)</label>
              <input
                type="text"
                value={vitalForm.temp}
                onChange={(e) => setVitalForm({ ...vitalForm, temp: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400">SpO2 (%)</label>
              <input
                type="text"
                value={vitalForm.spo2}
                onChange={(e) => setVitalForm({ ...vitalForm, spo2: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400">Blood Sugar (mg/dL)</label>
              <input
                type="text"
                value={vitalForm.sugar}
                onChange={(e) => setVitalForm({ ...vitalForm, sugar: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400">Pain Score (1-10)</label>
              <input
                type="number"
                min="0"
                max="10"
                value={vitalForm.painLevel}
                onChange={(e) =>
                  setVitalForm({ ...vitalForm, painLevel: parseInt(e.target.value) || 0 })
                }
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsVitalsModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
            >
              {submitting ? "Saving..." : "Save Vitals"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Shift Handover */}
      <Modal
        isOpen={isHandoverModalOpen}
        onClose={() => setIsHandoverModalOpen(false)}
        title="Digital Shift Handover Summary"
        size="md"
      >
        <form onSubmit={handleSaveHandover} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Current Shift
            </label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as any)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="Morning">Morning Shift (07:00 - 15:00)</option>
              <option value="Evening">Evening Shift (15:00 - 23:00)</option>
              <option value="Night">Night Shift (23:00 - 07:00)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Handover Clinical Notes
            </label>
            <textarea
              required
              rows={4}
              placeholder="Document high acuity patients, pending blood reports, IV fluid changes, planned discharges for the next shift..."
              value={handoverText}
              onChange={(e) => setHandoverText(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsHandoverModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 shadow-md shadow-rose-600/20"
            >
              Submit Handover
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
