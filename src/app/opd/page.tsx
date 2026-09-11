"use client";

import React, { useState, useEffect } from "react";
import {
  Stethoscope,
  Plus,
  Activity,
  Heart,
  Thermometer,
  Wind,
  Weight,
  Ruler,
  CheckCircle2,
  Clock,
  ArrowRight,
  FileSignature,
  Share2,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function OpdQueuePage() {
  const router = useRouter();
  const [opdList, setOpdList] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOpd, setSelectedOpd] = useState<any>(null);
  const [isNewTokenModalOpen, setIsNewTokenModalOpen] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [tokenForm, setTokenForm] = useState({
    patient: "",
    doctor: "",
    department: "General Medicine",
    symptoms: "",
    vitals: {
      bp: "120/80",
      pulse: "72 bpm",
      temperature: "98.6 °F",
      spo2: "98%",
      weight: "70 kg",
      height: "172 cm",
    },
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resOpd, resDocs, resPats] = await Promise.all([
        fetch("/api/opd"),
        fetch("/api/doctors"),
        fetch("/api/patients"),
      ]);

      if (resOpd.ok) {
        const json = await resOpd.json();
        setOpdList(json.opdQueue || []);
      }
      if (resDocs.ok) {
        const json = await resDocs.json();
        setDoctors(json.doctors || []);
        if (json.doctors?.length > 0 && !tokenForm.doctor) {
          setTokenForm((prev) => ({
            ...prev,
            doctor: json.doctors[0]._id,
            department: json.doctors[0].department,
          }));
        }
      }
      if (resPats.ok) {
        const json = await resPats.json();
        setPatients(json.patients || []);
        if (json.patients?.length > 0 && !tokenForm.patient) {
          setTokenForm((prev) => ({ ...prev, patient: json.patients[0]._id }));
        }
      }
    } catch {
      toast.error("Failed to load OPD queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/opd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tokenForm),
      });

      if (res.ok) {
        const json = await res.json();
        toast.success(`Token #${json.opdRecord.tokenNumber} generated successfully!`);
        setIsNewTokenModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to generate token");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/opd/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Patient moved to ${status}`);
        fetchData();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpd) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/opd/${selectedOpd._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vitals: selectedOpd.vitals }),
      });
      if (res.ok) {
        toast.success("Patient vitals saved!");
        setIsVitalsModalOpen(false);
        fetchData();
      }
    } catch {
      toast.error("Failed to update vitals");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Outpatient Department (OPD) Live Queue
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live Queue
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time token management, triage vitals recording, and doctor consultation desk
          </p>
        </div>
        <button
          onClick={() => setIsNewTokenModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Issue OPD Token</span>
        </button>
      </div>

      {/* Live Queue Cards */}
      {loading ? (
        <LoadingSpinner label="Loading OPD queue..." />
      ) : opdList.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No patients waiting in OPD queue today"
          description="Issue a walk-in token to start triaging and consulting patients."
          actionText="Issue OPD Token"
          onAction={() => setIsNewTokenModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {opdList.map((opd) => (
            <div
              key={opd._id}
              className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:bg-slate-900 dark:border-slate-800"
            >
              <div>
                {/* Token Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 font-extrabold text-sm text-white shadow">
                      #{opd.tokenNumber}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {opd.patient?.name}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        {opd.patient?.gender}, {opd.patient?.age} yrs • {opd.patient?.bloodGroup}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={opd.status} size="sm" />
                </div>

                {/* Doctor Assigned */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Consulting Doctor:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {opd.doctor?.name} ({opd.department})
                  </span>
                </div>

                {/* Symptoms */}
                <div className="mt-2 rounded-xl bg-slate-50 p-2.5 text-xs dark:bg-slate-800/50">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Chief Symptoms:</span>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
                    {opd.symptoms}
                  </p>
                </div>

                {/* Vitals Grid */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-800/30">
                    <p className="text-[10px] text-slate-400 font-semibold">BP</p>
                    <p className="font-bold text-slate-800 dark:text-white text-xs">{opd.vitals?.bp || "120/80"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-800/30">
                    <p className="text-[10px] text-slate-400 font-semibold">Pulse</p>
                    <p className="font-bold text-slate-800 dark:text-white text-xs">{opd.vitals?.pulse || "72"}</p>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-2 dark:border-slate-800 dark:bg-slate-800/30">
                    <p className="text-[10px] text-slate-400 font-semibold">SpO2</p>
                    <p className="font-bold text-teal-600 dark:text-teal-400 text-xs">{opd.vitals?.spo2 || "99%"}</p>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setSelectedOpd(opd);
                    setIsVitalsModalOpen(true);
                  }}
                  className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  Edit Vitals
                </button>

                <div className="flex items-center gap-1.5">
                  {opd.status === "Waiting" && (
                    <button
                      onClick={() => handleUpdateStatus(opd._id, "In Consultation")}
                      className="rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 shadow-sm"
                    >
                      Call to Cabin
                    </button>
                  )}
                  {opd.status === "In Consultation" && (
                    <button
                      onClick={() => handleUpdateStatus(opd._id, "Completed")}
                      className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm"
                    >
                      Complete
                    </button>
                  )}
                  <Link
                    href={`/prescriptions?patient=${opd.patient?._id}`}
                    className="rounded-xl bg-brand-50 p-1.5 text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300"
                    title="Write Prescription"
                  >
                    <FileSignature className="h-4 w-4" />
                  </Link>
                  <Link
                    href={`/referrals?patientId=${opd.patient?._id}`}
                    className="rounded-xl bg-indigo-50 p-1.5 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"
                    title="Refer Patient"
                  >
                    <Share2 className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Issue Token Modal */}
      <Modal
        isOpen={isNewTokenModalOpen}
        onClose={() => setIsNewTokenModalOpen(false)}
        title="Issue Walk-in OPD Token"
        subtitle="Assign patient to specialist doctor and record intake triage vitals"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateToken} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Patient *
              </label>
              <select
                required
                value={tokenForm.patient}
                onChange={(e) => setTokenForm({ ...tokenForm, patient: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.patientId}) - {p.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Consulting Doctor *
              </label>
              <select
                required
                value={tokenForm.doctor}
                onChange={(e) => {
                  const doc = doctors.find((d) => d._id === e.target.value);
                  setTokenForm({
                    ...tokenForm,
                    doctor: e.target.value,
                    department: doc ? doc.department : tokenForm.department,
                  });
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.specialization}) - {d.roomNumber}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Symptoms / Complaints *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Chief complaints e.g. headache, fever, chest discomfort..."
                value={tokenForm.symptoms}
                onChange={(e) => setTokenForm({ ...tokenForm, symptoms: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Vitals Sub-fields */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Blood Pressure (BP)
              </label>
              <input
                type="text"
                placeholder="120/80"
                value={tokenForm.vitals.bp}
                onChange={(e) =>
                  setTokenForm({
                    ...tokenForm,
                    vitals: { ...tokenForm.vitals, bp: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Heart Rate / Pulse
              </label>
              <input
                type="text"
                placeholder="72 bpm"
                value={tokenForm.vitals.pulse}
                onChange={(e) =>
                  setTokenForm({
                    ...tokenForm,
                    vitals: { ...tokenForm.vitals, pulse: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Body Temperature
              </label>
              <input
                type="text"
                placeholder="98.6 °F"
                value={tokenForm.vitals.temperature}
                onChange={(e) =>
                  setTokenForm({
                    ...tokenForm,
                    vitals: { ...tokenForm.vitals, temperature: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Oxygen Saturation (SpO2)
              </label>
              <input
                type="text"
                placeholder="98%"
                value={tokenForm.vitals.spo2}
                onChange={(e) =>
                  setTokenForm({
                    ...tokenForm,
                    vitals: { ...tokenForm.vitals, spo2: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsNewTokenModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Generating..." : "Generate OPD Token"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Vitals Modal */}
      {selectedOpd && (
        <Modal
          isOpen={isVitalsModalOpen}
          onClose={() => setIsVitalsModalOpen(false)}
          title={`Update Vitals for ${selectedOpd.patient?.name} (Token #${selectedOpd.tokenNumber})`}
          maxWidth="md"
        >
          <form onSubmit={handleSaveVitals} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Blood Pressure (BP)</label>
              <input
                type="text"
                value={selectedOpd.vitals?.bp || ""}
                onChange={(e) =>
                  setSelectedOpd({
                    ...selectedOpd,
                    vitals: { ...selectedOpd.vitals, bp: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Pulse / Heart Rate</label>
              <input
                type="text"
                value={selectedOpd.vitals?.pulse || ""}
                onChange={(e) =>
                  setSelectedOpd({
                    ...selectedOpd,
                    vitals: { ...selectedOpd.vitals, pulse: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Temperature</label>
              <input
                type="text"
                value={selectedOpd.vitals?.temperature || ""}
                onChange={(e) =>
                  setSelectedOpd({
                    ...selectedOpd,
                    vitals: { ...selectedOpd.vitals, temperature: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Oxygen Saturation (SpO2)</label>
              <input
                type="text"
                value={selectedOpd.vitals?.spo2 || ""}
                onChange={(e) =>
                  setSelectedOpd({
                    ...selectedOpd,
                    vitals: { ...selectedOpd.vitals, spo2: e.target.value },
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                type="button"
                onClick={() => setIsVitalsModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700"
              >
                Save Vitals
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
