"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft, HeartPulse, FlaskConical, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function PrintLabReportPage() {
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/laboratory/${id}`);
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
    return <LoadingSpinner label="Preparing pathology report..." />;
  }

  if (!data?.order) {
    return (
      <div className="py-12 text-center text-xs">
        <p>Lab order not found.</p>
        <Link href="/laboratory" className="text-brand-600 font-bold hover:underline">
          Return to Laboratory
        </Link>
      </div>
    );
  }

  const { order, hospitalSetting } = data;
  const patient = order.patient;
  const doctor = order.doctor;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          href="/laboratory"
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Laboratory</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-all"
        >
          <Printer className="h-4 w-4" />
          <span>Print Laboratory Report</span>
        </button>
      </div>

      {/* Printable Report Document */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-lg text-slate-900 dark:bg-white dark:text-slate-900">
        {/* Hospital Header */}
        <div className="flex items-start justify-between border-b-2 border-brand-600 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow">
              <FlaskConical className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-brand-900">
                {hospitalSetting?.hospitalName || "MediPulse Hospital"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Department of Laboratory Medicine & Pathology Sciences
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Accredited Diagnostic Pathology Laboratory • Phone: {hospitalSetting?.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-extrabold text-brand-700">{order.orderId}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Reported: {order.completedAt || formatDate(order.orderDate)}
            </p>
          </div>
        </div>

        {/* Patient and Doctor Demographics */}
        <div className="my-6 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 text-xs border border-slate-100">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Patient Details</p>
            <p className="font-bold text-sm text-slate-900 mt-0.5">
              {patient?.name} ({patient?.patientId})
            </p>
            <p className="text-slate-600">
              {patient?.gender}, {patient?.age} Years • Blood: <span className="font-bold text-rose-600">{patient?.bloodGroup}</span>
            </p>
            <p className="text-slate-500">Phone: {patient?.phone}</p>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400">Referring Physician</p>
            <p className="font-bold text-sm text-slate-900 mt-0.5">{doctor?.name}</p>
            <p className="text-slate-600">{doctor?.department}</p>
            <p className="text-slate-500">Sample Date: {formatDate(order.orderDate)}</p>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {order.tests?.map((t: any, idx: number) => (
            <div key={idx} className="space-y-2">
              <h3 className="font-extrabold text-sm text-brand-900 border-b border-slate-200 pb-1">
                {t.name}
              </h3>

              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-[11px] font-bold text-slate-600">
                      <th className="p-3">Investigation Parameter</th>
                      <th className="p-3">Observed Value</th>
                      <th className="p-3">Unit</th>
                      <th className="p-3">Reference Range</th>
                      <th className="p-3">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {t.results?.map((res: any, rIdx: number) => (
                      <tr key={rIdx}>
                        <td className="p-3 font-semibold text-slate-900">{res.parameter}</td>
                        <td className="p-3 font-bold text-slate-900">{res.value || "-"}</td>
                        <td className="p-3 text-slate-500">{res.unit}</td>
                        <td className="p-3 text-slate-500">{res.referenceRange}</td>
                        <td className="p-3">
                          <span
                            className={`font-bold ${
                              res.flag === "Normal" ? "text-emerald-600" : "text-rose-600 font-extrabold"
                            }`}
                          >
                            {res.flag || "Normal"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          {order.clinicalFindings && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs">
              <p className="font-bold text-slate-800">Pathologist Impression & Clinical Notes:</p>
              <p className="mt-1 text-slate-700 italic leading-relaxed">
                {order.clinicalFindings}
              </p>
            </div>
          )}
        </div>

        {/* Footer Sign-off */}
        <div className="mt-16 flex items-end justify-between border-t border-slate-200 pt-6">
          <div className="text-[10px] text-slate-400">
            <p>Certified Laboratory Report. Validated with internal controls.</p>
            <p>End of Diagnostic Investigation.</p>
          </div>
          <div className="text-center">
            <div className="h-10 w-32 border-b border-slate-400 border-dashed mb-1" />
            <p className="text-xs font-bold text-slate-800">Lead Clinical Pathologist</p>
            <p className="text-[10px] text-slate-400">MediPulse Pathology Labs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
