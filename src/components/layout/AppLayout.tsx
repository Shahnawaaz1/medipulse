"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Toaster } from "sonner";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ShieldAlert, ArrowLeft, LayoutDashboard, Lock } from "lucide-react";
import { getDefaultDashboard, ROLE_LABELS } from "@/lib/permissions";
import Link from "next/link";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, canAccess, isPatient } = useAuth();

  // If on public landing page or login, render full-width layout without ERP sidebar
  const isPublicPage = pathname === "/" || pathname === "/login";

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-50">
        <Toaster position="top-right" richColors />
        {children}
      </div>
    );
  }

  // While auth state is initializing
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Loading MediPulse ERP...</p>
        </div>
      </div>
    );
  }

  // If not authenticated on a protected page
  if (!user && !isPublicPage) {
    if (typeof window !== "undefined") {
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p className="text-xs text-slate-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Check if current user has permission to access this route
  const isRouteAllowed = canAccess(pathname);

  // If not authorized to view this specific page
  if (!loading && user && !isRouteAllowed) {
    const dashboardHref = getDefaultDashboard(role);
    return (
      <div className="flex min-h-screen bg-slate-50/60 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-50">
        <Toaster position="top-right" richColors />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
          <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
          <main className="flex-1 flex items-center justify-center p-6 sm:p-12 max-w-4xl w-full mx-auto">
            <div className="w-full rounded-3xl border border-rose-200/80 bg-white p-8 sm:p-12 shadow-2xl text-center dark:border-rose-900/40 dark:bg-slate-900">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400">
                <ShieldAlert className="h-8 w-8" />
              </div>
              <h2 className="mt-6 text-2xl font-black text-slate-900 dark:text-white">
                403 — Access Restricted
              </h2>
              <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Your role (<span className="font-bold text-slate-900 dark:text-white">{ROLE_LABELS[role] || role}</span>) does not have authorization to view this hospital module.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={dashboardHref}
                  className="flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-700 transition-all"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Go to My Dashboard</span>
                </Link>
                <button
                  onClick={() => router.back()}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Go Back</span>
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/60 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-50">
      <Toaster position="top-right" richColors />

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-x-hidden min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
export default AppLayout;
