"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Toaster } from "sonner";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

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
