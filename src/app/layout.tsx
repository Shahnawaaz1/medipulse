import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "MediPulse Hospital Care | Smart Hospital Management System",
  description:
    "Enterprise-grade Hospital Management Software covering Patient Registration, Appointments, OPD, IPD, Bed Occupancy, Pharmacy, Diagnostics, and Invoicing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-['Plus_Jakarta_Sans',sans-serif]">
        <AuthProvider>
          <AppLayout>{children}</AppLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
