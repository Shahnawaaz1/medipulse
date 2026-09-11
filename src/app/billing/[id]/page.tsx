"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft, HeartPulse, Receipt, CheckCircle2 } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function PrintInvoicePage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/billing/${id}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  if (loading) {
    return <LoadingSpinner label="Preparing hospital invoice receipt..." />;
  }

  if (!data?.invoice) {
    return (
      <div className="py-12 text-center text-xs">
        <p>Invoice not found.</p>
        <Link href="/billing" className="text-brand-600 font-bold hover:underline">
          Return to Invoices
        </Link>
      </div>
    );
  }

  const { invoice, hospitalSetting } = data;
  const patient = invoice.patient;
  const doctor = invoice.doctor;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/billing"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Billing</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-all"
        >
          <Printer className="h-4 w-4" />
          <span>Print Tax Invoice / Receipt</span>
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-lg text-slate-900 dark:bg-white dark:text-slate-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-brand-600 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow">
              <HeartPulse className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-brand-900">
                {hospitalSetting?.hospitalName || "MediPulse Hospital"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Official Healthcare Invoice & Settlement Receipt
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Tax ID: {hospitalSetting?.taxId || "TX-MED-883921"} • Phone: {hospitalSetting?.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono text-sm font-extrabold text-brand-700">
              {invoice.invoiceNumber}
            </span>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Invoice Date: {formatDate(invoice.invoiceDate)}
            </p>
            <div className="mt-1">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                  invoice.paymentStatus === "Paid"
                    ? "bg-emerald-100 text-emerald-800"
                    : invoice.paymentStatus === "Partially Paid"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-rose-100 text-rose-800"
                }`}
              >
                {invoice.paymentStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Billed To / Attending Physician */}
        <div className="my-6 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 text-xs border border-slate-100">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Billed To (Patient)</p>
            <p className="font-bold text-sm text-slate-900 mt-0.5">{patient?.name}</p>
            <p className="text-slate-600">Patient ID: {patient?.patientId}</p>
            <p className="text-slate-500">
              {patient?.address}, {patient?.city} • {patient?.phone}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Attending Physician / Department</p>
            <p className="font-bold text-sm text-slate-900 mt-0.5">{doctor?.name || "General Facility Staff"}</p>
            <p className="text-slate-600">{doctor?.department || "Hospital Inpatient & Diagnostic Services"}</p>
            <p className="text-slate-500">Payment Mode: {invoice.paymentMethod || "Cash"}</p>
          </div>
        </div>

        {/* Invoice Items Table */}
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-[11px] font-bold text-slate-600">
                  <th className="p-3">#</th>
                  <th className="p-3">Service / Medication Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Unit Price</th>
                  <th className="p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoice.items?.map((item: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{item.description}</td>
                    <td className="p-3 text-slate-500">{item.category}</td>
                    <td className="p-3 text-center font-semibold">{item.quantity}</td>
                    <td className="p-3 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end pt-2">
            <div className="w-64 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between">
                  <span>Tax & Healthcare Levies:</span>
                  <span>+{formatCurrency(invoice.tax)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-extrabold text-slate-900">
                <span>Total Amount:</span>
                <span className="text-brand-900">{formatCurrency(invoice.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Amount Paid:</span>
                <span>{formatCurrency(invoice.paidAmount)}</span>
              </div>
              {invoice.balanceAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-extrabold text-sm border-t border-slate-100 pt-1">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(invoice.balanceAmount)}</span>
                </div>
              )}
            </div>
          </div>

          {invoice.notes && (
            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100">
              <span className="font-bold">Billing Remarks:</span> {invoice.notes}
            </div>
          )}
        </div>

        {/* Footer Authorization */}
        <div className="mt-16 flex items-end justify-between border-t border-slate-200 pt-6">
          <div className="text-[10px] text-slate-400">
            <p>Thank you for choosing MediPulse Hospital.</p>
            <p>Computer generated invoice. No physical signature required.</p>
          </div>
          <div className="text-center">
            <div className="h-10 w-32 border-b border-slate-400 border-dashed mb-1" />
            <p className="text-xs font-bold text-slate-800">Authorized Accounts Officer</p>
            <p className="text-[10px] text-slate-400">Finance & Billing Department</p>
          </div>
        </div>
      </div>
    </div>
  );
}
