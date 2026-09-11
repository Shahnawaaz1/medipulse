"use client";

import React, { useState, useEffect } from "react";
import {
  Share2,
  Plus,
  Search,
  Filter,
  Building2,
  Stethoscope,
  User,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  Ambulance,
  Phone,
  ArrowRight,
  ShieldAlert,
  ChevronRight,
  Edit,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedReferral, setSelectedReferral] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    patient: "",
    referringDoctor: "",
    destinationHospital: "",
    destinationDepartment: "Cardiology",
    destinationSpecialist: "",
    diagnosis: "",
    reasonForReferral: "",
    clinicalSummary: "",
    priority: "Normal" as "Normal" | "Urgent" | "Emergency",
    notes: "",
    transportRequired: false,
    accompanyingNurse: "",
  });

  const [newStatus, setNewStatus] = useState("Pending");
  const [statusNotes, setStatusNotes] = useState("");

  const fetchReferrals = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (searchQuery) params.append("search", searchQuery);

      const [resRef, resPat, resDoc] = await Promise.all([
        fetch(`/api/referrals?${params.toString()}`),
        fetch("/api/patients"),
        fetch("/api/doctors"),
      ]);

      if (resRef.ok) {
        const json = await resRef.json();
        setReferrals(json.data || []);
        setSummary(json.summary || {});
      }
      if (resPat.ok) {
        const json = await resPat.json();
        setPatients(json.patients || []);
        if (json.patients?.length > 0 && !formData.patient) {
          setFormData((prev) => ({ ...prev, patient: json.patients[0]._id }));
        }
      }
      if (resDoc.ok) {
        const json = await resDoc.json();
        setDoctors(json.doctors || []);
        if (json.doctors?.length > 0 && !formData.referringDoctor) {
          setFormData((prev) => ({ ...prev, referringDoctor: json.doctors[0]._id }));
        }
      }
    } catch {
      toast.error("Failed to load patient referrals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReferrals();
  }, [statusFilter, priorityFilter, searchQuery]);

  const handleCreateReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.patient || !formData.destinationHospital || !formData.diagnosis || !formData.reasonForReferral) {
      toast.error("Please fill in all required referral details");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Patient referral created successfully!");
        setIsCreateModalOpen(false);
        setFormData({
          patient: patients[0]?._id || "",
          referringDoctor: doctors[0]?._id || "",
          destinationHospital: "",
          destinationDepartment: "Cardiology",
          destinationSpecialist: "",
          diagnosis: "",
          reasonForReferral: "",
          clinicalSummary: "",
          priority: "Normal",
          notes: "",
          transportRequired: false,
          accompanyingNurse: "",
        });
        fetchReferrals();
      } else {
        toast.error(json.error || "Failed to create referral");
      }
    } catch {
      toast.error("Error creating referral");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReferral) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/referrals/${selectedReferral._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: statusNotes || selectedReferral.notes,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success(`Referral status updated to ${newStatus}`);
        setIsStatusModalOpen(false);
        fetchReferrals();
      } else {
        toast.error(json.error || "Failed to update status");
      }
    } catch {
      toast.error("Error updating referral status");
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "Emergency":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse">
            <ShieldAlert className="h-3 w-3" /> Emergency
          </span>
        );
      case "Urgent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
            <AlertTriangle className="h-3 w-3" /> Urgent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Normal
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700 dark:bg-brand-950 dark:text-brand-300 mb-1">
            <Share2 className="h-3.5 w-3.5" />
            <span>PATIENT REFERRAL & TRANSFER MANAGEMENT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Patient Referrals
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Refer patients to tertiary super-speciality hospitals, external clinical institutes, and specialized centers
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Create New Referral</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Referrals</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {summary.total || 0}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950">
            <Share2 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm dark:bg-amber-950/30 dark:border-amber-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">
              Pending / In Transit
            </p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300 mt-1">
              {summary.pending || 0}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm dark:bg-rose-950/30 dark:border-rose-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase">
              Emergency Priority
            </p>
            <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
              {summary.emergency || 0}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm dark:bg-emerald-950/30 dark:border-emerald-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
              Completed / Accepted
            </p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {summary.completed || 0}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Patient, Hospital, Ref #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs focus:border-brand-500 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Sent">Sent</option>
            <option value="Accepted">Accepted</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All Priorities</option>
            <option value="Normal">Normal</option>
            <option value="Urgent">Urgent</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          {referrals.length} Referrals Found
        </span>
      </div>

      {/* Referrals Table */}
      {loading ? (
        <LoadingSpinner label="Loading patient referrals..." />
      ) : referrals.length === 0 ? (
        <EmptyState
          icon={Share2}
          title="No referrals found"
          description="Create your first patient transfer or hospital referral."
          actionText="Create Referral"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Referral # & Date</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Referring Doctor</th>
                  <th className="px-5 py-3.5">Destination Hospital & Dept</th>
                  <th className="px-5 py-3.5">Diagnosis</th>
                  <th className="px-5 py-3.5">Priority</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {referrals.map((ref) => (
                  <tr
                    key={ref._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                        {ref.referralId}
                      </span>
                      <p className="text-[11px] text-slate-400">{formatDate(ref.referralDate)}</p>
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/patients/${ref.patient?._id || ref.patient}`}
                        className="font-bold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                      >
                        {ref.patient?.name || "Patient"}
                      </Link>
                      <p className="text-[11px] text-slate-400">
                        {ref.patient?.patientId} • {ref.patient?.gender}, {ref.patient?.age}y
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {ref.referringDoctor?.name || "Doctor"}
                      </span>
                      <p className="text-[11px] text-slate-400">
                        {ref.referringDoctor?.department}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                        <span>{ref.destinationHospital}</span>
                      </div>
                      <p className="text-[11px] text-brand-600 dark:text-brand-400 font-semibold">
                        {ref.destinationDepartment}
                      </p>
                    </td>

                    <td className="px-5 py-4 max-w-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {ref.diagnosis}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{ref.reasonForReferral}</p>
                    </td>

                    <td className="px-5 py-4">{getPriorityBadge(ref.priority)}</td>

                    <td className="px-5 py-4">
                      <StatusBadge status={ref.status} size="sm" />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedReferral(ref);
                            setNewStatus(ref.status);
                            setStatusNotes(ref.notes || "");
                            setIsStatusModalOpen(true);
                          }}
                          className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                        >
                          Status
                        </button>
                        <button
                          onClick={() => {
                            setSelectedReferral(ref);
                            setIsViewModalOpen(true);
                          }}
                          className="flex items-center gap-1 rounded-xl bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300"
                        >
                          <Printer className="h-3.5 w-3.5" />
                          <span>Slip</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE REFERRAL MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Patient Referral"
        subtitle="Refer an existing patient to another hospital or specialized institute"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateReferral} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Existing Patient *
              </label>
              <select
                required
                value={formData.patient}
                onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.patientId}) - {p.gender}, {p.age}y
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Referring Doctor *
              </label>
              <select
                required
                value={formData.referringDoctor}
                onChange={(e) => setFormData({ ...formData, referringDoctor: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.department} - {d.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Hospital / Institution *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. AIIMS New Delhi / Apollo Hospital"
                value={formData.destinationHospital}
                onChange={(e) => setFormData({ ...formData, destinationHospital: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Destination Department / Speciality *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Advanced Cardiothoracic Surgery"
                value={formData.destinationDepartment}
                onChange={(e) =>
                  setFormData({ ...formData, destinationDepartment: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Target Specialist Doctor (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. K.S. Iyer / Head of Pediatric Cardiac"
                value={formData.destinationSpecialist}
                onChange={(e) =>
                  setFormData({ ...formData, destinationSpecialist: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Referral Priority Level *
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as "Normal" | "Urgent" | "Emergency",
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-bold"
              >
                <option value="Normal">Normal (Routine Super-Speciality Opinion)</option>
                <option value="Urgent">Urgent (Within 24-48 Hours)</option>
                <option value="Emergency">Emergency (Immediate Trauma / ICU Transfer)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Primary Diagnosis *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Acute Severe Coronary Artery Disease with Left Main Stenosis"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-semibold"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Reason for Referral *
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g. Requires emergency robotic coronary artery bypass grafting (CABG) not available locally..."
              value={formData.reasonForReferral}
              onChange={(e) => setFormData({ ...formData, reasonForReferral: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white leading-relaxed"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
              Clinical Summary & Present Management
            </label>
            <textarea
              rows={3}
              placeholder="Include patient vitals, active medications, diagnostic highlights (Echo EF, Angiogram findings)..."
              value={formData.clinicalSummary}
              onChange={(e) => setFormData({ ...formData, clinicalSummary: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white leading-relaxed"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <input
              type="checkbox"
              id="transportRequired"
              checked={formData.transportRequired}
              onChange={(e) =>
                setFormData({ ...formData, transportRequired: e.target.checked })
              }
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <label htmlFor="transportRequired" className="font-bold text-xs text-slate-800 dark:text-slate-200">
              Emergency Mobile ICU / Ambulance Transfer Required
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-6 py-2.5 font-bold text-white shadow hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Generating..." : "Issue Patient Referral"}
            </button>
          </div>
        </form>
      </Modal>

      {/* PRINTABLE OFFICIAL REFERRAL LETTER SLIP MODAL */}
      {selectedReferral && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title={`Official Referral Slip — ${selectedReferral.referralId}`}
          subtitle="Hospital transfer and clinical referral letter"
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-slate-800 dark:text-slate-200">
            {/* Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4 text-center dark:border-white">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white uppercase">
                MediPulse Hospital & Medical Institute
              </h2>
              <p className="text-[11px] text-slate-500">
                Plot 42, Health City, Sector 62, New Delhi 110001 • Phone: +91 1800-456-7890
              </p>
              <div className="mt-2 inline-block rounded-full bg-slate-900 text-white px-3 py-0.5 text-[10px] font-black tracking-widest uppercase dark:bg-white dark:text-slate-900">
                Official Clinical Referral Letter
              </div>
            </div>

            {/* Meta Details */}
            <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800/60 dark:border-slate-700">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Referral ID</p>
                <p className="font-mono font-bold text-sm text-brand-600 dark:text-brand-400">
                  {selectedReferral.referralId}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Date: {formatDate(selectedReferral.referralDate)}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase font-bold text-slate-400">Priority Level</p>
                <div className="mt-0.5">{getPriorityBadge(selectedReferral.priority)}</div>
                <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                  Status: {selectedReferral.status}
                </p>
              </div>
            </div>

            {/* Patient & Destination Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Patient Information</p>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {selectedReferral.patient?.name}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  ID: {selectedReferral.patient?.patientId} • {selectedReferral.patient?.gender},{" "}
                  {selectedReferral.patient?.age}y
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Contact: {selectedReferral.patient?.phone}
                </p>
                {selectedReferral.patient?.bloodGroup && (
                  <p className="text-[11px] font-bold text-rose-600">
                    Blood Group: {selectedReferral.patient?.bloodGroup}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-slate-200 p-3.5 space-y-1 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Referred To</p>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">
                  {selectedReferral.destinationHospital}
                </p>
                <p className="text-[11px] text-brand-600 dark:text-brand-400 font-bold">
                  Department: {selectedReferral.destinationDepartment}
                </p>
                {selectedReferral.destinationSpecialist && (
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Attention: {selectedReferral.destinationSpecialist}
                  </p>
                )}
              </div>
            </div>

            {/* Clinical Content */}
            <div className="space-y-3">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Provisional Diagnosis:</p>
                <p className="mt-0.5 rounded-xl bg-slate-50 p-2.5 font-semibold text-slate-800 dark:bg-slate-800/60 dark:text-slate-200">
                  {selectedReferral.diagnosis}
                </p>
              </div>

              <div>
                <p className="font-bold text-slate-900 dark:text-white">Reason for Referral:</p>
                <p className="mt-0.5 rounded-xl bg-slate-50 p-2.5 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                  {selectedReferral.reasonForReferral}
                </p>
              </div>

              {selectedReferral.clinicalSummary && (
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Clinical Summary & Vitals:</p>
                  <p className="mt-0.5 rounded-xl bg-slate-50 p-2.5 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 whitespace-pre-line">
                    {selectedReferral.clinicalSummary}
                  </p>
                </div>
              )}
            </div>

            {/* Signature Block */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-end dark:border-slate-700">
              <div>
                <p className="text-[10px] text-slate-400">Printed via MediPulse Hospital EMR</p>
                <p className="text-[10px] text-slate-400">NABH / ABDM M3 Certified Node</p>
              </div>
              <div className="text-right space-y-1">
                <div className="h-10 border-b border-slate-400 w-48 ml-auto flex items-end justify-center font-serif italic text-slate-700">
                  {selectedReferral.referringDoctor?.name}
                </div>
                <p className="font-extrabold text-slate-900 dark:text-white">
                  {selectedReferral.referringDoctor?.name || "Referring Consultant"}
                </p>
                <p className="text-[10px] text-slate-500">
                  {selectedReferral.referringDoctor?.specialization} •{" "}
                  {selectedReferral.referringDoctor?.department}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-5 py-2 font-bold text-white hover:bg-brand-600 dark:bg-slate-800"
              >
                <Printer className="h-4 w-4" />
                <span>Print Referral Letter</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* UPDATE STATUS MODAL */}
      {selectedReferral && (
        <Modal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          title={`Update Status — ${selectedReferral.referralId}`}
          subtitle={`Patient: ${selectedReferral.patient?.name} • Target: ${selectedReferral.destinationHospital}`}
          maxWidth="sm"
        >
          <form onSubmit={handleUpdateStatus} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Referral Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold"
              >
                <option value="Pending">Pending (Drafted / Awaiting Transfer)</option>
                <option value="Sent">Sent (Patient Dispatched / En Route)</option>
                <option value="Accepted">Accepted by Destination Hospital</option>
                <option value="Completed">Completed (Treatment Given / Discharged)</option>
                <option value="Rejected">Rejected by Destination Hospital</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block font-bold mb-1">Follow-up Notes / Status Remarks</label>
              <textarea
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="e.g. Patient accepted by destination ICU. Bed allocated in Ward 3."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white shadow"
              >
                {submitting ? "Saving..." : "Save Status"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
