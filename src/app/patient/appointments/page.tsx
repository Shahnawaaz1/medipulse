"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Plus,
  Search,
  Filter,
  Stethoscope,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Booking Modal State
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    doctor: "",
    department: "General Medicine",
    appointmentDate: new Date().toISOString().split("T")[0],
    timeSlot: "10:00 AM - 10:15 AM",
    type: "General",
    reason: "Routine Consultation",
  });

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/appointments");
      if (res.ok) {
        const d = await res.json();
        setAppointments(d.appointments || []);
      }
    } catch {
      toast.error("Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    async function loadMetadata() {
      try {
        const [docRes, deptRes] = await Promise.all([
          fetch("/api/doctors"),
          fetch("/api/departments"),
        ]);
        if (docRes.ok) {
          const d = await docRes.json();
          setDoctors(d.doctors || []);
          if (d.doctors?.length > 0) {
            setFormData((prev) => ({
              ...prev,
              doctor: d.doctors[0]._id,
              department: d.doctors[0].department || prev.department,
            }));
          }
        }
        if (deptRes.ok) {
          const dep = await deptRes.json();
          setDepartments(dep.departments || []);
        }
      } catch (e) {
        console.error("Failed to load metadata", e);
      }
    }
    loadMetadata();
  }, []);

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.doctor || !formData.appointmentDate || !formData.timeSlot) {
      toast.error("Please select a doctor, appointment date, and time slot.");
      return;
    }

    const selectedDoc = doctors.find((d) => d._id === formData.doctor);
    const payload = {
      ...formData,
      department: formData.department || selectedDoc?.department || "General Medicine",
      reason: formData.reason.trim() || "Routine Consultation",
    };

    try {
      setSubmitting(true);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Appointment booked successfully!");
        setIsBookModalOpen(false);
        fetchAppointments();
      } else {
        toast.error(data.error || "Failed to book appointment.");
      }
    } catch {
      toast.error("Network error while booking appointment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            My Appointments & Bookings
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View upcoming consultations, past visits, or schedule a new doctor appointment.
          </p>
        </div>

        <button
          onClick={() => setIsBookModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-teal-600 to-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-teal-500/25 hover:brightness-110 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Book New Appointment</span>
        </button>
      </div>

      {/* Appointments List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {appointments.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Appointments Found"
            description="You have not booked any appointments yet. Click the button below to schedule your consultation."
            action={{
              label: "Book Appointment Now",
              onClick: () => setIsBookModalOpen(true),
            }}
          />
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt._id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-800/40 transition-all"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300 shrink-0">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {apt.doctor?.name || "Consulting Doctor"}
                      </h3>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                        {apt.appointmentId}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Speciality: {apt.doctor?.specialization || apt.doctor?.department || "General"} • Room: {apt.doctor?.roomNumber || "OPD-101"}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-teal-500" />
                        {apt.appointmentDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-teal-500" />
                        {apt.timeSlot}
                      </span>
                      <span className="text-slate-400">• Type: {apt.type || "General"}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center">
                  <StatusBadge status={apt.status || "Confirmed"} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Book Appointment Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Book Doctor Appointment"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Doctor / Specialist *
            </label>
            <select
              required
              value={formData.doctor}
              onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} — {doc.department} ({doc.specialization})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Appointment Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                value={formData.appointmentDate}
                onChange={(e) =>
                  setFormData({ ...formData, appointmentDate: e.target.value })
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Available Time Slot *
              </label>
              <select
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="09:00 AM - 09:15 AM">09:00 AM - 09:15 AM</option>
                <option value="09:30 AM - 09:45 AM">09:30 AM - 09:45 AM</option>
                <option value="10:00 AM - 10:15 AM">10:00 AM - 10:15 AM</option>
                <option value="10:30 AM - 10:45 AM">10:30 AM - 10:45 AM</option>
                <option value="11:00 AM - 11:15 AM">11:00 AM - 11:15 AM</option>
                <option value="02:00 PM - 02:15 PM">02:00 PM - 02:15 PM</option>
                <option value="03:00 PM - 03:15 PM">03:00 PM - 03:15 PM</option>
                <option value="04:00 PM - 04:15 PM">04:00 PM - 04:15 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Consultation Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="General">General In-Person Consultation</option>
              <option value="Follow-up">Follow-up Consultation</option>
              <option value="Emergency">Urgent Care</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Chief Symptoms or Reason for Visit
            </label>
            <textarea
              rows={3}
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="e.g. Mild fever, chest pain, annual health checkup..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsBookModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-teal-600 to-brand-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:brightness-110 transition-all disabled:opacity-50"
            >
              {submitting ? "Booking..." : "Confirm Booking"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
