"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  HeartPulse,
  PhoneCall,
  Calendar,
  User,
  Clock,
  Sparkles,
  QrCode,
  Video,
  ShieldCheck,
  Stethoscope,
  Building2,
  CheckCircle2,
  ArrowRight,
  Star,
  Activity,
  Ambulance,
  ChevronRight,
  Lock,
  Layers,
  Award,
  Users,
  MapPin,
  Mail,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

export default function PublicLandingPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Appointment Form State
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [appointmentDate, setAppointmentDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [timeSlot, setTimeSlot] = useState("10:00 AM - 10:15 AM");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookedSuccessModal, setBookedSuccessModal] = useState<any>(null);

  // Quick Public ABHA Modal / Widget State
  const [abhaAadhaar, setAbhaAadhaar] = useState("");
  const [abhaName, setAbhaName] = useState("");
  const [abhaMobile, setAbhaMobile] = useState("");
  const [abhaOtpSent, setAbhaOtpSent] = useState(false);
  const [abhaOtp, setAbhaOtp] = useState("");
  const [generatedAbha, setGeneratedAbha] = useState<any>(null);
  const [abhaLoading, setAbhaLoading] = useState(false);

  // Public AI Symptom Checker Widget State
  const [aiSymptomInput, setAiSymptomInput] = useState("");
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    async function loadPublicData() {
      try {
        setLoading(true);
        const [deptRes, docRes, pkgRes] = await Promise.all([
          fetch("/api/departments"),
          fetch("/api/doctors"),
          fetch("/api/packages"),
        ]);

        let initialDept = "";
        let docList: any[] = [];

        if (deptRes.ok) {
          const d = await deptRes.json();
          const deptList = d.departments || d.data || [];
          setDepartments(deptList);
          if (deptList.length > 0) {
            initialDept = deptList[0].name;
            setSelectedDept(initialDept);
          }
        }
        if (docRes.ok) {
          const doc = await docRes.json();
          docList = doc.doctors || doc.data || [];
          setDoctors(docList);
          const firstMatching = docList.find((item: any) => item.department === initialDept) || docList[0];
          if (firstMatching) {
            setSelectedDoctor(firstMatching._id);
          }
        }
        if (pkgRes.ok) {
          const p = await pkgRes.json();
          setPackages(p.packages || p.data || []);
        }
      } catch (e) {
        console.error("Failed to load public portal data", e);
      } finally {
        setLoading(false);
      }
    }
    loadPublicData();
  }, []);

  // Filter doctors by selected department in booking widget
  const filteredDoctors = doctors.filter((doc) => {
    if (!selectedDept) return true;
    const docDept = (doc.department || "").toLowerCase().trim();
    const curDept = selectedDept.toLowerCase().trim();
    return (
      docDept === curDept ||
      docDept.includes(curDept) ||
      curDept.includes(docDept) ||
      curDept.split(" ")[0] === docDept.split(" ")[0]
    );
  });

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientPhone) {
      toast.error("Please enter patient name and contact phone number");
      return;
    }

    try {
      setBookingLoading(true);

      // Register or find patient first
      const patRes = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: patientName,
          phone: patientPhone,
          gender: "Male",
          dob: "1992-01-01",
          age: 34,
          bloodGroup: "O+",
          address: "New Delhi",
          city: "Delhi NCR",
          emergencyContact: {
            name: patientName,
            relationship: "Self",
            phone: patientPhone,
          },
        }),
      });

      const patData = await patRes.json();
      const patientId = patData.patient?._id || patData.data?._id || patData._id;

      const aptRes = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: patientId,
          patientName,
          patientPhone,
          doctor: selectedDoctor || doctors[0]?._id,
          department: selectedDept || doctors[0]?.department || "General Medicine",
          appointmentDate,
          timeSlot,
          type: "General",
          reason: "Online Patient Portal Booking",
        }),
      });

      const aptData = await aptRes.json();
      if (aptData.success) {
        setBookedSuccessModal(aptData.data);
        toast.success("Appointment Token Booked Successfully!");
        setPatientName("");
        setPatientPhone("");
      } else {
        toast.error(aptData.error || "Could not book appointment");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to submit booking");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleSendAbhaOtp = async () => {
    if (!abhaAadhaar || abhaAadhaar.length < 12) {
      toast.error("Please enter valid 12-digit Aadhaar Number");
      return;
    }
    setAbhaLoading(true);
    try {
      const res = await fetch("/api/abha/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifierValue: abhaAadhaar }),
      });
      const data = await res.json();
      if (data.success) {
        setAbhaOtpSent(true);
        setAbhaOtp(data.demoOtp || "789123");
        toast.success(`OTP Sent to Aadhaar-linked mobile! Demo OTP: ${data.demoOtp}`);
      }
    } catch (e) {
      toast.error("Failed to connect to ABDM Gateway");
    } finally {
      setAbhaLoading(false);
    }
  };

  const handleVerifyAbha = async () => {
    if (!abhaOtp) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setAbhaLoading(true);
    try {
      const res = await fetch("/api/abha/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: abhaOtp,
          fullName: abhaName || "Citizen Patient",
          mobile: abhaMobile || "9876543210",
          aadhaar: abhaAadhaar,
          gender: "Male",
          dob: "1994-06-15",
          preferredAbhaAddress: abhaName
            ? abhaName.toLowerCase().replace(/\s+/g, ".")
            : "citizen.health",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedAbha(data.data);
        toast.success("Official ABHA Card Generated & Verified!");
      } else {
        toast.error(data.error || "Verification failed");
      }
    } catch (e) {
      toast.error("ABDM Verification failed");
    } finally {
      setAbhaLoading(false);
    }
  };

  const handleAiAnalyze = async () => {
    if (!aiSymptomInput.trim()) {
      toast.error("Please enter symptoms or medical complaints");
      return;
    }
    setAiAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: aiSymptomInput,
          patientName: "Online Visitor",
          age: 35,
          gender: "Unspecified",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiResult(data.data);
        toast.success("AI Clinical Triage Generated");
      }
    } catch (e) {
      toast.error("AI service error");
    } finally {
      setAiAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-brand-500 selection:text-white dark:bg-slate-950 dark:text-slate-50 font-sans">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-brand-900 via-brand-800 to-slate-900 text-white text-xs py-2 px-4 border-b border-brand-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
              <Sparkles className="h-3 w-3" /> ABDM & AI Enabled
            </span>
            <span className="text-slate-300">
              Ayushman Bharat Digital Health Mission (ABDM M3) & NABH Accredited Multi-Speciality Hospital
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-semibold">
            <a
              href="tel:18009110000"
              className="flex items-center gap-1.5 text-rose-300 hover:text-rose-200 transition-colors"
            >
              <Ambulance className="h-3.5 w-3.5 animate-bounce text-rose-400" />
              <span>24x7 Trauma & Ambulance: 1800-911-0000</span>
            </a>
            <span className="text-slate-600">|</span>
            <Link
              href="/dashboard"
              className="text-teal-300 hover:text-teal-200 underline underline-offset-2 flex items-center gap-1 font-bold"
            >
              <span>Hospital ERP Operations</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation Bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm dark:bg-slate-900/95 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-brand-600 via-teal-500 to-sky-400 text-white shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
              <HeartPulse className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Medi<span className="text-brand-600 dark:text-brand-400">Pulse</span>
                </span>
                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-extrabold text-brand-700 border border-brand-200/50 dark:bg-brand-950 dark:text-brand-300">
                  CARE
                </span>
              </div>
              <span className="block text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                Hospital & Medical Institute
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a href="#departments" className="hover:text-brand-600 transition-colors">
              Specialities
            </a>
            <a href="#doctors" className="hover:text-brand-600 transition-colors">
              Find Doctors
            </a>
            <a href="#abha" className="hover:text-brand-600 transition-colors flex items-center gap-1">
              <span>ABHA Card</span>
              <span className="rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.2">
                Govt
              </span>
            </a>
            <a href="#ai-assistant" className="hover:text-brand-600 transition-colors flex items-center gap-1">
              <span>AI Health Check</span>
              <Sparkles className="h-3 w-3 text-purple-500" />
            </a>
            <a href="#packages" className="hover:text-brand-600 transition-colors">
              Health Packages
            </a>
            <a href="#teleconsult" className="hover:text-brand-600 transition-colors">
              Telemedicine
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50/80 px-3.5 py-2 text-xs font-bold text-teal-800 hover:bg-teal-100 transition-all dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300"
            >
              <User className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
              <span>Patient Portal</span>
            </Link>

            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all dark:border-slate-800 dark:bg-slate-800 dark:text-slate-200"
            >
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              <span>Staff Login</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-teal-500 px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-brand-500/20 hover:brightness-110 transition-all"
            >
              <Layers className="h-4 w-4" />
              <span>Hospital ERP</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section with Quick Booking Widget */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-brand-50/20 to-white pt-12 pb-20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
        {/* Ambient background spheres */}
        <div className="absolute top-0 right-1/4 -mt-12 h-96 w-96 rounded-full bg-brand-400/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-12 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-xs font-bold text-brand-700 border border-brand-200/60 shadow-sm dark:bg-brand-950/60 dark:text-brand-300 dark:border-brand-800">
                <ShieldCheck className="h-4 w-4 text-brand-600" />
                <span>Next-Gen Smart Hospital & ABDM Certified</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                World-Class Healthcare,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-teal-500 to-sky-500">
                  Powered by Clinical AI
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Connect with 120+ top medical specialists across 16+ clinical departments. Instant OPD token booking, 24x7 Emergency trauma care, digital ABHA health cards, and AI-assisted diagnostics.
              </p>

              {/* Key Highlights Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600 font-bold dark:bg-brand-950">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">16+ Departments</p>
                    <p className="text-[10px] text-slate-400">Super Specialities</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold dark:bg-emerald-950">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">ABDM M3 Ready</p>
                    <p className="text-[10px] text-slate-400">14-Digit ABHA Cards</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-2xl bg-white p-3 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600 font-bold dark:bg-purple-950">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Clinical AI 2.0</p>
                    <p className="text-[10px] text-slate-400">Smart Symptom Triage</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <a
                  href="#book-appointment"
                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 to-teal-600 px-6 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-500/25 hover:brightness-110 transition-all"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Book Doctor Appointment</span>
                </a>
                <a
                  href="#abha"
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-800 shadow-sm hover:border-brand-500 hover:text-brand-600 transition-all dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <QrCode className="h-4 w-4 text-emerald-600" />
                  <span>Create Free ABHA Card</span>
                </a>
              </div>
            </div>

            {/* Right Quick Appointment Widget */}
            <div id="book-appointment" className="lg:col-span-5">
              <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 relative">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-extrabold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                      LIVE OPD QUEUE
                    </span>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                      Instant Doctor Appointment
                    </h3>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950">
                    <Calendar className="h-5 w-5" />
                  </div>
                </div>

                <form onSubmit={handleBookAppointment} className="space-y-3.5">
                  {/* Department Select */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Clinical Speciality / Department
                    </label>
                    <select
                      value={selectedDept}
                      onChange={(e) => {
                        const newDept = e.target.value;
                        setSelectedDept(newDept);
                        const match = doctors.find((d) => d.department === newDept);
                        setSelectedDoctor(match ? match._id : "");
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    >
                      {departments.map((dept) => (
                        <option key={dept._id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Doctor Select */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Consulting Specialist Doctor
                    </label>
                    <select
                      value={selectedDoctor}
                      onChange={(e) => setSelectedDoctor(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                    >
                      {doctors.length === 0 ? (
                        <option value="">Loading doctors...</option>
                      ) : filteredDoctors.length > 0 ? (
                        filteredDoctors.map((doc) => (
                          <option key={doc._id} value={doc._id}>
                            {doc.name} — {doc.specialization} (Fee: ₹{doc.consultationFee})
                          </option>
                        ))
                      ) : (
                        doctors.map((doc) => (
                          <option key={doc._id} value={doc._id}>
                            {doc.name} ({doc.department}) — Fee: ₹{doc.consultationFee}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Date & Time Slot Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-800 focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Time Slot
                      </label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-800 focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="09:30 AM - 09:45 AM">09:30 AM - 09:45 AM</option>
                        <option value="10:00 AM - 10:15 AM">10:00 AM - 10:15 AM</option>
                        <option value="11:00 AM - 11:15 AM">11:00 AM - 11:15 AM</option>
                        <option value="02:00 PM - 02:15 PM">02:00 PM - 02:15 PM</option>
                        <option value="04:30 PM - 04:45 PM">04:30 PM - 04:45 PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Patient Details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Patient Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Ramesh Gupta"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-800 focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Mobile Number
                      </label>
                      <input
                        type="tel"
                        placeholder="+91 98765-43210"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs font-semibold text-slate-800 focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={bookingLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-600 via-teal-600 to-emerald-600 p-3.5 text-xs font-extrabold text-white shadow-lg shadow-brand-500/25 hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {bookingLoading ? (
                      <span>Generating Live OPD Token...</span>
                    ) : (
                      <>
                        <span>Confirm OPD Appointment</span>
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Appointment Success Confirmation Modal */}
      {bookedSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 text-center dark:bg-slate-900 dark:border-slate-800">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 mb-4 dark:bg-emerald-950">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Appointment Token Confirmed!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your appointment has been added to our live hospital OPD queue.
            </p>

            <div className="my-5 rounded-2xl bg-slate-50 p-4 border border-slate-100 text-left space-y-2 text-xs dark:bg-slate-800/60 dark:border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-400">Appointment ID:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {bookedSuccessModal.appointmentId}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Speciality:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {bookedSuccessModal.department}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date & Slot:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {bookedSuccessModal.appointmentDate} ({bookedSuccessModal.timeSlot})
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setBookedSuccessModal(null)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
              >
                Close
              </button>
              <Link
                href="/dashboard"
                className="flex-1 rounded-xl bg-brand-600 py-2.5 text-xs font-bold text-white hover:bg-brand-700"
              >
                View in ERP
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ABHA / ABDM National Health ID Hero Section */}
      <section id="abha" className="py-20 bg-gradient-to-b from-white to-slate-50 border-y border-slate-100 dark:from-slate-950 dark:to-slate-900 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-950 p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute right-0 top-0 -mt-10 -mr-10 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-bold text-emerald-300 backdrop-blur-md border border-white/10">
                  <QrCode className="h-3.5 w-3.5" />
                  <span>Ayushman Bharat Digital Mission (ABDM)</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  Create Your Official 14-Digit ABHA Digital Health Card
                </h2>
                <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
                  Link your prescriptions, diagnostic lab reports, and doctor visits into one secure national health account. Zero paperwork, 100% digital and paperless hospital visits across India.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Instant Aadhaar OTP</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Digital QR Code</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-200">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Cashless Insurance</span>
                  </div>
                </div>
              </div>

              {/* Interactive ABHA Card Generator / Preview */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-6 text-white space-y-4">
                  {!generatedAbha ? (
                    <>
                      <h4 className="text-sm font-bold flex items-center gap-2">
                        <QrCode className="h-4 w-4 text-emerald-400" />
                        <span>Quick ABHA Generation Portal</span>
                      </h4>

                      {!abhaOtpSent ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              12-Digit Aadhaar Number / Virtual ID
                            </label>
                            <input
                              type="text"
                              placeholder="XXXX-XXXX-XXXX"
                              value={abhaAadhaar}
                              onChange={(e) => setAbhaAadhaar(e.target.value)}
                              className="w-full rounded-xl border border-white/20 bg-white/10 p-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                placeholder="As per Aadhaar"
                                value={abhaName}
                                onChange={(e) => setAbhaName(e.target.value)}
                                className="w-full rounded-xl border border-white/20 bg-white/10 p-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                Mobile No
                              </label>
                              <input
                                type="tel"
                                placeholder="9876543210"
                                value={abhaMobile}
                                onChange={(e) => setAbhaMobile(e.target.value)}
                                className="w-full rounded-xl border border-white/20 bg-white/10 p-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none"
                              />
                            </div>
                          </div>
                          <button
                            onClick={handleSendAbhaOtp}
                            disabled={abhaLoading}
                            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-bold text-white shadow-lg hover:brightness-110 transition-all"
                          >
                            {abhaLoading ? "Connecting ABDM..." : "Generate OTP (Aadhaar Verified)"}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                              Enter 6-Digit Aadhaar OTP
                            </label>
                            <input
                              type="text"
                              value={abhaOtp}
                              onChange={(e) => setAbhaOtp(e.target.value)}
                              className="w-full rounded-xl border border-white/20 bg-white/10 p-2.5 text-xs text-white tracking-widest text-center font-bold focus:outline-none"
                            />
                            <p className="text-[10px] text-emerald-300 mt-1">
                              Demo OTP pre-filled: 789123
                            </p>
                          </div>
                          <button
                            onClick={handleVerifyAbha}
                            disabled={abhaLoading}
                            className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-bold text-white shadow-lg hover:brightness-110 transition-all"
                          >
                            {abhaLoading ? "Verifying..." : "Verify & Issue ABHA Card"}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    /* Display Generated ABHA Card Preview */
                    <div className="rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 p-4 border border-emerald-500/40 text-left space-y-3">
                      <div className="flex items-center justify-between border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-5 w-5 text-emerald-400" />
                          <span className="font-extrabold text-xs tracking-wider">
                            NATIONAL HEALTH AUTHORITY (ABHA)
                          </span>
                        </div>
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                          VERIFIED
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 border border-white/20 text-emerald-300">
                          <User className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="font-extrabold text-sm text-white">
                            {generatedAbha.fullName}
                          </p>
                          <p className="text-xs font-bold text-emerald-300 tracking-wider">
                            ABHA: {generatedAbha.abhaNumber}
                          </p>
                          <p className="text-[10px] text-slate-300">
                            PHR: {generatedAbha.abhaAddress}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[10px]">
                        <span>DOB: {generatedAbha.dob}</span>
                        <span>Gender: {generatedAbha.gender}</span>
                        <span>State: {generatedAbha.state}</span>
                      </div>

                      <Link
                        href="/abha"
                        className="block text-center rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        Open in Full ABHA Suite
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Health Assistant Widget */}
      <section id="ai-assistant" className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-50 px-3.5 py-1 text-xs font-extrabold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
              <Sparkles className="h-4 w-4" />
              <span>CLINICAL AI HEALTH CO-PILOT</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Instant AI Symptom Analyzer & Triage
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Describe your symptoms in plain language to get an intelligent preliminary clinical risk evaluation, suggested diagnostic tests, and doctor recommendations.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-3xl bg-slate-50 p-6 sm:p-8 border border-slate-200/80 shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="e.g. High fever for 2 days with dry cough, throat irritation and mild body aches..."
                value={aiSymptomInput}
                onChange={(e) => setAiSymptomInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiAnalyze()}
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-xs sm:text-sm text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                onClick={handleAiAnalyze}
                disabled={aiAnalyzing}
                className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-brand-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-purple-500/25 hover:brightness-110 transition-all disabled:opacity-50"
              >
                {aiAnalyzing ? (
                  <span>Analyzing...</span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Run AI Triage</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick symptom pills */}
            <div className="flex flex-wrap items-center gap-2 mt-4 text-xs">
              <span className="text-slate-400 font-medium">Try clicking:</span>
              {[
                "Chest tightness & shortness of breath",
                "High fever & sore throat",
                "Abdominal pain with vomiting",
                "Severe migraine headache & blurry vision",
              ].map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setAiSymptomInput(pill);
                  }}
                  className="rounded-xl bg-white px-3 py-1 text-slate-600 border border-slate-200 hover:border-purple-400 hover:text-purple-600 transition-all dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* AI Result Cards */}
            {aiResult && (
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Differential Diagnosis */}
                  <div className="rounded-2xl bg-white p-5 border border-purple-100 shadow-sm dark:bg-slate-800/80 dark:border-slate-700">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 mb-3 flex items-center gap-1.5">
                      <Activity className="h-4 w-4" /> Primary Clinical Findings
                    </h4>
                    <div className="space-y-3">
                      {aiResult.differentialDiagnosis?.map((item: any, i: number) => (
                        <div key={i} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900/60">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {item.condition}
                            </span>
                            <span className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-extrabold text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                              {item.probability}% Match
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{item.explanation}</p>
                          <p className="text-[10px] font-semibold text-slate-400 mt-1">
                            ICD-10: {item.icd10Code}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Lab Tests & Red Flags */}
                  <div className="rounded-2xl bg-white p-5 border border-slate-100 shadow-sm dark:bg-slate-800/80 dark:border-slate-700 space-y-4">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-700 dark:text-brand-300 mb-2 flex items-center gap-1.5">
                        <Stethoscope className="h-4 w-4" /> Recommended Diagnostics
                      </h4>
                      <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                        {aiResult.recommendedTests?.map((t: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
                            <span>{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 mb-2 flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4" /> Red Flag Warning Signs
                      </h4>
                      <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                        {aiResult.redFlagWarnings?.map((rf: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-medium">
                            <span>•</span>
                            <span>{rf}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-purple-500/10 to-brand-500/10 p-4 border border-purple-500/20">
                  <div className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white">Note:</span> AI triage is for informational decision support. Consult a specialist for formal clinical evaluation.
                  </div>
                  <Link
                    href="/ai-assistant"
                    className="flex items-center gap-1 text-xs font-bold text-purple-700 hover:text-purple-800 dark:text-purple-300"
                  >
                    <span>Full AI Clinical Suite</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 16+ Speciality Departments Section */}
      <section id="departments" className="py-20 bg-slate-50/80 border-t border-slate-100 dark:bg-slate-900/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-extrabold text-brand-700 dark:bg-brand-950 dark:text-brand-300 mb-2">
                <Building2 className="h-3.5 w-3.5" />
                <span>CLINICAL EXCELLENCE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
                16+ Specialized Medical Wings
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Advanced operation theaters, dedicated ICUs, and board-certified specialists.
              </p>
            </div>
            <Link
              href="/departments"
              className="flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400"
            >
              <span>View All 16 Wings & Rosters</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {departments.slice(0, 8).map((dept) => (
              <div
                key={dept._id}
                className="group rounded-3xl bg-white p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:border-brand-300 transition-all duration-300 flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors dark:bg-brand-950 dark:text-brand-400">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {dept.floor}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                    {dept.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                    {dept.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>{dept.totalDoctors || 4} Specialists</span>
                    <span>{dept.totalBeds || 20} Beds</span>
                  </div>
                </div>

                <a
                  href="#book-appointment"
                  onClick={() => setSelectedDept(dept.name)}
                  className="mt-5 flex items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-brand-50 hover:text-brand-700 transition-all dark:bg-slate-800 dark:text-slate-200"
                >
                  <span>Book Consultation</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Top Specialist Doctors Directory */}
      <section id="doctors" className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-extrabold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
              <Users className="h-3.5 w-3.5" />
              <span>DISTINGUISHED FACULTY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Meet Our Senior Specialists
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Experienced clinicians with international fellowships and decades of patient care expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {doctors.map((doc) => (
              <div
                key={doc._id}
                className="group rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-teal-300 transition-all dark:bg-slate-900 dark:border-slate-800"
              >
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden dark:bg-slate-800">
                  <img
                    src={doc.photo || "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=80"}
                    alt={doc.name}
                    onError={(e: any) => {
                      e.currentTarget.src = "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=500&auto=format&fit=crop&q=80";
                    }}
                    className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-md px-2.5 py-1 text-xs font-extrabold text-slate-900 shadow flex items-center gap-1 dark:bg-slate-900/90 dark:text-white">
                    <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                    <span>{doc.rating || 4.9}</span>
                  </div>
                  <div className="absolute bottom-3 left-3 rounded-xl bg-brand-900/80 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white">
                    {doc.department}
                  </div>
                </div>

                <div className="p-6 space-y-3">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {doc.name}
                    </h3>
                    <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                      {doc.specialization}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{doc.qualification}</p>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {doc.bio || "Dedicated healthcare specialist delivering compassionate diagnostic and therapeutic care."}
                  </p>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">OPD Fee:</span>
                      <span className="font-extrabold text-slate-900 dark:text-white ml-1">
                        ₹{doc.consultationFee}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Exp:</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300 ml-1">
                        {doc.experienceYears}+ Yrs
                      </span>
                    </div>
                  </div>

                  <a
                    href="#book-appointment"
                    onClick={() => {
                      setSelectedDept(doc.department);
                      setSelectedDoctor(doc._id);
                    }}
                    className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-brand-600 transition-colors dark:bg-slate-800 dark:hover:bg-brand-600"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Book Appointment</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comprehensive Health Checkup Packages */}
      <section id="packages" className="py-20 bg-slate-50 border-t border-slate-100 dark:bg-slate-900/60 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Award className="h-3.5 w-3.5" />
              <span>PREVENTIVE HEALTH PACKAGES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
              Transparent Health & Wellness Packages
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Early detection saves lives. Comprehensive diagnostic checkups with zero hidden costs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div
                key={pkg._id}
                className="relative rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800"
              >
                {pkg.popular && (
                  <span className="absolute -top-3 right-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1 text-[10px] font-extrabold text-white shadow">
                    MOST POPULAR
                  </span>
                )}

                <div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {pkg.category} Package
                  </span>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-2">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2">{pkg.description}</p>

                  <div className="my-6 flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                      ₹{pkg.price}
                    </span>
                    <span className="text-xs text-slate-400 line-through">
                      ₹{pkg.originalPrice}
                    </span>
                    <span className="text-xs font-extrabold text-emerald-600 ml-auto">
                      {Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}% OFF
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Package Inclusions:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                      {pkg.features?.map((feat: string, idx: number) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <a
                  href="#book-appointment"
                  className="mt-8 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 text-xs font-extrabold text-white shadow-md hover:brightness-110 transition-all"
                >
                  <span>Book Package Now</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teleconsultation Online Clinic Section */}
      <section id="teleconsult" className="py-20 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-sky-900 via-brand-900 to-slate-950 p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-sky-300 backdrop-blur-md">
                  <Video className="h-3.5 w-3.5" />
                  <span>HD VIDEO TELECONSULTATION CLINIC</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                  Consult Top Doctors from the Comfort of Your Home
                </h2>
                <p className="text-sm text-slate-200 leading-relaxed max-w-xl">
                  Encrypted WebRTC video calls, live digital symptom evaluation, instant electronic prescriptions (e-Rx) with digitally signed doctor signatures, and home medicine delivery.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    href="/teleconsultation"
                    className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-400 to-brand-500 px-6 py-3.5 text-xs font-extrabold text-white shadow-lg hover:brightness-110 transition-all"
                  >
                    <Video className="h-4 w-4" />
                    <span>Join Virtual Waiting Room</span>
                  </Link>
                  <a
                    href="#book-appointment"
                    className="flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3.5 text-xs font-bold text-white hover:bg-white/20 transition-all"
                  >
                    <span>Schedule Video Slot</span>
                  </a>
                </div>
              </div>

              <div className="lg:col-span-4 text-center lg:text-right">
                <div className="inline-block rounded-3xl bg-white/10 p-6 backdrop-blur-xl border border-white/20 text-left space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-500 text-white shadow">
                      <PhoneCall className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-sky-300">Immediate Video OPD</p>
                      <p className="text-sm font-extrabold text-white">Wait Time: &lt; 5 Mins</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-300">
                    Available across Cardiology, Pediatrics, General Medicine & Dermatology.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Hotline & Ambulance Banner */}
      <section className="bg-rose-600 text-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
              <Ambulance className="h-7 w-7 animate-pulse text-white" />
            </div>
            <div>
              <h3 className="text-base font-black">24x7 Emergency, Trauma & Cardiac Hotline</h3>
              <p className="text-xs text-rose-100">Zero-delay admission with mobile ICU ambulances on standby</p>
            </div>
          </div>
          <a
            href="tel:18009110000"
            className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-black text-rose-600 shadow-lg hover:bg-rose-50 transition-all"
          >
            <PhoneCall className="h-4 w-4" />
            <span>Call 1800-911-0000 (Toll Free)</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Column 1: Hospital Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-white font-extrabold text-base">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <HeartPulse className="h-4 w-4" />
                </div>
                <span>MediPulse Hospital</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                NABH & NABL accredited tertiary care medical institute committed to clinical precision, AI innovation, and compassionate patient care.
              </p>
              <div className="flex items-center gap-2 text-[11px] text-slate-300">
                <MapPin className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                <span>Plot 42, Health City, Sector 62, New Delhi 110001</span>
              </div>
            </div>

            {/* Column 2: Clinical Departments */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Key Specialities</h4>
              <ul className="space-y-2">
                <li><a href="#departments" className="hover:text-white transition-colors">Interventional Cardiology</a></li>
                <li><a href="#departments" className="hover:text-white transition-colors">Neurology & Neurosurgery</a></li>
                <li><a href="#departments" className="hover:text-white transition-colors">Robotic Orthopedics</a></li>
                <li><a href="#departments" className="hover:text-white transition-colors">Pediatrics & Neonatology</a></li>
                <li><a href="#departments" className="hover:text-white transition-colors">Obstetrics & Gynaecology</a></li>
              </ul>
            </div>

            {/* Column 3: Patient Services */}
            <div>
              <h4 className="text-sm font-bold text-white mb-4">Patient Portals</h4>
              <ul className="space-y-2">
                <li><a href="#abha" className="hover:text-white transition-colors">Create 14-Digit ABHA Card</a></li>
                <li><a href="#ai-assistant" className="hover:text-white transition-colors">AI Clinical Symptom Checker</a></li>
                <li><a href="#packages" className="hover:text-white transition-colors">Master Health Packages</a></li>
                <li><a href="#teleconsult" className="hover:text-white transition-colors">Video Teleconsultation</a></li>
                <li><Link href="/dashboard" className="text-teal-400 font-bold hover:underline">Hospital ERP Login</Link></li>
              </ul>
            </div>

            {/* Column 4: Compliance & Badges */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-white">Accreditations</h4>
              <div className="flex flex-wrap gap-2 text-[10px]">
                <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-slate-300 font-bold">
                  NABH Accredited
                </span>
                <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-slate-300 font-bold">
                  NABL Pathology
                </span>
                <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-emerald-400 font-bold">
                  ABDM M1, M2, M3
                </span>
                <span className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-slate-300 font-bold">
                  ISO 9001:2026
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Email: care@medipulsehospital.com<br />
                Emergency Phone: +91 1800-911-0000
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
            <p>© 2026 MediPulse Hospital & Medical Institute. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/dashboard" className="text-slate-400 hover:text-white">Hospital ERP Suite</Link>
              <Link href="/login" className="text-slate-400 hover:text-white">Staff Login</Link>
              <a href="#" className="text-slate-400 hover:text-white">Privacy Policy</a>
              <a href="#" className="text-slate-400 hover:text-white">Terms of Care</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
