"use client";

import React, { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  TrendingDown,
  Clock,
  DollarSign,
  Building2,
  RefreshCw,
} from "lucide-react";
import { StatusBadge } from "@/components/common/StatusBadge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { Modal } from "@/components/common/Modal";
import { EmptyState } from "@/components/common/EmptyState";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

const categories = [
  "Surgical",
  "Equipment",
  "Consumables",
  "Diagnostic Supplies",
  "Sanitation",
];

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockQty, setRestockQty] = useState<number>(100);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "Surgical",
    quantity: 500,
    minThreshold: 100,
    unit: "Pairs",
    unitPrice: 1.5,
    supplier: "MedSupply Global Inc.",
    lastRestocked: new Date().toISOString().split("T")[0],
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append("category", categoryFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/inventory?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setItems(json.items || []);
      }
    } catch {
      toast.error("Failed to load inventory supplies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [categoryFilter, statusFilter]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(`Inventory supply ${formData.name} added!`);
        setIsAddModalOpen(false);
        fetchInventory();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add inventory item");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    try {
      setSubmitting(true);
      const newQty = (selectedItem.quantity || 0) + Number(restockQty);
      const res = await fetch(`/api/inventory/${selectedItem._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: newQty,
          lastRestocked: new Date().toISOString().split("T")[0],
        }),
      });

      if (res.ok) {
        toast.success(`Item restocked: ${newQty} ${selectedItem.unit} in stock.`);
        setIsRestockModalOpen(false);
        fetchInventory();
      } else {
        toast.error("Failed to restock");
      }
    } catch {
      toast.error("An error occurred");
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
            Hospital Inventory & Medical Consumables
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Surgical tools, equipment assets, PPE supplies, and vendor restocking cycles
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>Add Supply Item</span>
        </button>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="">All Stock Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          {items.length} Supplies Tracked
        </span>
      </div>

      {/* Items Table */}
      {loading ? (
        <LoadingSpinner label="Loading supplies catalog..." />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No inventory supplies found"
          description="Add consumables, surgical supplies, or equipment items to start tracking."
          actionText="Add Supply Item"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                  <th className="px-5 py-3.5">Item Code & Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Available Stock</th>
                  <th className="px-5 py-3.5">Unit Price</th>
                  <th className="px-5 py-3.5">Authorized Supplier</th>
                  <th className="px-5 py-3.5">Last Restocked</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {items.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                      <p className="text-[11px] font-mono text-slate-400">{item.itemCode}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`font-bold ${
                          item.quantity <= item.minThreshold
                            ? "text-rose-600 font-extrabold"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {item.quantity} {item.unit}
                      </span>
                      <p className="text-[10px] text-slate-400">Min: {item.minThreshold}</p>
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                      {item.supplier}
                    </td>
                    <td className="px-5 py-4 text-slate-500">
                      {formatDate(item.lastRestocked)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedItem(item);
                          setIsRestockModalOpen(true);
                        }}
                        className="rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-100 dark:bg-brand-950 dark:text-brand-300"
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

      {/* Add Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Inventory Item"
        subtitle="Register medical supply, equipment, or surgical consumable"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateItem} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-semibold mb-1">Item Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Sterile Syringes 5ml"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold mb-1">Stock Quantity *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({ ...formData, quantity: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Low Threshold *</label>
              <input
                type="number"
                required
                min="0"
                value={formData.minThreshold}
                onChange={(e) =>
                  setFormData({ ...formData, minThreshold: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Unit of Measure *</label>
              <input
                type="text"
                required
                placeholder="Pairs / Boxes / Units / Packs"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Unit Cost Price ($) *</label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.unitPrice}
                onChange={(e) =>
                  setFormData({ ...formData, unitPrice: Number(e.target.value) })
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:border-brand-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-semibold mb-1">Supplier / Vendor Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. MedSupply Global, 3M Healthcare"
                value={formData.supplier}
                onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
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
              {submitting ? "Adding..." : "Save Item"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Restock Modal */}
      {selectedItem && (
        <Modal
          isOpen={isRestockModalOpen}
          onClose={() => setIsRestockModalOpen(false)}
          title={`Restock: ${selectedItem.name}`}
          subtitle={`Current in stock: ${selectedItem.quantity} ${selectedItem.unit}`}
          maxWidth="sm"
        >
          <form onSubmit={handleRestockItem} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold mb-1">
                Additional Quantity to Add ({selectedItem.unit}) *
              </label>
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
