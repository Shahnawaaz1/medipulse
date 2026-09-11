"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowLeft, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function NewPatientPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    gender: "Male",
    dob: "1990-01-01",
    age: 36,
    phone: "",
    email: "",
    bloodGroup: "O+",
    address: "",
    city: "Metropolis",
    emergencyName: "",
    emergencyRelationship: "Spouse",
    emergencyPhone: "",
    allergies: "",
    medicalHistory: "",
    status: "Active",
  });

  const handleDobChange = (dob: string) => {
    try {
      const birth = new Date(dob);
      const now = new Date();
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
        age--;
      }
      setFormData((prev) => ({ ...prev, dob, age: isNaN(age) ? prev.age : age }));
    } catch {
      setFormData((prev) => ({ ...prev, dob }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        gender: formData.gender,
        dob: formData.dob,
        age: Number(formData.age),
        phone: formData.phone,
        email: formData.email,
        bloodGroup: formData.bloodGroup,
        address: formData.address,
        city: formData.city,
        emergencyContact: {
          name: formData.emergencyName,
          relationship: formData.emergencyRelationship,
          phone: formData.emergencyPhone,
        },
        allergies: formData.allergies
          ? formData.allergies.split(",").map((a) => a.trim()).filter(Boolean)
          : [],
        medicalHistory: formData.medicalHistory
          ? formData.medicalHistory.split(",").map((m) => m.trim()).filter(Boolean)
          : [],
        status: formData.status,
      };

      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`Patient ${formData.name} registered successfully!`);
        router.push(`/patients/${data.patient._id}`);
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to register patient");
      }
    } catch {
      toast.error("An error occurred while saving patient.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/patients"
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Patient Registration Wizard
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create an official electronic medical record for a new patient
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Demographics */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 border-b border-slate-100 pb-2 dark:border-slate-800">
            1. Personal Demographics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Johnathan Henry Miller"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Blood Group *
              </label>
              <select
                value={formData.bloodGroup}
                onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value as any })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white font-bold"
              >
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                  <option key={bg} value={bg}>
                    {bg}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => handleDobChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Age (Years) *
              </label>
              <input
                type="number"
                required
                min="0"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Address */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 border-b border-slate-100 pb-2 dark:border-slate-800">
            2. Contact & Address Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                required
                placeholder="+1 555-0199"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                placeholder="patient@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Street Address *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 104 Willow Ridge Blvd, Apt 4C"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                City *
              </label>
              <input
                type="text"
                required
                placeholder="Metropolis"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Initial Patient Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              >
                <option value="Active">Active (Outpatient)</option>
                <option value="Inpatient">Inpatient (For Admission)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Emergency Contact */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 border-b border-slate-100 pb-2 dark:border-slate-800">
            3. Emergency Contact (Next of Kin)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Contact Person Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sarah Miller"
                value={formData.emergencyName}
                onChange={(e) => setFormData({ ...formData, emergencyName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Relationship *
              </label>
              <input
                type="text"
                required
                placeholder="Spouse / Parent / Sibling"
                value={formData.emergencyRelationship}
                onChange={(e) =>
                  setFormData({ ...formData, emergencyRelationship: e.target.value })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Emergency Phone *
              </label>
              <input
                type="tel"
                required
                placeholder="+1 555-9988"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Allergies & Medical History */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 border-b border-slate-100 pb-2 dark:border-slate-800">
            4. Clinical History & Known Allergies
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Known Drug / Food Allergies (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Sulfa drugs, Peanuts"
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Past Medical History / Chronic Conditions (Comma separated)
              </label>
              <input
                type="text"
                placeholder="e.g. Type 2 Diabetes, Hypertension, Asthma"
                value={formData.medicalHistory}
                onChange={(e) => setFormData({ ...formData, medicalHistory: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/patients"
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-700 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{submitting ? "Registering Patient..." : "Complete Registration"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
