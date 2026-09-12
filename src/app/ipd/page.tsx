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
  Printer,
  CheckCircle2,
  BadgeCheck,
  Building2,
  Pill,
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
  const [isPrintSummaryOpen, setIsPrintSummaryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Admission Form
  const [formData, setFormData] = useState({
    patient: "",
    doctor: "",
    department: "Cardiology",
    ward: "General Medical Ward",
    roomNumber: "Room 102",
    bed: "",
    admissionDate: new Date().toISOString().split("T")[0],
    admissionReason: "",
    treatmentPlan: "",
  });

  // Discharge Summary Form
  const [dischargeForm, setDischargeForm] = useState({
    dischargeType: "Normal / Cured" as any,
    finalDiagnosis: "",
    icd10Code: "I21.9",
    clinicalSummary: "",
    hospitalCourse: "Patient received inpatient medical management and is hemodynamically stable.",
    proceduresPerformed: "Diagnostic angiography, telemetry monitoring",
    dischargeMedicines: "Tab. Aspirin 75mg OD, Tab. Atorvastatin 40mg HS, Tab. Ramipril 2.5mg OD",
    dietAndActivityAdvice: "Low salt, low fat cardiac diet. Light ambulation.",
    followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    emergencyInstructions: "In case of acute chest pain or severe dyspnea, contact 24x7 ER immediately.",
    billingClearance: true,
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

  const openDischargeWizard = (adm: any) => {
    setSelectedAdmission(adm);
    setDischargeForm({
      dischargeType: "Normal / Cured",
      finalDiagnosis: adm.admissionReason || "Acute Condition Treated",
      icd10Code: "I21.9",
      clinicalSummary: `Patient was admitted on ${formatDate(adm.admissionDate)} for ${adm.admissionReason}. Underwent successful inpatient care with satisfactory clinical improvement.`,
      hospitalCourse: adm.treatmentPlan || "Patient responded well to IV medical management and monitoring.",
      proceduresPerformed: "Routine nursing care, diagnostics, vitals monitoring",
      dischargeMedicines: "Tab. Pantoprazole 40mg OD, Tab. Paracetamol 650mg SOS",
      dietAndActivityAdvice: "Normal balanced diet. Light daily ambulation as tolerated.",
      followUpDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      emergencyInstructions: "In case of severe discomfort, fever, or pain, contact 24x7 ER Hotline immediately.",
      billingClearance: true,
    });
    setIsDischargeModalOpen(true);
  };

  const handleCompleteDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAdmission) return;

    try {
      setSubmitting(true);

      const medicinesParsed = dischargeForm.dischargeMedicines
        .split(",")
        .map((m) => ({
          medicineName: m.trim(),
          dosage: "1 tab",
          frequency: "As directed",
          duration: "5 days",
          instructions: "After meals",
        }));

      const res = await fetch("/api/discharges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          admission: selectedAdmission._id,
          patient: selectedAdmission.patient?._id || selectedAdmission.patient,
          attendingDoctor: selectedAdmission.doctor?._id || selectedAdmission.doctor,
          department: selectedAdmission.department,
          admissionDate: selectedAdmission.admissionDate,
          dischargeDate: new Date(),
          dischargeType: dischargeForm.dischargeType,
          finalDiagnosis: dischargeForm.finalDiagnosis,
          icd10Code: dischargeForm.icd10Code,
          clinicalSummary: dischargeForm.clinicalSummary,
          hospitalCourse: dischargeForm.hospitalCourse,
          proceduresPerformed: dischargeForm.proceduresPerformed.split(",").map((p) => p.trim()),
          dischargeMedicines: medicinesParsed,
          dietAndActivityAdvice: dischargeForm.dietAndActivityAdvice,
          followUpDate: dischargeForm.followUpDate,
          emergencyInstructions: dischargeForm.emergencyInstructions,
          billingClearance: {
            isCleared: dischargeForm.billingClearance,
            clearedAt: new Date(),
          },
        }),
      });

      if (res.ok) {
        toast.success(`Discharge Summary generated & Bed ${selectedAdmission.bed?.bedNumber} released!`);
        setIsDischargeModalOpen(false);
        setIsPrintSummaryOpen(true);
        fetchData();
      } else {
        toast.error("Failed to complete discharge");
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
            Inpatient Admissions (IPD) & Discharge
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Hospital admissions, ward bed assignments, daily treatment plans, and comprehensive clinical discharge summaries
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
                          onClick={() => openDischargeWizard(adm)}
                          className="rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300"
                        >
                          Discharge Summary
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedAdmission(adm);
                            setIsPrintSummaryOpen(true);
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:underline ml-auto"
                        >
                          <Printer className="h-3 w-3" />
                          <span>View Summary</span>
                        </button>
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

      {/* Multi-Step Discharge Wizard Modal */}
      {selectedAdmission && (
        <Modal
          isOpen={isDischargeModalOpen}
          onClose={() => setIsDischargeModalOpen(false)}
          title={`Clinical Discharge Summary: ${selectedAdmission.patient?.name}`}
          subtitle={`Bed: ${selectedAdmission.bed?.bedNumber} • Admitted: ${formatDate(selectedAdmission.admissionDate)}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleCompleteDischarge} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Discharge Type *
                </label>
                <select
                  value={dischargeForm.dischargeType}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeType: e.target.value as any })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="Normal / Cured">Normal / Cured & Stable</option>
                  <option value="Against Medical Advice (LAMA)">Left Against Medical Advice (LAMA)</option>
                  <option value="Transfer to Higher Center">Transfer to Higher Super-Specialty</option>
                  <option value="Deceased">Deceased</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Final Diagnosis & ICD Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Coronary Syndrome (NSTEMI)"
                  value={dischargeForm.finalDiagnosis}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, finalDiagnosis: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Detailed Clinical Summary & Hospital Course *
              </label>
              <textarea
                required
                rows={3}
                value={dischargeForm.clinicalSummary}
                onChange={(e) => setDischargeForm({ ...dischargeForm, clinicalSummary: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Discharge Medication Plan (Comma-separated)
              </label>
              <input
                type="text"
                value={dischargeForm.dischargeMedicines}
                onChange={(e) => setDischargeForm({ ...dischargeForm, dischargeMedicines: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Diet & Physical Activity Advice
                </label>
                <input
                  type="text"
                  value={dischargeForm.dietAndActivityAdvice}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, dietAndActivityAdvice: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Follow-up Consultation Date
                </label>
                <input
                  type="date"
                  value={dischargeForm.followUpDate}
                  onChange={(e) => setDischargeForm({ ...dischargeForm, followUpDate: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <input
                type="checkbox"
                id="billingClear"
                checked={dischargeForm.billingClearance}
                onChange={(e) => setDischargeForm({ ...dischargeForm, billingClearance: e.target.checked })}
                className="h-4 w-4 rounded text-brand-600"
              />
              <label htmlFor="billingClear" className="font-bold text-xs">
                Billing & Accounts Clearance Verified (No Pending Dues)
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white shadow-md shadow-brand-600/20 hover:bg-brand-700"
              >
                {submitting ? "Processing..." : "Finalize Discharge & Release Bed"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Printable Discharge Slip Modal */}
      {selectedAdmission && (
        <Modal
          isOpen={isPrintSummaryOpen}
          onClose={() => setIsPrintSummaryOpen(false)}
          title="Official Hospital Discharge Summary"
          maxWidth="2xl"
        >
          <div className="p-6 bg-white text-slate-900 rounded-2xl space-y-4 border border-slate-200 text-xs">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-black text-brand-700 uppercase">MediPulse Hospital & Research Institute</h2>
                <p className="text-[11px] text-slate-500">Plot 42, Health City, Sector 62, New Delhi • 24x7: +91 1800-911-0000</p>
                <p className="text-[11px] font-bold text-slate-700 mt-1">DISCHARGE CERTIFICATE & CLINICAL SUMMARY</p>
              </div>
              <div className="text-right">
                <span className="font-mono font-bold text-brand-600">DSC-2026-FINAL</span>
                <p className="text-[10px] text-slate-400">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <p><span className="font-bold">Patient Name:</span> {selectedAdmission.patient?.name}</p>
                <p><span className="font-bold">Age / Gender:</span> {selectedAdmission.patient?.age}y / {selectedAdmission.patient?.gender}</p>
                <p><span className="font-bold">Patient ID:</span> {selectedAdmission.patient?.patientId}</p>
              </div>
              <div>
                <p><span className="font-bold">Admitted:</span> {formatDate(selectedAdmission.admissionDate)}</p>
                <p><span className="font-bold">Discharged:</span> {formatDate(new Date())}</p>
                <p><span className="font-bold">Attending Doctor:</span> {selectedAdmission.doctor?.name}</p>
              </div>
            </div>

            <div>
              <p className="font-bold text-slate-900">Final Diagnosis:</p>
              <p className="text-slate-700 mt-0.5">{dischargeForm.finalDiagnosis}</p>
            </div>

            <div>
              <p className="font-bold text-slate-900">Clinical Hospital Course:</p>
              <p className="text-slate-700 mt-0.5 leading-relaxed">{dischargeForm.clinicalSummary}</p>
            </div>

            <div>
              <p className="font-bold text-slate-900">Discharge Medications:</p>
              <p className="text-slate-700 mt-0.5 font-semibold text-brand-700">{dischargeForm.dischargeMedicines}</p>
            </div>

            <div className="flex justify-between pt-6 border-t border-slate-200 mt-4">
              <div className="text-center">
                <div className="h-10 border-b border-slate-300 w-36 mb-1"></div>
                <p className="text-[10px] font-bold text-slate-500">Patient / Relative Signature</p>
              </div>
              <div className="text-center">
                <div className="h-10 border-b border-slate-300 w-36 mb-1"></div>
                <p className="text-[10px] font-bold text-slate-500">Authorized Medical Officer</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 text-white px-4 py-2 font-bold hover:bg-slate-800 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" />
                <span>Print Official Slip</span>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
