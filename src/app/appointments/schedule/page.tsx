"use client";

import React, { useState, useEffect } from "react";
import { Clock, Calendar, Stethoscope, Search, Building2 } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { EmptyState } from "@/components/common/EmptyState";
import Link from "next/link";

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function DoctorSchedulePage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Monday");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/doctors");
        if (res.ok) {
          const json = await res.json();
          setDoctors(json.doctors || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const availableOnDay = doctors.filter((doc) =>
    doc.availableDays?.includes(selectedDay)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Doctor Duty Roster & Schedules
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Weekly working days, consultation timings, and room assignments
          </p>
        </div>
        <Link
          href="/appointments"
          className="rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
        >
          Book Appointment
        </Link>
      </div>

      {/* Days Tabs */}
      <div className="flex overflow-x-auto gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800">
        {daysOfWeek.map((day) => {
          const count = doctors.filter((d) => d.availableDays?.includes(day)).length;
          const isActive = selectedDay === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all text-center whitespace-nowrap ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <span>{day}</span>
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.2 text-[10px] ${
                  isActive
                    ? "bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Doctors Scheduled for Day */}
      {loading ? (
        <LoadingSpinner label="Loading schedule..." />
      ) : availableOnDay.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title={`No doctors scheduled on ${selectedDay}`}
          description="Check another day or update doctor duty schedules."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {availableOnDay.map((doc) => (
            <div
              key={doc._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3">
                  <img
                    src={
                      doc.photo ||
                      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&auto=format&fit=crop&q=80"
                    }
                    alt={doc.name}
                    className="h-12 w-12 rounded-2xl object-cover ring-2 ring-brand-500/20"
                  />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                      {doc.name}
                    </h3>
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold">
                      {doc.specialization}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Department:</span>
                    <span className="font-semibold">{doc.department}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Consultation Cabin:</span>
                    <span className="font-semibold">{doc.roomNumber}</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span className="text-slate-400">Duty Timing:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {doc.workingHours?.start} - {doc.workingHours?.end}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Link
                  href={`/appointments?doctor=${doc._id}`}
                  className="rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700"
                >
                  Book on {selectedDay}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
