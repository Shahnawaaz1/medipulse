"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  User as UserIcon,
  Stethoscope,
  Clock,
  DollarSign,
  FileSignature,
  Lock,
  Save,
  CheckCircle2,
  Trash2,
  ShieldCheck,
  Award,
  Sparkles,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [department, setDepartment] = useState(user?.department || "General Medicine");
  const [specialization, setSpecialization] = useState("Consultant Specialist");
  const [qualification, setQualification] = useState("MBBS, MD");
  const [mciNumber, setMciNumber] = useState("");
  const [experienceYears, setExperienceYears] = useState(10);
  const [roomNumber, setRoomNumber] = useState("101");
  const [bio, setBio] = useState(
    "Hospital medical professional committed to excellence in patient diagnostics, healthcare informatics, and clinical governance."
  );

  // Practice Timings & Fees
  const [consultationFee, setConsultationFee] = useState(800);
  const [emergencyFee, setEmergencyFee] = useState(1500);
  const [teleconsultationFee, setTeleconsultationFee] = useState(600);
  const [slotDuration, setSlotDuration] = useState(15);
  const [availableDays, setAvailableDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]);
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("05:00 PM");

  // Signature Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userEmail = user?.email || "doctor@hospital.com";
      const res = await fetch(`/api/profile?email=${encodeURIComponent(userEmail)}`);
      if (res.ok) {
        const json = await res.json();
        const d = json.data?.doctor || {};
        const u = json.data?.user || {};

        if (u.name) setName(u.name);
        if (u.email) setEmail(u.email);
        if (u.phone) setPhone(u.phone);
        if (u.department) setDepartment(u.department);
        if (d.specialization) setSpecialization(d.specialization);
        if (d.qualification) setQualification(d.qualification);
        if (d.mciNumber) setMciNumber(d.mciNumber);
        if (d.consultationFee) setConsultationFee(d.consultationFee);
        if (d.emergencyFee) setEmergencyFee(d.emergencyFee);
        if (d.teleconsultationFee) setTeleconsultationFee(d.teleconsultationFee);
        if (d.slotDurationMinutes) setSlotDuration(d.slotDurationMinutes);
        if (d.availableDays) setAvailableDays(d.availableDays);
        if (d.bio) setBio(d.bio);
        if (d.digitalSignature || u.digitalSignature) {
          setSavedSignature(d.digitalSignature || u.digitalSignature);
        }
      }
    } catch (e) {
      console.error("Failed to load profile", e);
    } finally {
      setLoading(false);
    }
  };

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0284c7";
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      setSavedSignature(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSavedSignature(null);
  };

  const toggleDay = (day: string) => {
    if (availableDays.includes(day)) {
      setAvailableDays(availableDays.filter((d) => d !== day));
    } else {
      setAvailableDays([...availableDays, day]);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          phone,
          department,
          specialization,
          qualification,
          mciNumber,
          consultationFee: Number(consultationFee),
          emergencyFee: Number(emergencyFee),
          teleconsultationFee: Number(teleconsultationFee),
          slotDurationMinutes: Number(slotDuration),
          availableDays,
          workingHours: { start: startTime, end: endTime },
          digitalSignature: savedSignature,
          bio,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Profile, digital signature, and practice timings updated!");
      } else {
        toast.error(data.error || "Failed to update profile");
      }
    } catch (e) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner label="Loading doctor practice profile..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center text-white overflow-hidden shadow-lg">
                <UserIcon className="h-10 w-10 text-slate-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black">{name}</h1>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300 border border-emerald-500/30">
                  ACTIVE CLINICIAN
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {specialization} • {department}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                MCI/NMC Reg: {mciNumber}
              </p>
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-teal-500 px-6 py-3 text-xs font-extrabold text-white shadow-lg shadow-brand-500/25 hover:brightness-110 transition-all disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? "Saving Changes..." : "Save Profile Settings"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSaveProfile} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Personal & Credentials */}
        <div className="lg:col-span-6 space-y-6">
          {/* Personal Info Card */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-brand-600" />
              <span>Personal & Contact Information</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Professional Bio & Clinical Focus
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Medical Qualifications & NMC/MCI Reg */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-emerald-600" />
              <span>Medical Credentials & MCI Registration</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  MCI / NMC Reg Number *
                </label>
                <input
                  type="text"
                  value={mciNumber}
                  onChange={(e) => setMciNumber(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-mono font-bold text-emerald-600 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Years of Clinical Experience
                </label>
                <input
                  type="number"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Medical Degrees & Fellowships
              </label>
              <input
                type="text"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Interactive Digital Signature Canvas */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileSignature className="h-4 w-4 text-purple-600" />
                <span>Doctor Digital Signature (e-Prescription & Lab Sign)</span>
              </h3>
              <button
                type="button"
                onClick={clearCanvas}
                className="text-xs text-rose-600 font-bold hover:underline flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Canvas</span>
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Draw your official signature below using mouse or touch. It will be embedded on all printable prescriptions and diagnostic reports.
            </p>

            <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 p-2 dark:border-slate-700 dark:bg-slate-800/40 text-center">
              <canvas
                ref={canvasRef}
                width={500}
                height={140}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full max-w-full h-32 bg-white rounded-xl cursor-crosshair touch-none dark:bg-slate-900"
              />
            </div>

            {savedSignature && (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-4 w-4" />
                <span>Signature captured and linked to practice profile</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timings, Fees & Security */}
        <div className="lg:col-span-6 space-y-6">
          {/* Consultation Fees Card */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-600" />
              <span>Consultation Fee Schedule (₹ INR)</span>
            </h3>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Regular OPD Fee
                </label>
                <input
                  type="number"
                  value={consultationFee}
                  onChange={(e) => setConsultationFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Emergency Fee
                </label>
                <input
                  type="number"
                  value={emergencyFee}
                  onChange={(e) => setEmergencyFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Teleconsultation
                </label>
                <input
                  type="number"
                  value={teleconsultationFee}
                  onChange={(e) => setTeleconsultationFee(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* OPD Slot & Schedule Configurator */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-600" />
              <span>Weekly OPD Schedule & Slot Timings</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Available Consultation Days
              </label>
              <div className="flex flex-wrap gap-2">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(
                  (day) => {
                    const isSelected = availableDays.includes(day);
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                          isSelected
                            ? "bg-brand-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {day.slice(0, 3)}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs pt-2">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Start Time
                </label>
                <input
                  type="text"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  End Time
                </label>
                <input
                  type="text"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Slot Duration (Min)
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Security & Access */}
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>Security & Access Governance</span>
            </h3>

            <div className="flex items-center justify-between text-xs rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/60">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">
                  Two-Factor Authentication (2FA)
                </p>
                <p className="text-slate-400 text-[11px]">
                  Requires SMS/Email OTP for accessing confidential patient health data
                </p>
              </div>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                ENABLED
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
