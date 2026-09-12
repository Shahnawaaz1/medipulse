"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Scissors,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  Stethoscope,
  Activity,
  FileText,
  AlertCircle,
  Play,
  CheckCheck,
  ShieldCheck,
  Building2,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { StatCard } from "@/components/common/StatCard";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function OperationTheatrePage() {
  const [surgeries, setSurgeries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalScheduled: 0,
    inProgress: 0,
    preOp: 0,
    completedToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedTheatre, setSelectedTheatre] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modals
  const [isBookOpen, setIsBookOpen] = useState(false);
  const [isChecklistOpen, setIsChecklistOpen] = useState(false);
  const [isPostOpOpen, setIsPostOpOpen] = useState(false);
  const [activeSurgery, setActiveSurgery] = useState<any>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Booking Form State
  const [bookingForm, setBookingForm] = useState({
    theatreNumber: "OT Suite 1 (Cardiothoracic)",
    patient: "",
    leadSurgeon: "",
    assistantSurgeon: "",
    anesthetist: "",
    scrubNurse: "Nurse Clara Oswald",
    procedureName: "Coronary Artery Bypass Graft (CABG)",
    specialty: "Cardiothoracic Surgery",
    scheduledDate: new Date().toISOString().split("T")[0],
    startTime: "09:00",
    endTime: "13:00",
    anesthesiaType: "General" as any,
    preOpChecklist: {
      consentSigned: true,
      npoStatusVerified: true,
      bloodCrossmatched: true,
      anesthesiaCleared: true,
      siteMarked: true,
    },
    surgeryStatus: "Scheduled" as any,
  });

  // Post-Op Form
  const [postOpForm, setPostOpForm] = useState({
    surgeryStatus: "Completed" as any,
    surgicalFindings: "",
    postOpNotes: "",
    bloodUnitsUsed: 2,
    pacuScore: 10,
  });

  const fetchSurgeries = async () => {
    try {
      setLoading(true);
      const url = new URL("/api/ot", window.location.origin);
      if (selectedTheatre !== "All") url.searchParams.set("theatre", selectedTheatre);
      if (selectedStatus !== "All") url.searchParams.set("status", selectedStatus);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setSurgeries(data.surgeries || []);
        if (data.stats) setStats(data.stats);
      }
    } catch {
      toast.error("Failed to load OT schedule");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctorsAndPatients = async () => {
    try {
      const [docRes, patRes] = await Promise.all([
        fetch("/api/doctors"),
        fetch("/api/patients"),
      ]);

      if (docRes.ok) {
        const d = await docRes.json();
        setDoctors(d.doctors || []);
        if (d.doctors?.length > 0) {
          setBookingForm((prev) => ({
            ...prev,
            leadSurgeon: d.doctors[0]._id,
            assistantSurgeon: d.doctors[1]?._id || d.doctors[0]._id,
            anesthetist: d.doctors[2]?._id || d.doctors[0]._id,
          }));
        }
      }

      if (patRes.ok) {
        const p = await patRes.json();
        setPatients(p.patients || []);
        if (p.patients?.length > 0) {
          setBookingForm((prev) => ({ ...prev, patient: p.patients[0]._id }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSurgeries();
    fetchDoctorsAndPatients();
  }, [selectedTheatre, selectedStatus]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patient || !bookingForm.leadSurgeon || !bookingForm.procedureName) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/ot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingForm),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Surgery ${data.surgery.otScheduleId} scheduled!`);
        setIsBookOpen(false);
        fetchSurgeries();
      } else {
        toast.error(data.error || "Failed to schedule surgery");
      }
    } catch {
      toast.error("Error booking OT suite");
    } finally {
      setSubmitting(false);
    }
  };

  const updateSurgeryStatus = async (s: any, newStatus: string) => {
    try {
      const body: any = { surgeryStatus: newStatus };
      if (newStatus === "In Progress") body.actualStartTime = new Date();
      if (newStatus === "Completed") body.actualEndTime = new Date();

      const res = await fetch(`/api/ot/${s._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(`Surgery status updated to: ${newStatus}`);
        fetchSurgeries();
      }
    } catch {
      toast.error("Error updating status");
    }
  };

  const openPostOp = (s: any) => {
    setActiveSurgery(s);
    setPostOpForm({
      surgeryStatus: "Completed",
      surgicalFindings: s.surgicalFindings || "",
      postOpNotes: s.postOpNotes || "",
      bloodUnitsUsed: s.bloodUnitsUsed || 0,
      pacuScore: s.pacuScore || 10,
    });
    setIsPostOpOpen(true);
  };

  const handlePostOpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSurgery) return;

    try {
      setSubmitting(true);
      const res = await fetch(`/api/ot/${activeSurgery._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...postOpForm,
          actualEndTime: new Date(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Post-Op surgical notes saved!");
        setIsPostOpOpen(false);
        fetchSurgeries();
      } else {
        toast.error(data.error || "Failed to save notes");
      }
    } catch {
      toast.error("Error saving notes");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/30">
              <Scissors className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Operation Theatre (OT) Management
              </h1>
              <p className="text-xs text-slate-500">
                Surgical Suites, Pre-Op Checklist & Intra-Op Telemetry
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBookOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-teal-600/20 hover:bg-teal-700 transition"
            >
              <Plus className="h-4 w-4" />
              <span>Book OT Suite</span>
            </button>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Surgeries Scheduled"
            value={stats.totalScheduled}
            icon={Calendar}
            trend={{ value: 10, isPositive: true }}
            description="Across all 4 surgical wings"
          />
          <StatCard
            title="Surgeries In Progress"
            value={stats.inProgress}
            icon={Scissors}
            trend={{ value: 2, isPositive: true }}
            description="Active surgical teams operating"
          />
          <StatCard
            title="Pre-Op Holding Area"
            value={stats.preOp}
            icon={Activity}
            trend={{ value: 3, isPositive: true }}
            description="Anesthesia clearance checked"
          />
          <StatCard
            title="Completed Surgeries"
            value={stats.completedToday}
            icon={CheckCircle2}
            trend={{ value: 5, isPositive: true }}
            description="PACU recovery monitored"
          />
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500">OT Room:</span>
            {[
              "All",
              "OT Suite 1 (Cardiothoracic)",
              "OT Suite 2 (Neuro/Spine)",
              "OT Suite 3 (Orthopedics)",
              "OT Suite 4 (General/Lap)",
            ].map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTheatre(t)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                  selectedTheatre === t
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {t === "All" ? "All Suites" : t.split(" ")[2]}
              </button>
            ))}
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="All">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Pre-Op">Pre-Op</option>
            <option value="In Progress">In Progress</option>
            <option value="Recovery">Recovery</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        {/* OT Schedule Cards */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : surgeries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <Scissors className="h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              No surgeries currently scheduled
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Click "Book OT Suite" to schedule a surgical case.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {surgeries.map((s) => (
              <div
                key={s._id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">{s.otScheduleId}</span>
                      <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                        {s.theatreNumber}
                      </span>
                      <StatusBadge status={s.surgeryStatus} />
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                      {s.procedureName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Patient: <span className="font-bold text-slate-800 dark:text-slate-200">{s.patient?.name}</span> • Specialty:{" "}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{s.specialty}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                      <Clock className="h-3.5 w-3.5 text-teal-600" />
                      {s.startTime} - {s.endTime}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {formatDate(s.scheduledDate)}
                    </p>
                  </div>
                </div>

                {/* Surgical Team */}
                <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-3 gap-2 text-[11px]">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        Lead Surgeon
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {s.leadSurgeon?.name || "Dr. Sarah Jenkins"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        Anesthetist
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {s.anesthetist?.name || "Dr. Alexander Wright"}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400">
                        Anesthesia
                      </span>
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {s.anesthesiaType}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pre-Op Checklist Flags */}
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 px-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Consent & NPO: Verified</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Blood Crossmatch: Ready</span>
                  </div>
                </div>

                {/* Actions & Progression */}
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                  {s.patient?._id && (
                    <Link
                      href={`/patients/${s.patient._id}`}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      Patient 360
                    </Link>
                  )}

                  <div className="flex items-center gap-2">
                    {s.surgeryStatus === "Scheduled" && (
                      <button
                        onClick={() => updateSurgeryStatus(s, "Pre-Op")}
                        className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-900"
                      >
                        Send to Pre-Op
                      </button>
                    )}

                    {s.surgeryStatus === "Pre-Op" && (
                      <button
                        onClick={() => updateSurgeryStatus(s, "In Progress")}
                        className="flex items-center gap-1 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700"
                      >
                        <Play className="h-3.5 w-3.5" />
                        <span>Start Surgery</span>
                      </button>
                    )}

                    {s.surgeryStatus === "In Progress" && (
                      <button
                        onClick={() => openPostOp(s)}
                        className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 shadow-sm"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        <span>Finish & Post-Op Notes</span>
                      </button>
                    )}

                    {s.surgeryStatus === "Completed" && (
                      <button
                        onClick={() => openPostOp(s)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                      >
                        View Post-Op Notes
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Book Surgery */}
        <Modal
          isOpen={isBookOpen}
          onClose={() => setIsBookOpen(false)}
          title="Schedule Operation Theatre (OT) Surgery"
          size="lg"
        >
          <form onSubmit={handleBookingSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Patient *
                </label>
                <select
                  required
                  value={bookingForm.patient}
                  onChange={(e) => setBookingForm({ ...bookingForm, patient: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.patientId}) - {p.gender}, {p.age} yrs
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  OT Suite Room *
                </label>
                <select
                  value={bookingForm.theatreNumber}
                  onChange={(e) => setBookingForm({ ...bookingForm, theatreNumber: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="OT Suite 1 (Cardiothoracic)">OT Suite 1 (Cardiothoracic)</option>
                  <option value="OT Suite 2 (Neuro/Spine)">OT Suite 2 (Neuro/Spine)</option>
                  <option value="OT Suite 3 (Orthopedics)">OT Suite 3 (Orthopedics)</option>
                  <option value="OT Suite 4 (General/Lap)">OT Suite 4 (General/Lap)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Procedure Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Total Knee Arthroplasty (Left)"
                  value={bookingForm.procedureName}
                  onChange={(e) => setBookingForm({ ...bookingForm, procedureName: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Specialty
                </label>
                <input
                  type="text"
                  placeholder="e.g. Orthopedics / Cardiology"
                  value={bookingForm.specialty}
                  onChange={(e) => setBookingForm({ ...bookingForm, specialty: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Lead Surgeon *
                </label>
                <select
                  value={bookingForm.leadSurgeon}
                  onChange={(e) => setBookingForm({ ...bookingForm, leadSurgeon: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Anesthetist
                </label>
                <select
                  value={bookingForm.anesthetist}
                  onChange={(e) => setBookingForm({ ...bookingForm, anesthetist: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Anesthesia Type
                </label>
                <select
                  value={bookingForm.anesthesiaType}
                  onChange={(e) =>
                    setBookingForm({ ...bookingForm, anesthesiaType: e.target.value as any })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  <option value="General">General Anesthesia</option>
                  <option value="Spinal">Spinal Anesthesia</option>
                  <option value="Epidural">Epidural</option>
                  <option value="Local">Local Anesthesia</option>
                  <option value="Regional Nerve Block">Regional Nerve Block</option>
                  <option value="Sedation">Monitored Sedation</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Surgery Date
                </label>
                <input
                  type="date"
                  value={bookingForm.scheduledDate}
                  onChange={(e) => setBookingForm({ ...bookingForm, scheduledDate: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Start Time
                </label>
                <input
                  type="time"
                  value={bookingForm.startTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Expected End Time
                </label>
                <input
                  type="time"
                  value={bookingForm.endTime}
                  onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsBookOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-md shadow-teal-600/20"
              >
                {submitting ? "Booking..." : "Schedule Surgery"}
              </button>
            </div>
          </form>
        </Modal>

        {/* Modal: Post-Op Notes */}
        <Modal
          isOpen={isPostOpOpen}
          onClose={() => setIsPostOpOpen(false)}
          title={`Post-Operative Documentation: ${activeSurgery?.procedureName || ""}`}
          size="lg"
        >
          <form onSubmit={handlePostOpSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Surgical Findings
              </label>
              <textarea
                rows={3}
                placeholder="Document anatomy encountered, pathology resected, implants positioned..."
                value={postOpForm.surgicalFindings}
                onChange={(e) =>
                  setPostOpForm({ ...postOpForm, surgicalFindings: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Post-Op Recovery & PACU Plan
              </label>
              <textarea
                rows={2}
                placeholder="Document extubation status, analgesia, drain monitoring, antibiotics..."
                value={postOpForm.postOpNotes}
                onChange={(e) =>
                  setPostOpForm({ ...postOpForm, postOpNotes: e.target.value })
                }
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Blood Units Transfused (PRBC)
                </label>
                <input
                  type="number"
                  min="0"
                  value={postOpForm.bloodUnitsUsed}
                  onChange={(e) =>
                    setPostOpForm({
                      ...postOpForm,
                      bloodUnitsUsed: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  PACU Aldrete Recovery Score (0-10)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={postOpForm.pacuScore}
                  onChange={(e) =>
                    setPostOpForm({ ...postOpForm, pacuScore: parseInt(e.target.value) || 10 })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsPostOpOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-teal-600 px-5 py-2 text-xs font-bold text-white hover:bg-teal-700 shadow-md shadow-teal-600/20"
              >
                {submitting ? "Saving..." : "Complete & Finalize Post-Op"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
  );
}
