"use client";

import React, { useState, useEffect } from "react";
import {
  Receipt,
  Plus,
  Search,
  Filter,
  DollarSign,
  Printer,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Trash2,
  ShieldCheck,
  Package,
  QrCode,
  ArrowRight,
  Download,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const itemCategories = [
  "Consultation",
  "Pharmacy",
  "Laboratory",
  "Radiology",
  "Room Charges",
  "Procedure",
  "Nursing",
  "Package",
  "Other",
];

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState<"invoices" | "insurance" | "packages" | "qrpay">("invoices");

  const [invoices, setInvoices] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [insuranceClaims, setInsuranceClaims] = useState<any[]>([]);
  const [healthPackages, setHealthPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrInvoice, setQrInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [submitting, setSubmitting] = useState(false);

  // New Claim Modal State
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimForm, setClaimForm] = useState({
    patient: "",
    tpaCompany: "Star Health & Allied Insurance",
    policyNumber: "POL-STAR-",
    policyHolderName: "",
    treatmentName: "Coronary Angioplasty",
    claimedAmount: 120000,
    hospitalizationType: "Cashless",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    patient: "",
    doctor: "",
    discount: 0,
    tax: 0,
    paidAmount: 0,
    paymentMethod: "UPI",
    notes: "",
    items: [
      {
        description: "Specialist Consultation Fee",
        category: "Consultation",
        quantity: 1,
        unitPrice: 800,
        total: 800,
      },
    ],
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const [resInv, resPats, resDocs, resClaims, resPkgs] = await Promise.all([
        fetch(`/api/billing?${params.toString()}`),
        fetch("/api/patients"),
        fetch("/api/doctors"),
        fetch("/api/insurance"),
        fetch("/api/packages"),
      ]);

      if (resInv.ok) {
        const json = await resInv.json();
        setInvoices(json.invoices || []);
        setSummary(json.summary || {});
      }
      if (resPats.ok) {
        const json = await resPats.json();
        setPatients(json.patients || []);
        if (json.patients?.length > 0 && !invoiceForm.patient) {
          setInvoiceForm((prev) => ({ ...prev, patient: json.patients[0]._id }));
          setClaimForm((prev) => ({
            ...prev,
            patient: json.patients[0]._id,
            policyHolderName: json.patients[0].name,
          }));
        }
      }
      if (resDocs.ok) {
        const json = await resDocs.json();
        setDoctors(json.doctors || []);
        if (json.doctors?.length > 0 && !invoiceForm.doctor) {
          setInvoiceForm((prev) => ({ ...prev, doctor: json.doctors[0]._id }));
        }
      }
      if (resClaims.ok) {
        const json = await resClaims.json();
        setInsuranceClaims(json.data || []);
      }
      if (resPkgs.ok) {
        const json = await resPkgs.json();
        setHealthPackages(json.data || []);
      }
    } catch {
      toast.error("Failed to load invoices and financial records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleAddItemRow = () => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "Laboratory Investigation / Medication",
          category: "Laboratory",
          quantity: 1,
          unitPrice: 500,
          total: 500,
        },
      ],
    }));
  };

  const handleRemoveItemRow = (idx: number) => {
    setInvoiceForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleItemChange = (idx: number, field: string, value: any) => {
    setInvoiceForm((prev) => {
      const copy = [...prev.items];
      (copy[idx] as any)[field] = value;
      const qty = Number(copy[idx].quantity) || 1;
      const price = Number(copy[idx].unitPrice) || 0;
      copy[idx].total = qty * price;
      return { ...prev, items: copy };
    });
  };

  const calculateSubtotal = () => {
    return invoiceForm.items.reduce((acc, item) => acc + (Number(item.total) || 0), 0);
  };

  const calculateTotal = () => {
    const sub = calculateSubtotal();
    return Math.max(0, sub - (Number(invoiceForm.discount) || 0) + (Number(invoiceForm.tax) || 0));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceForm.items.length === 0) {
      toast.error("Please add at least one line item to the invoice.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoiceForm,
          subtotal: calculateSubtotal(),
          totalAmount: calculateTotal(),
        }),
      });

      if (res.ok) {
        toast.success("Invoice generated successfully!");
        setIsNewModalOpen(false);
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to create invoice");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePackageInvoice = async (pkg: any) => {
    if (!patients || patients.length === 0) {
      toast.error("No patient available to invoice");
      return;
    }
    try {
      const res = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patients[0]._id,
          doctor: doctors[0]?._id,
          items: [
            {
              description: `${pkg.name} (${pkg.packageCode})`,
              category: "Package",
              quantity: 1,
              unitPrice: pkg.price,
              total: pkg.price,
            },
          ],
          subtotal: pkg.price,
          discount: 0,
          tax: 0,
          totalAmount: pkg.price,
          paidAmount: pkg.price,
          paymentMethod: "UPI",
          notes: `Health Package Billing for ${pkg.name}`,
        }),
      });
      if (res.ok) {
        toast.success(`Invoice for ${pkg.name} generated & paid!`);
        fetchData();
        setActiveTab("invoices");
      }
    } catch (e) {
      toast.error("Failed to bill package");
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/insurance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(claimForm),
      });
      if (res.ok) {
        toast.success("TPA Cashless Pre-Auth Claim Submitted!");
        setIsClaimModalOpen(false);
        fetchData();
      } else {
        toast.error("Failed to submit claim");
      }
    } catch {
      toast.error("Claim submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      setSubmitting(true);
      const newPaidTotal = (selectedInvoice.paidAmount || 0) + Number(paymentAmount);
      const res = await fetch(`/api/billing/${selectedInvoice._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paidAmount: newPaidTotal,
          paymentMethod,
        }),
      });

      if (res.ok) {
        toast.success(`Payment of ${formatCurrency(paymentAmount)} recorded!`);
        setIsPaymentModalOpen(false);
        fetchData();
      } else {
        toast.error("Failed to record payment");
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
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 mb-1">
            <Receipt className="h-3.5 w-3.5" />
            <span>FINANCIAL & TPA INSURANCE SUITE</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Billing, TPA Insurance & Health Packages
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Cashless insurance claims, itemized tax invoices, health package billing, and instant UPI QR payments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsClaimModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl border border-emerald-600 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-all dark:bg-emerald-950 dark:text-emerald-300"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>New TPA Claim</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Create Invoice</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Billed</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {formatCurrency(summary.totalBilled || 0)}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950">
            <Receipt className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm dark:bg-emerald-950/30 dark:border-emerald-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
              Collected (Paid)
            </p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
              {formatCurrency(summary.totalCollected || 0)}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-3xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm dark:bg-rose-950/30 dark:border-rose-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase">
              Pending / Outstanding
            </p>
            <p className="text-2xl font-black text-rose-700 dark:text-rose-300 mt-1">
              {formatCurrency(summary.totalPending || 0)}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
        {[
          { id: "invoices", label: "Invoices & Receipts", icon: Receipt },
          { id: "insurance", label: "TPA & Cashless Claims", icon: ShieldCheck },
          { id: "packages", label: "Health Packages", icon: Package },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all ${
                isActive
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: INVOICES TABLE */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Payment Statuses</option>
              <option value="Paid">Paid in Full</option>
              <option value="Partially Paid">Partially Paid</option>
              <option value="Pending">Pending Payment</option>
            </select>

            <span className="text-xs font-semibold text-slate-400">
              {invoices.length} Invoices Available
            </span>
          </div>

          {loading ? (
            <LoadingSpinner label="Loading billing invoices..." />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No invoices found"
              description="Create a patient invoice for consultations, bed charges, or diagnostic tests."
              actionText="Create Invoice"
              onAction={() => setIsNewModalOpen(true)}
            />
          ) : (
            <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                      <th className="px-5 py-3.5">Invoice # & Date</th>
                      <th className="px-5 py-3.5">Patient Details</th>
                      <th className="px-5 py-3.5">Total Amount</th>
                      <th className="px-5 py-3.5">Amount Paid</th>
                      <th className="px-5 py-3.5">Balance Due</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {invoices.map((inv) => (
                      <tr
                        key={inv._id}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-5 py-4">
                          <span className="font-mono font-bold text-brand-600 dark:text-brand-400">
                            {inv.invoiceNumber}
                          </span>
                          <p className="text-[11px] text-slate-400">{formatDate(inv.invoiceDate)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/patients/${inv.patient?._id || inv.patient}`}
                            className="font-bold text-slate-900 hover:text-brand-600 dark:text-white dark:hover:text-brand-400"
                          >
                            {inv.patient?.name || "Patient"}
                          </Link>
                          <p className="text-[11px] text-slate-400">{inv.patient?.patientId}</p>
                        </td>
                        <td className="px-5 py-4 font-black text-slate-900 dark:text-white">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="px-5 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(inv.paidAmount)}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`font-bold ${
                              inv.balanceAmount > 0
                                ? "text-rose-600 font-black"
                                : "text-slate-400"
                            }`}
                          >
                            {formatCurrency(inv.balanceAmount)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={inv.paymentStatus} size="sm" />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {inv.balanceAmount > 0 && (
                              <>
                                <button
                                  onClick={() => {
                                    setQrInvoice(inv);
                                    setIsQrModalOpen(true);
                                  }}
                                  className="rounded-xl bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100 flex items-center gap-1 dark:bg-teal-950 dark:text-teal-300"
                                >
                                  <QrCode className="h-3.5 w-3.5" />
                                  <span>QR Pay</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(inv);
                                    setPaymentAmount(inv.balanceAmount);
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300"
                                >
                                  Record Pay
                                </button>
                              </>
                            )}
                            <Link
                              href={`/billing/${inv._id}`}
                              className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                            >
                              <Printer className="h-3.5 w-3.5" />
                              <span>Print</span>
                            </Link>
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

      {/* TAB 2: TPA INSURANCE CLAIMS */}
      {activeTab === "insurance" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                TPA & Cashless Pre-Authorization Claims
              </h3>
              <p className="text-xs text-slate-400">
                Direct integration with Star Health, Medi Assist, ICICI Lombard, HDFC ERGO, Vidal Health
              </p>
            </div>
            <button
              onClick={() => setIsClaimModalOpen(true)}
              className="rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
            >
              + Submit Cashless Claim
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {insuranceClaims.map((claim) => (
              <div
                key={claim._id}
                className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs text-brand-600">
                    {claim.claimId}
                  </span>
                  <StatusBadge status={claim.status} size="sm" />
                </div>

                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {claim.patient?.name || claim.policyHolderName}
                  </h4>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {claim.tpaCompany}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Policy: {claim.policyNumber}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Claimed:</span>
                    <span className="font-bold">{formatCurrency(claim.claimedAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Approved:</span>
                    <span className="font-black text-emerald-600">
                      {formatCurrency(claim.approvedAmount || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px] pt-1 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400">Procedure:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {claim.treatmentName}
                    </span>
                  </div>
                </div>

                {claim.queryDetails && (
                  <p className="text-[11px] text-slate-500 italic bg-amber-50/50 p-2 rounded-xl border border-amber-200/50">
                    "{claim.queryDetails}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HEALTH PACKAGES */}
      {activeTab === "packages" && (
        <div className="space-y-4">
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Institutional Health Checkup Packages
            </h3>
            <p className="text-xs text-slate-400">
              Pre-configured multi-parameter diagnostic panels with 1-click invoice creation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {healthPackages.map((pkg) => (
              <div
                key={pkg._id}
                className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800">
                      {pkg.category}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      {pkg.packageCode}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white mt-2">
                    {pkg.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">{pkg.description}</p>

                  <div className="my-4 text-2xl font-black text-emerald-600">
                    ₹{pkg.price}
                  </div>

                  <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    {pkg.features?.slice(0, 3).map((f: string, i: number) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => handlePackageInvoice(pkg)}
                  className="w-full rounded-2xl bg-brand-600 py-3 text-xs font-bold text-white hover:bg-brand-700 shadow"
                >
                  Generate Invoice for Package (₹{pkg.price})
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DYNAMIC UPI QR PAYMENT MODAL */}
      {isQrModalOpen && qrInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center dark:bg-slate-900 dark:border-slate-800 border">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              UPI Dynamic Payment QR
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Invoice #{qrInvoice.invoiceNumber} • {qrInvoice.patient?.name}
            </p>

            <div className="my-6 mx-auto w-48 h-48 rounded-2xl bg-slate-50 border-2 border-dashed border-teal-400 p-3 flex flex-col items-center justify-center dark:bg-slate-800">
              <QrCode className="h-28 w-28 text-slate-900 dark:text-white" />
              <span className="font-mono text-[10px] font-bold text-teal-600 mt-2">
                UPI: medipulse@icici
              </span>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 text-xs dark:bg-slate-800 mb-4">
              <span className="text-slate-400">Amount Due:</span>
              <span className="font-black text-lg text-emerald-600 block">
                {formatCurrency(qrInvoice.balanceAmount)}
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsQrModalOpen(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
              <button
                onClick={async () => {
                  await fetch(`/api/billing/${qrInvoice._id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      paidAmount: qrInvoice.totalAmount,
                      paymentMethod: "UPI",
                    }),
                  });
                  toast.success("UPI Payment verified instantly!");
                  setIsQrModalOpen(false);
                  fetchData();
                }}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-700"
              >
                Simulate UPI Success
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Claim Modal */}
      <Modal
        isOpen={isClaimModalOpen}
        onClose={() => setIsClaimModalOpen(false)}
        title="Submit TPA Cashless Insurance Claim"
        subtitle="Submit pre-authorization to insurance company"
        maxWidth="md"
      >
        <form onSubmit={handleCreateClaim} className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Select Patient *</label>
            <select
              value={claimForm.patient}
              onChange={(e) => {
                setClaimForm({ ...claimForm, patient: e.target.value });
                const p = patients.find((x) => x._id === e.target.value);
                if (p) setClaimForm((prev) => ({ ...prev, policyHolderName: p.name }));
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
            >
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.patientId})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1">TPA / Insurance Company *</label>
            <select
              value={claimForm.tpaCompany}
              onChange={(e) => setClaimForm({ ...claimForm, tpaCompany: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
            >
              <option value="Star Health & Allied Insurance">Star Health & Allied Insurance</option>
              <option value="Medi Assist Healthcare TPA">Medi Assist Healthcare TPA</option>
              <option value="HDFC ERGO General Insurance">HDFC ERGO General Insurance</option>
              <option value="ICICI Lombard Health Care">ICICI Lombard Health Care</option>
              <option value="Vidal Health TPA">Vidal Health TPA</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold mb-1">Policy Number *</label>
              <input
                type="text"
                value={claimForm.policyNumber}
                onChange={(e) => setClaimForm({ ...claimForm, policyNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Claim Amount (₹) *</label>
              <input
                type="number"
                value={claimForm.claimedAmount}
                onChange={(e) => setClaimForm({ ...claimForm, claimedAmount: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Planned Procedure / Treatment *</label>
            <input
              type="text"
              value={claimForm.treatmentName}
              onChange={(e) => setClaimForm({ ...claimForm, treatmentName: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsClaimModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow"
            >
              Submit Claim
            </button>
          </div>
        </form>
      </Modal>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Generate Hospital Invoice"
        subtitle="Add multi-item medical charges, discounts, taxes, and record payments"
        maxWidth="3xl"
      >
        <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold mb-1">Select Patient *</label>
              <select
                required
                value={invoiceForm.patient}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, patient: e.target.value })}
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
              <label className="block font-semibold mb-1">Primary Doctor</label>
              <select
                value={invoiceForm.doctor}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, doctor: e.target.value })}
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

          {/* Line Items Dynamic Builder */}
          <div className="space-y-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white">
                Invoice Line Items & Services
              </h4>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {invoiceForm.items.map((item, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-12 gap-2 rounded-xl border border-slate-200 bg-slate-50/40 p-2.5 dark:border-slate-800 dark:bg-slate-800/30 items-center"
                >
                  <div className="col-span-5">
                    <input
                      type="text"
                      required
                      placeholder="Service / Medicine description"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="col-span-3">
                    <select
                      value={item.category}
                      onChange={(e) => handleItemChange(idx, "category", e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    >
                      {itemCategories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-1">
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, "quantity", Number(e.target.value))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Price"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(idx, "unitPrice", Number(e.target.value))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white font-semibold"
                    />
                  </div>

                  <div className="col-span-1 flex justify-center">
                    {invoiceForm.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
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

          {/* Pricing Math Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
            <div>
              <label className="block font-semibold mb-1">Discount Amount (₹)</label>
              <input
                type="number"
                min="0"
                value={invoiceForm.discount}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, discount: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Tax / GST (₹)</label>
              <input
                type="number"
                min="0"
                value={invoiceForm.tax}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, tax: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Amount Paid Immediately (₹)</label>
              <input
                type="number"
                min="0"
                value={invoiceForm.paidAmount}
                onChange={(e) =>
                  setInvoiceForm({ ...invoiceForm, paidAmount: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-bold text-emerald-600"
              />
            </div>
          </div>

          {/* Total Calculation Display Card */}
          <div className="rounded-2xl bg-slate-900 p-4 text-white flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-400">Subtotal: {formatCurrency(calculateSubtotal())}</p>
              <p className="text-xs text-slate-300">
                Discount: -{formatCurrency(invoiceForm.discount)} • Tax: +{formatCurrency(invoiceForm.tax)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-400">Final Invoice Total</p>
              <p className="text-xl font-black text-teal-400">
                {formatCurrency(calculateTotal())}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              {submitting ? "Generating..." : "Generate Invoice"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Record Payment Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          title={`Record Payment for ${selectedInvoice.invoiceNumber}`}
          subtitle={`Patient: ${selectedInvoice.patient?.name} • Remaining Due: ${formatCurrency(selectedInvoice.balanceAmount)}`}
          maxWidth="sm"
        >
          <form onSubmit={handleRecordPayment} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="1"
                max={selectedInvoice.balanceAmount}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-bold text-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-semibold"
              >
                <option value="UPI">UPI (GooglePay / PhonePe / Paytm)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Cash">Cash Counter</option>
                <option value="Bank Transfer">Bank Wire Transfer</option>
                <option value="Insurance">Health Insurance Claim</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsPaymentModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                Confirm Payment
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
