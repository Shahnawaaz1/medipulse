"use client";

import React, { useState, useEffect } from "react";
import {
  Pill,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Package,
  Clock,
  DollarSign,
  TrendingDown,
  Edit2,
  RefreshCw,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function PharmacyPage() {
  const [medicines, setMedicines] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockQty, setRestockQty] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    genericName: "",
    category: "Tablet",
    manufacturer: "",
    batchNumber: "",
    stockQuantity: 100,
    minThreshold: 20,
    purchasePrice: 2.0,
    sellingPrice: 5.0,
    expiryDate: "2027-12-31",
    locationRack: "Rack A-01",
  });

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category", categoryFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/medicines?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setMedicines(json.medicines || []);
        setStats(json.stats || {});
      }
    } catch {
      toast.error("Failed to load medicines");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [categoryFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchMedicines();
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/medicines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Medicine ${formData.name} added to pharmacy inventory!`);
        setIsAddModalOpen(false);
        fetchMedicines();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add medicine");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMedicine) return;
    try {
      setSubmitting(true);
      const newQty = (selectedMedicine.stockQuantity || 0) + Number(restockQty);
      const res = await fetch(`/api/medicines/${selectedMedicine._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stockQuantity: newQty }),
      });

      if (res.ok) {
        toast.success(`Stock updated: ${newQty} units in inventory.`);
        setIsRestockModalOpen(false);
        fetchMedicines();
      }
    } catch {
      toast.error("Failed to update stock");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Pharmacy & Drug Inventory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pharmaceutical stock control, low threshold alerts, batch tracking, and pricing
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/billing"
            className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <DollarSign className="h-4 w-4" />
            <span>Pharmacy POS / Billing</span>
          </Link>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Stock Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Drugs Listed</p>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {stats.total || 0}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400">
            <Pill className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-5 shadow-sm dark:bg-amber-950/30 dark:border-amber-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase">
              Low Stock Alerts
            </p>
            <p className="text-2xl font-extrabold text-amber-700 dark:text-amber-300 mt-1">
              {stats.lowStock || 0}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm dark:bg-rose-950/30 dark:border-rose-900 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase">
              Out of Stock
            </p>
            <p className="text-2xl font-extrabold text-rose-700 dark:text-rose-300 mt-1">
              {stats.outOfStock || 0}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300">
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search medicine by brand name, generic formula, batch #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Categories</option>
              {["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops", "Inhaler"].map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                )
              )}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              <option value="">All Stock Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>

            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-700"
            >
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Medicines Table */}
      {loading ? (
        <LoadingSpinner label="Loading pharmacy catalog..." />
      ) : medicines.length === 0 ? (
        <EmptyState
          icon={Pill}
          title="No medicines match your search"
          description="Add medicines or adjust your category filters."
          actionText="Add Medicine"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Medicine & Generic Formula</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Batch & Manufacturer</th>
                  <th className="px-5 py-3.5">Stock In-Hand</th>
                  <th className="px-5 py-3.5">Selling Price</th>
                  <th className="px-5 py-3.5">Expiry Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {medicines.map((med) => (
                  <tr
                    key={med._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{med.name}</p>
                      <p className="text-[11px] text-slate-400 italic">{med.genericName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {med.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-mono text-slate-700 dark:text-slate-300">{med.batchNumber}</p>
                      <p className="text-[11px] text-slate-400">{med.manufacturer}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`font-bold ${
                          med.stockQuantity <= med.minThreshold
                            ? "text-rose-600 font-extrabold"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {med.stockQuantity} Units
                      </span>
                      <p className="text-[10px] text-slate-400">Min: {med.minThreshold}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(med.sellingPrice)}
                      </p>
                      <p className="text-[10px] text-slate-400">Cost: {formatCurrency(med.purchasePrice)}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        {formatDate(med.expiryDate)}
                      </p>
                      <p className="text-[10px] text-slate-400">{med.locationRack}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={med.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedMedicine(med);
                          setIsRestockModalOpen(true);
                        }}
                        className="rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-brand-300"
                      >
                        Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Medicine Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Medicine to Pharmacy Inventory"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateMedicine} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold mb-1">Brand Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Augmentin 625mg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Generic Chemical Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amoxicillin + Clavulanic Acid"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              >
                {["Tablet", "Capsule", "Syrup", "Injection", "Ointment", "Drops", "Inhaler"].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Manufacturer *</label>
              <input
                type="text"
                required
                placeholder="e.g. Pfizer, GSK, Abbott"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Batch Number *</label>
              <input
                type="text"
                required
                placeholder="BAT-9941"
                value={formData.batchNumber}
                onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Initial Stock Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.stockQuantity}
                onChange={(e) =>
                  setFormData({ ...formData, stockQuantity: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Purchase Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.purchasePrice}
                onChange={(e) =>
                  setFormData({ ...formData, purchasePrice: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Selling Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.sellingPrice}
                onChange={(e) =>
                  setFormData({ ...formData, sellingPrice: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Rack / Storage Location</label>
              <input
                type="text"
                placeholder="Rack B-03"
                value={formData.locationRack}
                onChange={(e) => setFormData({ ...formData, locationRack: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-brand-700"
            >
              {submitting ? "Adding..." : "Save Medicine"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Restock Modal */}
      {selectedMedicine && (
        <Modal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          title={`Restock: ${selectedMedicine.name}`}
          subtitle={`Current stock: ${selectedMedicine.stockQuantity} units`}
          maxWidth="sm"
        >
          <form onSubmit={handleRestock} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">Additional Quantity to Add *</label>
              <input
                type="number"
                required
                min="1"
                value={restockQty}
                onChange={(e) => setRestockQty(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-brand-600 px-4 py-2 font-bold text-white shadow-sm hover:bg-brand-700"
              >
                Confirm Restock
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
