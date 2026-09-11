"use client";

import React, { useState, useEffect } from "react";
import {
  ScanLine,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  FileText,
  User,
  Stethoscope,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const modalities = ["X-Ray", "CT Scan", "MRI", "Ultrasound", "Mammography"];

export default function RadiologyPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalityFilter, setModalityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [orderForm, setOrderForm] = useState({
    patient: "",
    doctor: "",
    modality: "X-Ray",
    bodyPart: "Chest PA View",
    clinicalNotes: "",
    price: 65,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (modalityFilter) params.append("modality", modalityFilter);
      if (statusFilter) params.append("status", statusFilter);

      const [resRad, resPats, resDocs] = await Promise.all([
        fetch(`/api/radiology?${params.toString()}`),
        fetch("/api/patients"),
        fetch("/api/doctors"),
      ]);

      if (resRad.ok) {
        const json = await resRad.json();
        setOrders(json.orders || []);
      }
      if (resPats.ok) {
        const json = await resPats.json();
        setPatients(json.patients || []);
        if (json.patients?.length > 0 && !orderForm.patient) {
          setOrderForm((prev) => ({ ...prev, patient: json.patients[0]._id }));
        }
      }
      if (resDocs.ok) {
        const json = await resDocs.json();
        setDoctors(json.doctors || []);
        if (json.doctors?.length > 0 && !orderForm.doctor) {
          setOrderForm((prev) => ({ ...prev, doctor: json.doctors[0]._id }));
        }
      }
    } catch {
      toast.error("Failed to load radiology orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [modalityFilter, statusFilter]);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/radiology", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderForm),
      });

      if (res.ok) {
        toast.success("Radiology imaging order booked successfully!");
        setIsOrderModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create radiology order");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/radiology/${selectedOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          radiologistReport: selectedOrder.radiologistReport,
          impression: selectedOrder.impression,
          status: "Report Generated",
        }),
      });

      if (res.ok) {
        toast.success("Radiology report finalized and saved!");
        setIsReportModalOpen(false);
        fetchData();
      } else {
        toast.error("Failed to save report");
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
            Radiology & Diagnostic Imaging
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Digital X-Ray, Multi-Slice CT, 3T MRI, Ultrasound diagnostics, and radiologist reports
          </p>
        </div>
        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Book Radiology Scan</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={modalityFilter}
            onChange={(e) => setModalityFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All Modalities</option>
            {modalities.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All Statuses</option>
            <option value="Ordered">Ordered</option>
            <option value="Scheduled">Scheduled</option>
            <option value="In Progress">In Progress</option>
            <option value="Report Generated">Report Generated</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          {orders.length} Radiology Orders Found
        </span>
      </div>

      {/* Orders List */}
      {loading ? (
        <LoadingSpinner label="Loading radiology orders..." />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={ScanLine}
          title="No radiology orders found"
          description="Schedule a diagnostic scan (X-Ray, CT, MRI, Ultrasound) for a patient."
          actionText="Book Radiology Scan"
          onAction={() => setIsOrderModalOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Order ID & Date</th>
                  <th className="px-5 py-3.5">Patient Details</th>
                  <th className="px-5 py-3.5">Modality & Body Region</th>
                  <th className="px-5 py-3.5">Referring Doctor</th>
                  <th className="px-5 py-3.5">Tariff</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {orders.map((ord) => (
                  <tr
                    key={ord._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                        {ord.orderId}
                      </span>
                      <p className="text-[11px] text-slate-400">{formatDate(ord.orderDate)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/patients/${ord.patient?._id || ord.patient}`}
                        className="font-bold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                      >
                        {ord.patient?.name || "Patient"}
                      </Link>
                      <p className="text-[11px] text-slate-400">{ord.patient?.patientId}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                        {ord.modality}
                      </span>
                      <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                        {ord.bodyPart}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {ord.doctor?.name}
                      </p>
                      <p className="text-[11px] text-slate-400">{ord.doctor?.department}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(ord.price)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={ord.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {ord.status !== "Report Generated" ? (
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setIsReportModalOpen(true);
                            }}
                            className="rounded-xl bg-brand-600 px-3 py-1 text-xs font-bold text-white hover:bg-brand-700 shadow-sm"
                          >
                            Enter Report
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedOrder(ord);
                              setIsReportModalOpen(true);
                            }}
                            className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                          >
                            View Report
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Scan Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Book Diagnostic Radiology Scan"
        subtitle="Schedule MRI, CT, X-Ray or Ultrasound investigation"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold mb-1">Select Patient *</label>
              <select
                required
                value={orderForm.patient}
                onChange={(e) => setOrderForm({ ...orderForm, patient: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {patients.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.patientId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Referring Doctor *</label>
              <select
                required
                value={orderForm.doctor}
                onChange={(e) => setOrderForm({ ...orderForm, doctor: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {doctors.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} ({d.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Imaging Modality *</label>
              <select
                value={orderForm.modality}
                onChange={(e) => setOrderForm({ ...orderForm, modality: e.target.value as any })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {modalities.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Anatomical Region / Body Part *</label>
              <input
                type="text"
                required
                placeholder="e.g. Brain MRI, Lumbar Spine, Abdomen USG"
                value={orderForm.bodyPart}
                onChange={(e) => setOrderForm({ ...orderForm, bodyPart: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Scan Tariff Price ($) *</label>
              <input
                type="number"
                required
                min="0"
                value={orderForm.price}
                onChange={(e) => setOrderForm({ ...orderForm, price: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Clinical Indication & Notes *</label>
              <textarea
                required
                rows={2}
                placeholder="Clinical history, rule out pathology..."
                value={orderForm.clinicalNotes}
                onChange={(e) => setOrderForm({ ...orderForm, clinicalNotes: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsOrderModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-brand-700"
            >
              {submitting ? "Booking..." : "Book Scan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enter Radiologist Report Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          title={`Radiology Report: ${selectedOrder.orderId} (${selectedOrder.modality})`}
          subtitle={`Patient: ${selectedOrder.patient?.name} • Region: ${selectedOrder.bodyPart}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveReport} className="space-y-4 text-xs">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/40">
              <p className="font-semibold text-slate-500">Clinical Indication:</p>
              <p className="text-slate-800 dark:text-slate-200 mt-0.5">{selectedOrder.clinicalNotes}</p>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Radiological Findings & Description *
              </label>
              <textarea
                required
                rows={5}
                placeholder="Detailed radiological observations across sequences..."
                value={selectedOrder.radiologistReport || ""}
                onChange={(e) =>
                  setSelectedOrder({ ...selectedOrder, radiologistReport: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white leading-relaxed"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Diagnostic Impression / Conclusion *
              </label>
              <textarea
                required
                rows={2}
                placeholder="Final summary diagnosis / impression..."
                value={selectedOrder.impression || ""}
                onChange={(e) =>
                  setSelectedOrder({ ...selectedOrder, impression: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-semibold"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsReportModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-brand-700"
              >
                Save & Authorize Report
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
