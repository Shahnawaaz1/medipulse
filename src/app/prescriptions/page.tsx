"use client";

import React, { useState, useEffect } from "react";
import {
  FileSignature,
  Plus,
  Search,
  Printer,
  Trash2,
  Calendar,
  Pill,
  User,
  Stethoscope,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [medicinesList, setMedicinesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    patient: "",
    doctor: "",
    diagnosis: "",
    clinicalNotes: "",
    followUpDate: "",
    medicines: [
      {
        medicineName: "Amoxicillin & Clavulanate 625mg",
        dosage: "625mg",
        frequency: "1-0-1",
        duration: "5 Days",
        instructions: "After food",
      },
    ],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resRx, resPats, resDocs, resMeds] = await Promise.all([
        fetch("/api/prescriptions"),
        fetch("/api/patients"),
        fetch("/api/doctors"),
        fetch("/api/medicines"),
      ]);

      if (resRx.ok) {
        const json = await resRx.json();
        setPrescriptions(json.prescriptions || []);
      }
      if (resPats.ok) {
        const json = await resPats.json();
        setPatients(json.patients || []);
        if (json.patients?.length > 0 && !form.patient) {
          setForm((prev) => ({ ...prev, patient: json.patients[0]._id }));
        }
      }
      if (resDocs.ok) {
        const json = await resDocs.json();
        setDoctors(json.doctors || []);
        if (json.doctors?.length > 0 && !form.doctor) {
          setForm((prev) => ({ ...prev, doctor: json.doctors[0]._id }));
        }
      }
      if (resMeds.ok) {
        const json = await resMeds.json();
        setMedicinesList(json.medicines || []);
      }
    } catch {
      toast.error("Failed to load prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMedicineRow = () => {
    setForm((prev) => ({
      ...prev,
      medicines: [
        ...prev.medicines,
        {
          medicineName: medicinesList[0]?.name || "Paracetamol 650mg",
          dosage: "500mg",
          frequency: "1-0-1",
          duration: "5 Days",
          instructions: "After meals",
        },
      ],
    }));
  };

  const handleRemoveMedicineRow = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== idx),
    }));
  };

  const handleMedicineChange = (idx: number, field: string, val: string) => {
    setForm((prev) => {
      const copy = [...prev.medicines];
      (copy[idx] as any)[field] = val;
      return { ...prev, medicines: copy };
    });
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.medicines.length === 0) {
      toast.error("Please add at least one prescribed medicine.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success("Prescription generated successfully!");
        setIsNewModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create prescription");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Electronic Prescriptions (e-Rx)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Digital doctor prescriptions, structured dosage schedules, drug interactions, and pharmacy dispensing
          </p>
        </div>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Write Prescription</span>
        </button>
      </div>

      {/* Prescriptions List */}
      {loading ? (
        <LoadingSpinner label="Loading prescriptions..." />
      ) : prescriptions.length === 0 ? (
        <EmptyState
          icon={FileSignature}
          title="No prescriptions written yet"
          description="Create digital prescription records with dosage instructions and advice."
          actionText="Write Prescription"
          onAction={() => setIsNewModalOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => (
            <div
              key={rx._id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-extrabold text-sm text-brand-600 dark:text-brand-400">
                    {rx.prescriptionId}
                  </span>
                  <StatusBadge status={rx.status} size="sm" />
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {rx.patient?.name} ({rx.patient?.gender}, {rx.patient?.age}y)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Prescribed by <span className="font-semibold text-slate-800 dark:text-slate-200">{rx.doctor?.name}</span> • {formatDate(rx.date)}
                  </p>
                </div>

                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Diagnosis: <span className="text-brand-600 dark:text-brand-400">{rx.diagnosis}</span>
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {rx.medicines?.map((m: any, idx: number) => (
                    <span
                      key={idx}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {m.medicineName} ({m.frequency} • {m.duration})
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                <Link
                  href={`/prescriptions/${rx._id}`}
                  className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700"
                >
                  <Printer className="h-3.5 w-3.5" />
                  <span>Print Rx</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write Prescription Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Write Digital Prescription (Rx)"
        subtitle="Issue structured electronic prescription with dosage and administration instructions"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreatePrescription} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold mb-1">Select Patient *</label>
              <select
                required
                value={form.patient}
                onChange={(e) => setForm({ ...form, patient: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.patientId}) - {p.gender}, {p.age}y
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Prescribing Doctor *</label>
              <select
                required
                value={form.doctor}
                onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.specialization})
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Clinical Diagnosis *</label>
              <input
                type="text"
                required
                placeholder="e.g. Acute Bronchitis & Pharyngitis, Type 2 DM, Hypertension"
                value={form.diagnosis}
                onChange={(e) => setForm({ ...form, diagnosis: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Medicines Dynamic Table */}
          <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white">
                Prescribed Medicines & Dosages
              </h4>
              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Medicine</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {form.medicines.map((med, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 rounded-xl border border-slate-200 bg-slate-50/40 p-2.5 dark:border-slate-800 dark:bg-slate-800/30 items-center"
                >
                  <div className="sm:col-span-4">
                    <input
                      type="text"
                      required
                      placeholder="Medicine name"
                      value={med.medicineName}
                      onChange={(e) =>
                        handleMedicineChange(idx, "medicineName", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Dosage (500mg)"
                      value={med.dosage}
                      onChange={(e) => handleMedicineChange(idx, "dosage", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Freq (1-0-1)"
                      value={med.frequency}
                      onChange={(e) =>
                        handleMedicineChange(idx, "frequency", e.target.value)
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      placeholder="Duration (5 Days)"
                      value={med.duration}
                      onChange={(e) => handleMedicineChange(idx, "duration", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-center">
                    {form.medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicineRow(idx)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div>
              <label className="block font-semibold mb-1">Clinical Advice / Diet</label>
              <textarea
                rows={2}
                placeholder="Dietary instructions, rest, hydration..."
                value={form.clinicalNotes}
                onChange={(e) => setForm({ ...form, clinicalNotes: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Follow-up Date</label>
              <input
                type="date"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save & Generate Rx"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
