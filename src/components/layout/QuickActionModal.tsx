"use client";

import React from "react";
import { Modal } from "@/components/common/Modal";
import {
  UserPlus,
  CalendarPlus,
  Hotel,
  Receipt,
  FlaskConical,
  FileSignature,
  Pill,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const actions = [
  {
    title: "Register New Patient",
    description: "Create a complete patient profile with medical history.",
    icon: UserPlus,
    color: "bg-blue-500",
    href: "/patients/new",
  },
  {
    title: "Book Appointment",
    description: "Schedule patient visit with specialist doctor.",
    icon: CalendarPlus,
    color: "bg-teal-500",
    href: "/appointments",
  },
  {
    title: "Admit Inpatient (IPD)",
    description: "Admit patient and allocate ward/room/bed.",
    icon: Hotel,
    color: "bg-indigo-500",
    href: "/ipd",
  },
  {
    title: "Create Invoice / Bill",
    description: "Generate multi-item invoice and record payments.",
    icon: Receipt,
    color: "bg-amber-500",
    href: "/billing",
  },
  {
    title: "Order Diagnostic Lab Test",
    description: "Request pathology, biochemistry, or hematology tests.",
    icon: FlaskConical,
    color: "bg-rose-500",
    href: "/laboratory",
  },
  {
    title: "Write Prescription (Rx)",
    description: "Issue digital doctor prescription with dosage.",
    icon: FileSignature,
    color: "bg-purple-500",
    href: "/prescriptions",
  },
];

export function QuickActionModal({ isOpen, onClose }: QuickActionModalProps) {
  const router = useRouter();

  const handleAction = (href: string) => {
    onClose();
    router.push(href);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hospital Quick Actions"
      subtitle="Select an operation to jump straight to the workflow"
      maxWidth="2xl"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <button
              key={i}
              onClick={() => handleAction(act.href)}
              className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 text-left shadow-sm transition-all hover:border-brand-300 hover:shadow-md dark:bg-slate-800/40 dark:border-slate-800 dark:hover:border-brand-700 group"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${act.color} text-white shadow-sm transition-transform group-hover:scale-105`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 group-hover:text-brand-600 dark:text-white dark:group-hover:text-brand-400">
                  {act.title}
                </h4>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {act.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
export default QuickActionModal;
