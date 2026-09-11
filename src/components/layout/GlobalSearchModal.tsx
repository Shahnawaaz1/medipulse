"use client";

import React, { useState, useEffect } from "react";
import { Search, X, User, Stethoscope, Calendar, Receipt, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface SearchResult {
  type: "Patient" | "Doctor" | "Appointment" | "Invoice";
  title: string;
  subtitle: string;
  url: string;
}

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    router.push(url);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Patient":
        return <User className="h-4 w-4 text-blue-500" />;
      case "Doctor":
        return <Stethoscope className="h-4 w-4 text-teal-500" />;
      case "Appointment":
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case "Invoice":
        return <Receipt className="h-4 w-4 text-amber-500" />;
      default:
        return <Search className="h-4 w-4 text-slate-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal dialog */}
      <div className="relative w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800 z-10 animate-in zoom-in-95 duration-150">
        {/* Input box */}
        <div className="flex items-center border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search patients, doctors, appointments, invoices... (Press ESC to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="flex-1 bg-transparent px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Results area */}
        <div className="max-h-80 overflow-y-auto p-2">
          {loading && (
            <div className="py-8 text-center text-xs text-slate-400">
              Searching healthcare records...
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              No matching hospital records found for "{query}".
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1">
              {results.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelect(item.url)}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-slate-400">{item.subtitle}</p>
                    </div>
                  </div>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          )}

          {!query && (
            <div className="py-6 text-center text-xs text-slate-400">
              Type at least 2 characters to search across all hospital records.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default GlobalSearchModal;
