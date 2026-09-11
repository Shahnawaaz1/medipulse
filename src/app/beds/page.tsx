"use client";

import React, { useState, useEffect } from "react";
import {
  Bed as BedIcon,
  Plus,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  User,
  DollarSign,
  Hotel,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function BedMatrixPage() {
  const [beds, setBeds] = useState<any[]>([]);
  const [wardMap, setWardMap] = useState<Record<string, any[]>>({});
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [selectedBed, setSelectedBed] = useState<any>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [newBedForm, setNewBedForm] = useState({
    bedNumber: "",
    ward: "Intensive Care Unit (ICU)",
    roomNumber: "ICU Pod C",
    type: "ICU",
    dailyRate: 450,
    status: "Available",
  });

  const fetchBeds = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/beds");
      if (res.ok) {
        const json = await res.json();
        setBeds(json.beds || []);
        setWardMap(json.wardMap || {});
        setSummary(json.summary || {});
      }
    } catch {
      toast.error("Failed to load bed matrix");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeds();
  }, []);

  const handleUpdateBedStatus = async (status: string) => {
    if (!selectedBed) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/beds/${selectedBed._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Bed ${selectedBed.bedNumber} marked as ${status}`);
        setIsEditModalOpen(false);
        fetchBeds();
      }
    } catch {
      toast.error("Failed to update bed status");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateBed = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/beds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBedForm),
      });
      if (res.ok) {
        toast.success(`Bed ${newBedForm.bedNumber} added successfully!`);
        setIsAddModalOpen(false);
        fetchBeds();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add bed");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const getBedCardStyle = (status: string) => {
    switch (status) {
      case "Available":
        return "border-emerald-200 bg-emerald-50/50 hover:border-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900";
      case "Occupied":
        return "border-rose-200 bg-rose-50/50 hover:border-rose-400 dark:bg-rose-950/30 dark:border-rose-900";
      case "Reserved":
        return "border-amber-200 bg-amber-50/50 hover:border-amber-400 dark:bg-amber-950/30 dark:border-amber-900";
      case "Maintenance":
        return "border-slate-200 bg-slate-100/60 hover:border-slate-400 dark:bg-slate-800/40 dark:border-slate-800";
      default:
        return "border-slate-200 bg-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Visual Bed Occupancy Matrix
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time ward telemetry, room allocation, patient occupancy map, and daily tariffs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/ipd"
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Hotel className="h-4 w-4" />
            <span>Admissions List</span>
          </Link>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Bed</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Pill Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-400 uppercase">Total Beds</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {summary.total || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 shadow-sm dark:bg-emerald-950/30 dark:border-emerald-900">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
            Available
          </p>
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
            {summary.available || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4 shadow-sm dark:bg-rose-950/30 dark:border-rose-900">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase">
            Occupied
          </p>
          <p className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">
            {summary.occupied || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4 shadow-sm dark:bg-amber-950/30 dark:border-amber-900">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">
            Reserved
          </p>
          <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
            {summary.reserved || 0}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-100/80 p-4 shadow-sm dark:bg-slate-800/50 dark:border-slate-800 col-span-2 sm:col-span-1">
          <p className="text-xs font-semibold text-slate-500 uppercase">Maintenance</p>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300 mt-1">
            {summary.maintenance || 0}
          </p>
        </div>
      </div>

      {/* Visual Ward Bed Grid */}
      {loading ? (
        <LoadingSpinner label="Loading visual bed matrix..." />
      ) : (
        <div className="space-y-6">
          {Object.entries(wardMap).map(([wardName, wardBeds]) => (
            <div
              key={wardName}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
                    <Hotel className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {wardName}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {wardBeds.filter((b) => b.status === "Available").length} of {wardBeds.length} beds available
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                {wardBeds.map((b) => (
                  <button
                    key={b._id}
                    onClick={() => {
                      setSelectedBed(b);
                      setIsEditModalOpen(true);
                    }}
                    className={`flex flex-col justify-between rounded-2xl border p-4 text-left shadow-sm transition-all hover:scale-102 ${getBedCardStyle(
                      b.status
                    )}`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                          {b.bedNumber}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">
                          {b.type}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{b.roomNumber}</p>

                      {b.status === "Occupied" && (
                        <div className="mt-2 rounded-lg bg-rose-100/60 p-1.5 dark:bg-rose-950/60">
                          <p className="text-[10px] font-bold text-rose-800 dark:text-rose-300 truncate">
                            {b.patientName || "Admitted Patient"}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {formatCurrency(b.dailyRate)}/d
                      </span>
                      <StatusBadge status={b.status} size="sm" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bed Status Quick Manager Modal */}
      {selectedBed && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Bed Operations: ${selectedBed.bedNumber}`}
          subtitle={`${selectedBed.ward} (${selectedBed.roomNumber}) • Daily Rate: ${formatCurrency(selectedBed.dailyRate)}`}
          maxWidth="md"
        >
          <div className="space-y-4 text-xs">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
              <p className="text-slate-500">Current Occupancy Status:</p>
              <div className="mt-1 flex items-center gap-2">
                <StatusBadge status={selectedBed.status} />
                {selectedBed.patientName && (
                  <span className="font-bold text-slate-900 dark:text-white">
                    ({selectedBed.patientName})
                  </span>
                )}
              </div>
            </div>

            <p className="font-semibold text-slate-700 dark:text-slate-300">
              Change Bed Status:
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleUpdateBedStatus("Available")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:text-emerald-300"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Mark Available</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateBedStatus("Reserved")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 p-2.5 font-bold text-amber-700 hover:bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300"
              >
                <Clock className="h-4 w-4" />
                <span>Reserve Bed</span>
              </button>

              <button
                type="button"
                onClick={() => handleUpdateBedStatus("Maintenance")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-100 p-2.5 font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 col-span-2"
              >
                <Wrench className="h-4 w-4" />
                <span>Under Maintenance / Sanitization</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Bed Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Hospital Bed"
        subtitle="Register new bed unit in ward or ICU pod"
        maxWidth="md"
      >
        <form onSubmit={handleCreateBed} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Bed Number / Code *</label>
            <input
              type="text"
              required
              placeholder="e.g. ICU-04, GEN-301, DEL-401"
              value={newBedForm.bedNumber}
              onChange={(e) => setNewBedForm({ ...newBedForm, bedNumber: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Ward Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Intensive Care Unit (ICU)"
              value={newBedForm.ward}
              onChange={(e) => setNewBedForm({ ...newBedForm, ward: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Room / Pod Number *</label>
            <input
              type="text"
              required
              placeholder="e.g. ICU Pod B, Room 104"
              value={newBedForm.roomNumber}
              onChange={(e) => setNewBedForm({ ...newBedForm, roomNumber: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Bed Category</label>
            <select
              value={newBedForm.type}
              onChange={(e) => setNewBedForm({ ...newBedForm, type: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            >
              <option value="General">General</option>
              <option value="ICU">ICU</option>
              <option value="Semi-Private">Semi-Private</option>
              <option value="Deluxe">Deluxe Suite</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">Daily Rate ($) *</label>
            <input
              type="number"
              required
              min="0"
              value={newBedForm.dailyRate}
              onChange={(e) =>
                setNewBedForm({ ...newBedForm, dailyRate: Number(e.target.value) })
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-brand-700"
            >
              {submitting ? "Adding..." : "Add Bed Unit"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
