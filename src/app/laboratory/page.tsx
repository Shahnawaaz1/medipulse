"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  FileSpreadsheet,
  TestTube,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function LaboratoryPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [testsCatalog, setTestsCatalog] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"orders" | "catalog">("orders");
  const [statusFilter, setStatusFilter] = useState("");
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [orderForm, setOrderForm] = useState({
    patient: "",
    doctor: "",
    tests: [] as any[],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const [resLab, resPats, resDocs] = await Promise.all([
        fetch(`/api/laboratory?${params.toString()}`),
        fetch("/api/patients"),
        fetch("/api/doctors"),
      ]);

      if (resLab.ok) {
        const json = await resLab.json();
        setOrders(json.orders || []);
        setTestsCatalog(json.testsCatalog || []);
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
      toast.error("Failed to load laboratory data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleTestCheckboxToggle = (test: any) => {
    setOrderForm((prev) => {
      const exists = prev.tests.some((t) => t.test === test._id);
      if (exists) {
        return { ...prev, tests: prev.tests.filter((t) => t.test !== test._id) };
      } else {
        return {
          ...prev,
          tests: [
            ...prev.tests,
            {
              test: test._id,
              name: test.name,
              price: test.price,
              results: test.referenceRanges?.map((r: any) => ({
                parameter: r.parameter,
                value: "",
                unit: r.unit,
                referenceRange: `${r.normalMale} (M) / ${r.normalFemale} (F)`,
                flag: "Normal",
              })),
            },
          ],
        };
      }
    });
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (orderForm.tests.length === 0) {
      toast.error("Please select at least one laboratory test to order.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/laboratory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderForm),
      });

      if (res.ok) {
        toast.success("Diagnostic lab order created successfully!");
        setIsOrderModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to order lab tests");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/laboratory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast.success(`Lab order status updated to ${status}`);
        fetchData();
      }
    } catch {
      toast.error("Failed to update order");
    }
  };

  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/laboratory/${selectedOrder._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tests: selectedOrder.tests,
          clinicalFindings: selectedOrder.clinicalFindings,
          status: "Completed",
        }),
      });

      if (res.ok) {
        toast.success("Lab report completed and made available to physician!");
        setIsResultModalOpen(false);
        fetchData();
      }
    } catch {
      toast.error("Failed to save report");
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
            Diagnostic Laboratory & Pathology
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pathology test requisitions, specimen processing, diagnostic parameter entries, and digital report delivery
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <button
              onClick={() => setViewMode("orders")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                viewMode === "orders"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500"
              }`}
            >
              Orders & Reports
            </button>
            <button
              onClick={() => setViewMode("catalog")}
              className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                viewMode === "catalog"
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500"
              }`}
            >
              Test Catalog
            </button>
          </div>

          <button
            onClick={() => setIsOrderModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Order Lab Test</span>
          </button>
        </div>
      </div>

      {/* Orders View */}
      {viewMode === "orders" && (
        <div className="space-y-4">
          {/* Status filter */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Order Statuses</option>
              <option value="Ordered">Ordered</option>
              <option value="Sample Collected">Sample Collected</option>
              <option value="Processing">Processing</option>
              <option value="Completed">Completed (Report Ready)</option>
            </select>
            <span className="text-xs font-semibold text-slate-400">
              {orders.length} Lab Test Orders
            </span>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading diagnostic lab orders..." />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="No diagnostic orders found"
              description="Request diagnostic tests for patients or change status filter."
              actionText="Order Lab Test"
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
                      <th className="px-5 py-3.5">Prescribing Physician</th>
                      <th className="px-5 py-3.5">Ordered Tests</th>
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
                          <p className="text-[11px] text-slate-400">
                            {ord.patient?.patientId} • Blood: {ord.patient?.bloodGroup}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {ord.doctor?.name || "Doctor"}
                          </p>
                          <p className="text-[11px] text-slate-400">{ord.doctor?.department}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {ord.tests?.map((t: any, idx: number) => (
                              <span
                                key={idx}
                                className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                              >
                                {t.name}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={ord.status} size="sm" />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {ord.status === "Ordered" && (
                              <button
                                onClick={() =>
                                  handleUpdateOrderStatus(ord._id, "Sample Collected")
                                }
                                className="rounded-xl bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-950 dark:text-teal-300"
                              >
                                Collect Sample
                              </button>
                            )}

                            {ord.status === "Sample Collected" && (
                              <button
                                onClick={() =>
                                  handleUpdateOrderStatus(ord._id, "Processing")
                                }
                                className="rounded-xl bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950 dark:text-purple-300"
                              >
                                Start Processing
                              </button>
                            )}

                            {ord.status === "Processing" && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(ord);
                                  setIsResultModalOpen(true);
                                }}
                                className="rounded-xl bg-brand-600 px-3 py-1 text-xs font-bold text-white hover:bg-brand-700 shadow-sm"
                              >
                                Enter Results
                              </button>
                            )}

                            {ord.status === "Completed" && (
                              <Link
                                href={`/laboratory/${ord._id}`}
                                className="flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1 text-xs font-bold text-white hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                <span>Report</span>
                              </Link>
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
        </div>
      )}

      {/* Catalog View */}
      {viewMode === "catalog" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testsCatalog.map((test) => (
            <div
              key={test._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-mono text-[10px] font-bold text-slate-400">
                    {test.testCode}
                  </span>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    {test.name}
                  </h3>
                  <span className="rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                    {test.category}
                  </span>
                </div>
                <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(test.price)}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400">{test.description}</p>

              <div className="border-t border-slate-100 pt-3 dark:border-slate-800 text-xs space-y-1 text-slate-600 dark:text-slate-300">
                <p>
                  <span className="font-semibold text-slate-400">Sample Type:</span>{" "}
                  {test.sampleType}
                </p>
                <p>
                  <span className="font-semibold text-slate-400">Turnaround:</span>{" "}
                  {test.turnaroundTime}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Lab Test Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Order Diagnostic Laboratory Tests"
        subtitle="Select patient, physician, and required clinical investigations"
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
              <label className="block font-semibold mb-1">Ordering Physician *</label>
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
          </div>

          {/* Test Selection Checkboxes */}
          <div className="border-t border-slate-100 pt-3 dark:border-slate-800 space-y-2">
            <h4 className="font-bold text-slate-800 dark:text-white">
              Choose Tests to Include in Order:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
              {testsCatalog.map((t) => {
                const isSelected = orderForm.tests.some((item) => item.test === t._id);
                return (
                  <label
                    key={t._id}
                    className={`flex items-center justify-between rounded-xl border p-2.5 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-brand-500 bg-brand-50/50 dark:bg-brand-950/40"
                        : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTestCheckboxToggle(t)}
                        className="rounded text-brand-600 focus:ring-brand-500"
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{t.name}</p>
                        <p className="text-[10px] text-slate-400">{t.category}</p>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(t.price)}
                    </span>
                  </label>
                );
              })}
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
              disabled={submitting || orderForm.tests.length === 0}
              className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? "Ordering..." : "Confirm Diagnostic Order"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Enter Test Results Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isResultModalOpen}
          onClose={() => setIsResultModalOpen(false)}
          title={`Enter Diagnostic Findings: ${selectedOrder.orderId}`}
          subtitle={`Patient: ${selectedOrder.patient?.name}`}
          maxWidth="2xl"
        >
          <form onSubmit={handleSaveResults} className="space-y-4 text-xs">
            {selectedOrder.tests?.map((t: any, tIdx: number) => (
              <div
                key={tIdx}
                className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <h4 className="font-bold text-sm text-brand-700 dark:text-brand-300">
                  {t.name}
                </h4>

                <div className="space-y-2">
                  {t.results?.map((res: any, rIdx: number) => (
                    <div
                      key={rIdx}
                      className="grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-4">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {res.parameter} ({res.unit})
                        </span>
                        <p className="text-[10px] text-slate-400">Ref: {res.referenceRange}</p>
                      </div>

                      <div className="col-span-4">
                        <input
                          type="text"
                          required
                          placeholder="Measured value"
                          value={res.value}
                          onChange={(e) => {
                            const copy = { ...selectedOrder };
                            copy.tests[tIdx].results[rIdx].value = e.target.value;
                            setSelectedOrder(copy);
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-bold"
                        />
                      </div>

                      <div className="col-span-4">
                        <select
                          value={res.flag}
                          onChange={(e) => {
                            const copy = { ...selectedOrder };
                            copy.tests[tIdx].results[rIdx].flag = e.target.value;
                            setSelectedOrder(copy);
                          }}
                          className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High</option>
                          <option value="Low">Low</option>
                          <option value="Abnormal">Abnormal</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div>
              <label className="block font-semibold mb-1">Pathologist / Clinical Findings Note</label>
              <textarea
                rows={2}
                placeholder="Overall interpretation of laboratory parameters..."
                value={selectedOrder.clinicalFindings || ""}
                onChange={(e) =>
                  setSelectedOrder({ ...selectedOrder, clinicalFindings: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResultModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-brand-700"
              >
                Complete & Release Report
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
