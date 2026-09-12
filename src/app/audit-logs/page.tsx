"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Eye,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function AuditLogsPage() {
  const { user, isAdmin } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 25, totalPages: 1 });

  // Filters
  const [selectedModule, setSelectedModule] = useState("All");
  const [selectedAction, setSelectedAction] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      const url = new URL("/api/audit-logs", window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("limit", "25");
      if (selectedModule !== "All") url.searchParams.set("module", selectedModule);
      if (selectedAction !== "All") url.searchParams.set("action", selectedAction);
      if (searchQuery) url.searchParams.set("search", searchQuery);

      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        if (data.pagination) setPagination(data.pagination);
      } else {
        toast.error("Failed to load audit logs (Admin privileges required)");
      }
    } catch {
      toast.error("Error connecting to audit log server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [selectedModule, selectedAction]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case "LOGIN":
      case "LOGOUT":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
      case "CREATE":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
      case "UPDATE":
        return "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300";
      case "DELETE":
        return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";
      case "TRIAGE":
      case "ADMIT":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
      case "DISCHARGE":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg dark:bg-slate-800">
              <ShieldAlert className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                Security & Compliance Audit Logs
              </h1>
              <p className="text-xs text-slate-500">
                Immutable record of clinical events, access trails, and hospital data changes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchLogs(pagination.page)}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Logs</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user, record ID, or action details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </form>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="All">All Modules</option>
              <option value="AUTH">AUTH</option>
              <option value="PATIENT">PATIENT</option>
              <option value="EMERGENCY">EMERGENCY</option>
              <option value="ICU">ICU</option>
              <option value="OT">OT</option>
              <option value="OPD">OPD</option>
              <option value="IPD">IPD</option>
              <option value="NURSING">NURSING</option>
              <option value="PHARMACY">PHARMACY</option>
              <option value="LABORATORY">LABORATORY</option>
              <option value="RADIOLOGY">RADIOLOGY</option>
              <option value="BILLING">BILLING</option>
              <option value="INVENTORY">INVENTORY</option>
              <option value="PROCUREMENT">PROCUREMENT</option>
              <option value="STAFF">STAFF</option>
              <option value="SETTINGS">SETTINGS</option>
            </select>

            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="All">All Actions</option>
              <option value="LOGIN">LOGIN</option>
              <option value="LOGOUT">LOGOUT</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="TRIAGE">TRIAGE</option>
              <option value="ADMIT">ADMIT</option>
              <option value="DISCHARGE">DISCHARGE</option>
              <option value="SURGERY_SCHEDULE">SURGERY_SCHEDULE</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <ShieldCheck className="h-12 w-12 text-slate-300 mb-3" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No audit log entries matching your criteria
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3.5">Timestamp</th>
                    <th className="px-4 py-3.5">User</th>
                    <th className="px-4 py-3.5">Module</th>
                    <th className="px-4 py-3.5">Action</th>
                    <th className="px-4 py-3.5">Event Details</th>
                    <th className="px-4 py-3.5">IP Address</th>
                    <th className="px-4 py-3.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {logs.map((log) => (
                    <tr
                      key={log._id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      <td className="px-4 py-3 font-medium text-slate-500 whitespace-nowrap">
                        {formatDate(log.timestamp || log.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {log.userName}
                        </p>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {log.userRole}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                          {log.module}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${getActionBadge(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate text-slate-700 dark:text-slate-300 font-medium">
                        {log.details}
                      </td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        {log.ipAddress || "127.0.0.1"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedLog(log);
                            setIsDetailOpen(true);
                          }}
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-100 p-4 dark:border-slate-800 text-xs">
              <span className="text-slate-500">
                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchLogs(pagination.page - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Previous
                </button>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchLogs(pagination.page + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Audit Log Inspector */}
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title="Audit Log Event Inspector"
          size="md"
        >
          {selectedLog && (
            <div className="space-y-4 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800 space-y-1.5 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Action / Module:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedLog.action} • {selectedLog.module}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">User:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedLog.userName} ({selectedLog.userRole})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Timestamp:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {formatDate(selectedLog.timestamp)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-bold">Client IP:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {selectedLog.ipAddress}
                  </span>
                </div>
                {selectedLog.recordId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Target Record:</span>
                    <span className="font-bold text-brand-600 dark:text-brand-400">
                      {selectedLog.recordId}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Full Action Payload / Description:
                </p>
                <div className="rounded-xl bg-slate-900 p-3 text-slate-100 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">
                  {selectedLog.details}
                </div>
              </div>

              {selectedLog.userAgent && (
                <p className="text-[10px] text-slate-400">
                  User-Agent: {selectedLog.userAgent}
                </p>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setIsDetailOpen(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-900"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
  );
}
