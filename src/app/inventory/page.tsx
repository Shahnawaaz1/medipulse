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
  ShoppingCart,
  CheckCircle2,
  Truck,
  FileCheck,
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
  const [activeTab, setActiveTab] = useState<"stock" | "procurement">("stock");
  const [items, setItems] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [procurementStats, setProcurementStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [restockQty, setRestockQty] = useState<number>(100);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Item Form
  const [formData, setFormData] = useState({
    name: "",
    category: "Surgical",
    quantity: 500,
    minThreshold: 100,
    unit: "Pairs",
    unitPrice: 150,
    supplier: "MedSupply Global Inc.",
    lastRestocked: new Date().toISOString().split("T")[0],
  });

  // Purchase Order Form
  const [poForm, setPoForm] = useState({
    supplierName: "Apex Medical Supplies Ltd.",
    supplierContact: "+91 98765-43210",
    itemCode: "MED-SURG-01",
    name: "Surgical Gloves (Size 7.5)",
    category: "Surgical",
    quantity: 200,
    unit: "Boxes",
    unitPrice: 450,
    expectedDeliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "Urgent restocking for OT Suites 1-4",
  });

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter) params.append("category", categoryFilter);
      if (statusFilter) params.append("status", statusFilter);

      const [invRes, poRes] = await Promise.all([
        fetch(`/api/inventory?${params.toString()}`),
        fetch("/api/inventory/procurement"),
      ]);

      if (invRes.ok) {
        const json = await invRes.json();
        setItems(json.items || []);
      }

      if (poRes.ok) {
        const pJson = await poRes.json();
        setPurchaseOrders(pJson.purchaseOrders || []);
        if (pJson.stats) setProcurementStats(pJson.stats);
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

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const lineTotal = poForm.quantity * poForm.unitPrice;
      const res = await fetch("/api/inventory/procurement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierName: poForm.supplierName,
          supplierContact: poForm.supplierContact,
          items: [
            {
              itemCode: poForm.itemCode,
              name: poForm.name,
              category: poForm.category,
              quantity: poForm.quantity,
              unit: poForm.unit,
              unitPrice: poForm.unitPrice,
              total: lineTotal,
            },
          ],
          subtotal: lineTotal,
          tax: Math.round(lineTotal * 0.12),
          totalAmount: Math.round(lineTotal * 1.12),
          expectedDeliveryDate: poForm.expectedDeliveryDate,
          status: "PO Issued",
          notes: poForm.notes,
        }),
      });

      if (res.ok) {
        toast.success("Purchase Order issued successfully!");
        setIsPoModalOpen(false);
        fetchInventory();
      } else {
        toast.error("Failed to create purchase order");
      }
    } catch {
      toast.error("Error issuing PO");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReceiveGoods = async (po: any) => {
    try {
      const res = await fetch(`/api/inventory/procurement/${po._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Goods Received",
          paymentStatus: "Paid",
        }),
      });

      if (res.ok) {
        toast.success(`Goods received for ${po.poNumber}! Stock levels updated automatically.`);
        fetchInventory();
      } else {
        toast.error("Failed to record goods receipt");
      }
    } catch {
      toast.error("Error receiving goods");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Hospital Inventory & Procurement
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Surgical tools, equipment assets, PPE supplies, purchase orders, and goods receiving workflow
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeTab === "stock" ? (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Supply Item</span>
            </button>
          ) : (
            <button
              onClick={() => setIsPoModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-brand-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition-all"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Create Purchase Order</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 pb-1">
        <button
          onClick={() => setActiveTab("stock")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "stock"
              ? "border-brand-600 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Medical Supplies Stock ({items.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("procurement")}
          className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-bold transition-all ${
            activeTab === "procurement"
              ? "border-brand-600 text-brand-600 dark:text-brand-400"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Procurement & Purchase Orders ({purchaseOrders.length})</span>
        </button>
      </div>

      {/* Tab 1: Medical Supplies Stock */}
      {activeTab === "stock" && (
        <div className="space-y-4">
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
        </div>
      )}

      {/* Tab 2: Procurement & Purchase Orders */}
      {activeTab === "procurement" && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/40">
                    <th className="px-5 py-3.5">PO Number</th>
                    <th className="px-5 py-3.5">Supplier</th>
                    <th className="px-5 py-3.5">Items Ordered</th>
                    <th className="px-5 py-3.5">Total Amount</th>
                    <th className="px-5 py-3.5">Expected Delivery</th>
                    <th className="px-5 py-3.5">PO Status</th>
                    <th className="px-5 py-3.5 text-right">Receive & Update Stock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {purchaseOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-slate-400">
                        No purchase orders found. Click "Create Purchase Order" above to issue one.
                      </td>
                    </tr>
                  ) : (
                    purchaseOrders.map((po) => (
                      <tr key={po._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="px-5 py-4 font-mono font-bold text-brand-600">
                          {po.poNumber}
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900 dark:text-white">{po.supplierName}</p>
                          <span className="text-[10px] text-slate-400">{po.supplierContact}</span>
                        </td>
                        <td className="px-5 py-4">
                          {po.items?.map((item: any, i: number) => (
                            <span key={i} className="block text-slate-700 dark:text-slate-300">
                              {item.name} ({item.quantity} {item.unit})
                            </span>
                          ))}
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">
                          {formatCurrency(po.totalAmount)}
                        </td>
                        <td className="px-5 py-4 text-slate-500">
                          {formatDate(po.expectedDeliveryDate)}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={po.status} size="sm" />
                        </td>
                        <td className="px-5 py-4 text-right">
                          {po.status !== "Goods Received" && po.status !== "Paid" ? (
                            <button
                              onClick={() => handleReceiveGoods(po)}
                              className="flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm ml-auto"
                            >
                              <Truck className="h-3.5 w-3.5" />
                              <span>Receive Goods</span>
                            </button>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 justify-end">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Stock Updated</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
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
              <label className="block font-semibold mb-1">Unit Cost Price (₹) *</label>
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

      {/* Modal: Create Purchase Order */}
      <Modal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        title="Issue New Purchase Order (PO)"
        subtitle="Hospital procurement request & automated stock entry on receipt"
        maxWidth="lg"
      >
        <form onSubmit={handleCreatePO} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Supplier / Vendor *
              </label>
              <input
                type="text"
                required
                value={poForm.supplierName}
                onChange={(e) => setPoForm({ ...poForm, supplierName: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Supplier Phone
              </label>
              <input
                type="text"
                value={poForm.supplierContact}
                onChange={(e) => setPoForm({ ...poForm, supplierContact: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={poForm.name}
                onChange={(e) => setPoForm({ ...poForm, name: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Category
              </label>
              <select
                value={poForm.category}
                onChange={(e) => setPoForm({ ...poForm, category: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={poForm.quantity}
                onChange={(e) => setPoForm({ ...poForm, quantity: parseInt(e.target.value) || 1 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unit
              </label>
              <input
                type="text"
                value={poForm.unit}
                onChange={(e) => setPoForm({ ...poForm, unit: e.target.value })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Unit Cost (₹) *
              </label>
              <input
                type="number"
                min="0"
                required
                value={poForm.unitPrice}
                onChange={(e) => setPoForm({ ...poForm, unitPrice: parseFloat(e.target.value) || 0 })}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-300">Total Purchase Value:</span>
            <span className="font-bold text-brand-600 text-sm">
              {formatCurrency(poForm.quantity * poForm.unitPrice * 1.12)} (Incl. 12% GST)
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsPoModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-brand-600 px-5 py-2 font-bold text-white shadow-sm hover:bg-brand-700"
            >
              {submitting ? "Issuing..." : "Issue Purchase Order"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
