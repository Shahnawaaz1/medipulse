"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import { HeartPulse, Lock, Mail, ArrowRight, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const demoAccounts: { role: UserRole; name: string; email: string; color: string }[] = [
  { role: "super_admin", name: "Super Admin", email: "admin@hospital.com", color: "bg-blue-600" },
  { role: "doctor", name: "Dr. Sarah Jenkins", email: "doctor@hospital.com", color: "bg-teal-600" },
  { role: "receptionist", name: "Emma Davis", email: "receptionist@hospital.com", color: "bg-purple-600" },
  { role: "nurse", name: "Clara Oswald", email: "nurse@hospital.com", color: "bg-rose-600" },
  { role: "pharmacist", name: "Marcus Vance", email: "pharmacist@hospital.com", color: "bg-amber-600" },
  { role: "lab_technician", name: "David Chen", email: "lab@hospital.com", color: "bg-emerald-600" },
  { role: "accountant", name: "Rachel Green", email: "accountant@hospital.com", color: "bg-indigo-600" },
  { role: "patient", name: "Johnathan Doe", email: "patient@hospital.com", color: "bg-slate-700" },
];

export default function LoginPage() {
  const { login, switchRole } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@hospital.com");
  const [password, setPassword] = useState("password123");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const success = await login(email, password);
    setSubmitting(false);

    if (success) {
      toast.success("Welcome back to MediPulse HMS!");
      router.push("/");
    } else {
      toast.error("Invalid credentials. Please try again or use 1-click demo login below.");
    }
  };

  const handleDemoLogin = async (demoRole: UserRole) => {
    setSubmitting(true);
    await switchRole(demoRole);
    setSubmitting(false);
    toast.success(`Logged in as ${demoRole.replace("_", " ").toUpperCase()}`);
    router.push("/");
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-slate-900 relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-teal-500/20 blur-3xl pointer-events-none" />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl relative z-10">
        {/* Left Side branding */}
        <div className="lg:col-span-5 p-8 sm:p-10 bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-500 to-teal-400 text-white shadow-lg shadow-brand-500/30">
                <HeartPulse className="h-6 w-6 animate-pulse" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                Medi<span className="text-brand-400">Pulse</span> HMS
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-400 leading-relaxed">
              Enterprise Hospital Management System with end-to-end clinical workflows, electronic prescriptions, live bed occupancy, pharmacy point-of-sale, and billing.
            </p>
          </div>

          <div className="my-6 space-y-3">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
              <span>Role-Based Access Control (RBAC)</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
              <span>Full Clinical & Financial Integration</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-teal-400 shrink-0" />
              <span>Real-Time Bed Matrix & OPD Queue</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            © 2026 MediPulse Healthcare Systems. Production-Ready Edition.
          </div>
        </div>

        {/* Right Side Login & Quick Logins */}
        <div className="lg:col-span-7 p-8 sm:p-10 bg-slate-900 flex flex-col justify-center">
          <div>
            <h2 className="text-xl font-bold text-white">System Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter your staff credentials or select a test role below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Staff Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@hospital.com"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/60 pl-10 pr-4 py-2.5 text-xs text-white placeholder:text-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/30 hover:brightness-110 transition-all disabled:opacity-50"
            >
              <span>{submitting ? "Authenticating..." : "Sign In to Hospital Portal"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* 1-Click Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              ⚡ Instant 1-Click Role Testing (No typing needed)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoLogin(acc.role)}
                  className="flex flex-col items-center p-2.5 rounded-xl border border-slate-800 bg-slate-800/40 hover:border-brand-500/50 hover:bg-slate-800 transition-all text-center group"
                >
                  <span className={`h-2 w-2 rounded-full ${acc.color} mb-1.5`} />
                  <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white truncate w-full">
                    {acc.name}
                  </span>
                  <span className="text-[9px] text-slate-500 capitalize">
                    {acc.role.replace("_", " ")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
