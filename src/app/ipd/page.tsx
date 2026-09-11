"use client";

import React, { useState, useEffect } from "react";
import {
  Hotel,
  Plus,
  Search,
  Bed as BedIcon,
  User,
  Stethoscope,
  Calendar,
  LogOut,
  ArrowRightLeft,
  FileText,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function IpdAdmissionsPage() {
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [beds, setBeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<any>(null);
  const [isDischargeModalOpen, setIsDischargeModalOpen] = useState(false);
  const [dischargeSummary, setDischargeSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    department: "Cardiology",
    ward: "Intensive Care Unit (ICU)",
    roomNumber: "ICU Pod A",
    bed: "",
    admissionDate: new Date().toISOString().split("T")[0],
    admissionReason: "",
    treatmentPlan: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const [resAdm, resPats, resDocs, resBeds] = await Promise.all([
        fetch(`/api/admissions?${params.toString()}`),
        fetch("/api/patients"),
        fetch("/api/doctors"),
        fetch("/api/beds?status=Available"),
      ]);

      if (resAdm.ok) {
        const json = await resAdm.json();
        setAdmissions(json.admissions || []);
      }
      if (resPats.ok) {
        const json = await resPats.json();
        setPatients(json.patients || []);
        if (json.patients?.length > 0 && !formData.patient) {
          setFormData((prev) => ({ ...prev, patient: json.patients[0]._id }));
        }
      }
      if (resDocs.ok) {
        const json = await resDocs.json();
        setDoctors(json.doctors || []);
        if (json.doctors?.length > 0 && !formData.doctor) {
          setFormData((prev) => ({
            ...prev,
            doctor: json.doctors[0]._id,
            department: json.doctors[0].department,
          }));
        }
      }
      if (resBeds.ok) {
        const json = await resBeds.json();
        setBeds(json.beds || []);
        if (json.beds?.length > 0 && !formData.bed) {
          setFormData((prev) => ({
            ...prev,
            bed: json.beds[0]._id,
            ward: json.beds[0].ward,
            roomNumber: json.beds[0].roomNumber,
          }));
        }
      }
    } catch {
      toast.error("Failed to load admissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleBedSelect = (bedId: string) => {
    const b = beds.find((item) => item._id === bedId);
    if (b) {
      setFormData((prev) => ({
        ...prev,
        bed: bedId,
        ward: b.ward,
        roomNumber: b.roomNumber,
      }));
    }
  };

  const handleCreateAdmission = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Patient admitted to inpatient care successfully!");
        setIsNewModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create admission");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDischargePatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/admissions/${selectedAdmission._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Discharged",
          dischargeSummary,
          dischargeDate: new Date().toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        toast.success(`Patient discharged successfully. Bed released.`);
        setIsDischargeModalOpen(false);
        fetchData();
      } else {
        toast.error("Failed to discharge patient");
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
            Inpatient Admissions (IPD)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hospital admissions, ward bed assignments, daily physician treatment plans, and discharge clearance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/beds"
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <BedIcon className="h-4 w-4" />
            <span>Bed Occupancy Map</span>
          </Link>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Admit Patient</span>
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <option value="">All Admission Statuses</option>
          <option value="Admitted">Admitted (Active)</option>
          <option value="Under Treatment">Under Treatment</option>
          <option value="Ready for Discharge">Ready for Discharge</option>
          <option value="Discharged">Discharged</option>
        </select>

        <span className="text-xs font-semibold text-slate-500">
          {admissions.length} Inpatient Records
        </span>
      </div>

      {/* Admissions Table */}
      {loading ? (
        <LoadingSpinner label="Loading inpatient records..." />
      ) : admissions.length === 0 ? (
        <EmptyState
          icon={Hotel}
          title="No inpatient records found"
          description="Admit a patient to assign an available bed and begin inpatient care."
          actionText="Admit Patient"
          onAction={() => setIsNewModalOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Admission ID & Patient</th>
                  <th className="px-5 py-3.5">Ward & Bed Number</th>
                  <th className="px-5 py-3.5">Attending Physician</th>
                  <th className="px-5 py-3.5">Admission Date</th>
                  <th className="px-5 py-3.5">Primary Reason</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {admissions.map((adm) => (
                  <tr
                    key={adm._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/patients/${adm.patient?._id || adm.patient}`}
                        className="font-bold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                      >
                        {adm.patient?.name || "Patient"}
                      </Link>
                      <p className="text-[11px] font-mono text-slate-400">
                        {adm.admissionId} • {adm.patient?.patientId}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-brand-600 dark:text-brand-400">
                        {adm.bed?.bedNumber || "Bed"}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {adm.ward} ({adm.roomNumber})
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {adm.doctor?.name || "Doctor"}
                      </p>
                      <p className="text-[11px] text-slate-400">{adm.department}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatDate(adm.admissionDate)}
                      </p>
                    </td>
                    <td className="px-5 py-4 max-w-[200px] truncate text-slate-600 dark:text-slate-400">
                      {adm.admissionReason}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={adm.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      {adm.status !== "Discharged" ? (
                        <button
                          onClick={() => {
                            setSelectedAdmission(adm);
                            setIsDischargeModalOpen(true);
                          }}
                          className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300"
                        >
                          Discharge Patient
                        </button>
                      ) : (
                        <span className="text-[11px] font-semibold text-slate-400">
                          Discharged on {formatDate(adm.dischargeDate)}
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

      {/* New Admission Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Admit Patient to Inpatient Care"
        subtitle="Allocate available ward, room, bed, and assign supervising doctor"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateAdmission} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Patient *
              </label>
              <select
                required
                value={formData.patient}
                onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.patientId}) - {p.gender}, {p.age}y
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supervising Specialist Doctor *
              </label>
              <select
                required
                value={formData.doctor}
                onChange={(e) => {
                  const doc = doctors.find((d) => d._id === e.target.value);
                  setFormData({
                    ...formData,
                    doctor: e.target.value,
                    department: doc ? doc.department : formData.department,
                  });
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.specialization} - {d.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Available Bed *
              </label>
              <select
                required
                value={formData.bed}
                onChange={(e) => handleBedSelect(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-bold text-brand-600"
              >
                {beds.length === 0 ? (
                  <option value="">No beds currently available</option>
                ) : (
                  beds.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.bedNumber} ({b.ward} - {b.roomNumber} - ${b.dailyRate}/day)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Admission Date *
              </label>
              <input
                type="date"
                required
                value={formData.admissionDate}
                onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Admission & Admitting Diagnosis *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Clinical reason e.g. Acute myocardial infarction, post-op observation, severe trauma..."
                value={formData.admissionReason}
                onChange={(e) => setFormData({ ...formData, admissionReason: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Treatment & Monitoring Protocol
              </label>
              <textarea
                rows={2}
                placeholder="IV fluid orders, telemetry, hourly vitals, antibiotic course..."
                value={formData.treatmentPlan}
                onChange={(e) => setFormData({ ...formData, treatmentPlan: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsNewModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || beds.length === 0}
              className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Admitting..." : "Admit to Ward"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Discharge Summary Modal */}
      {selectedAdmission && (
        <Modal
          isOpen={isDischargeModalOpen}
          onClose={() => setIsDischargeModalOpen(false)}
          title={`Discharge Clearance: ${selectedAdmission.patient?.name}`}
          subtitle={`Bed: ${selectedAdmission.bed?.bedNumber} • Admitted on ${formatDate(selectedAdmission.admissionDate)}`}
          maxWidth="lg"
        >
          <form onSubmit={handleDischargePatient} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Discharge Summary & Post-Hospital Instructions *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Patient condition on discharge, home medications, activity limitations, follow-up date..."
                value={dischargeSummary}
                onChange={(e) => setDischargeSummary(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="rounded-xl bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              <p className="font-bold">Release Action:</p>
              <p className="text-[11px] mt-0.5">
                Confirming discharge will release Bed {selectedAdmission.bed?.bedNumber} back to Available status and update the patient's record.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDischargeModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-amber-700"
              >
                {submitting ? "Processing Discharge..." : "Confirm Discharge & Release Bed"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
