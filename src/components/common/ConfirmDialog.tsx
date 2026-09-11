"use client";

import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="md">
      <div className="flex items-start gap-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            type === "danger"
              ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
              : "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className={`rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity disabled:opacity-50 ${
            type === "danger"
              ? "bg-rose-600 hover:bg-rose-700"
              : "bg-brand-600 hover:bg-brand-700"
          }`}
        >
          {isLoading ? "Processing..." : confirmText}
        </button>
      </div>
    </Modal>
  );
}
export default ConfirmDialog;
