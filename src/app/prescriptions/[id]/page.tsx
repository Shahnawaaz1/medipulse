"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Printer, ArrowLeft, HeartPulse, Stethoscope, FileSignature } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";

export default function PrintPrescriptionPage() {
  const { isPatient } = useAuth();
  const params = useParams();
  const id = params?.id as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/prescriptions/${id}`);
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
    return <LoadingSpinner label="Preparing prescription slip..." />;
  }

  if (!data?.prescription) {
    return (
      <div className="py-12 text-center text-xs">
        <p>Prescription not found.</p>
        <Link href="/prescriptions" className="text-brand-600 font-bold hover:underline">
          Return to Prescriptions
        </Link>
      </div>
    );
  }

  const { prescription, hospitalSetting } = data;
  const patient = prescription.patient;
  const doctor = prescription.doctor;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Non-printable action bar */}
      <div className="flex items-center justify-between no-print">
        <Link
          href={isPatient ? "/patient/prescriptions" : "/prescriptions"}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Prescriptions</span>
        </Link>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-all"
        >
          <Printer className="h-4 w-4" />
          <span>Print Prescription</span>
        </button>
      </div>

      {/* Printable Sheet */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-10 shadow-lg text-slate-900 dark:bg-white dark:text-slate-900">
        {/* Hospital Header */}
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
                {hospitalSetting?.tagline || "World-Class Compassionate Healthcare"}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hospitalSetting?.address} • Phone: {hospitalSetting?.phone}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-extrabold text-brand-700">
              {prescription.prescriptionId}
            </p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">
              Date: {formatDate(prescription.date)}
            </p>
          </div>
        </div>

        {/* Doctor & Patient Info Bar */}
        <div className="my-6 grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 text-xs border border-slate-100">
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Consulting Specialist
            </p>
            <p className="font-bold text-sm text-slate-900 mt-0.5">{doctor?.name}</p>
            <p className="text-slate-600 font-medium">{doctor?.qualification} • {doctor?.specialization}</p>
            <p className="text-brand-600 font-semibold">{doctor?.department} ({doctor?.roomNumber})</p>
          </div>

          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Patient Details
            </p>
            <p className="font-bold text-sm text-slate-900 mt-0.5">
              {patient?.name} ({patient?.patientId})
            </p>
            <p className="text-slate-600">
              {patient?.gender}, {patient?.age} Years • Blood Group: <span className="font-bold text-rose-600">{patient?.bloodGroup}</span>
            </p>
            <p className="text-slate-500">Phone: {patient?.phone}</p>
          </div>
        </div>

        {/* Diagnosis & Rx Symbol */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 p-3.5">
            <p className="text-xs font-bold text-slate-500">Clinical Diagnosis:</p>
            <p className="text-sm font-extrabold text-brand-900 mt-0.5">
              {prescription.diagnosis}
            </p>
          </div>

          {/* Rx Symbol */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-3xl font-serif font-black italic text-brand-700">℞</span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Medication & Administration Plan
            </span>
          </div>

          {/* Medicines Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100/80 text-[11px] font-bold text-slate-600">
                  <th className="p-3">#</th>
                  <th className="p-3">Medicine & Strength</th>
                  <th className="p-3">Dosage</th>
                  <th className="p-3">Frequency</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Instructions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {prescription.medicines?.map((med: any, idx: number) => (
                  <tr key={idx}>
                    <td className="p-3 font-semibold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-slate-900">{med.medicineName || med.name || med.medicine}</td>
                    <td className="p-3">{med.dosage}</td>
                    <td className="p-3 font-bold text-brand-700">{med.frequency}</td>
                    <td className="p-3">{med.duration}</td>
                    <td className="p-3 text-slate-600">{med.instructions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clinical Advice */}
          {prescription.clinicalNotes && (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs">
              <p className="font-bold text-slate-700">General Clinical Advice & Dietary Instructions:</p>
              <p className="mt-1 text-slate-600 italic leading-relaxed">
                {prescription.clinicalNotes}
              </p>
            </div>
          )}

          {prescription.followUpDate && (
            <div className="text-xs font-semibold text-brand-700">
              🗓️ Next Follow-up Consultation Date: {formatDate(prescription.followUpDate)}
            </div>
          )}
        </div>

        {/* Footer Signature */}
        <div className="mt-16 flex items-end justify-between border-t border-slate-200 pt-6">
          <div className="text-[10px] text-slate-400">
            <p>Generated electronically by MediPulse Health Suite.</p>
            <p>Keep this prescription for medical records and pharmacy dispensing.</p>
          </div>
          <div className="text-center">
            <div className="h-10 w-32 border-b border-slate-400 border-dashed mb-1" />
            <p className="text-xs font-bold text-slate-800">{doctor?.name}</p>
            <p className="text-[10px] text-slate-400">Authorized Medical Practitioner</p>
          </div>
        </div>
      </div>
    </div>
  );
}
