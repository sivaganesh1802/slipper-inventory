"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { SlipperImagePicker } from "@/components/SlipperImagePicker";
import { IPurchase } from "@/lib/types";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Package,
  Layers,
  Calendar,
  AlertCircle,
  Tag,
  Footprints,
  Pencil,
  ChevronDown,
  ChevronUp,
  Check,
  Boxes,
  X,
} from "lucide-react";
import { getTodayDateString } from "@/lib/sampleData";

const ALL_SIZES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchArtNo, setSearchArtNo] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Edit mode vs Add mode
  const [editingPurchase, setEditingPurchase] = useState<IPurchase | null>(null);

  // Form Fields
  const [artNo, setArtNo] = useState("");
  const [size, setSize] = useState(""); // For single edit mode
  const [purchaseDate, setPurchaseDate] = useState(getTodayDateString());
  const [purchaseValue, setPurchaseValue] = useState<string>("");
  const [sellingPrice, setSellingPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>(""); // For single edit mode
  const [remainingStock, setRemainingStock] = useState<string>(""); // For edit mode
  const [image, setImage] = useState("");
  const [notes, setNotes] = useState("");

  // Multi-size batch selection for Add mode (Sizes 1 to 12)
  // Maps size -> quantity string, e.g. { "6": "30", "7": "40" }
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (searchArtNo.trim()) queryParams.set("artNo", searchArtNo.trim());
      if (selectedSize) queryParams.set("size", selectedSize);

      const res = await fetch(`/api/purchases?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPurchases(data.purchases);
      }
    } catch (err) {
      console.error("Error loading purchases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, [searchArtNo, selectedSize]);

  // Open modal for Adding New Batch
  const handleOpenAddModal = () => {
    setEditingPurchase(null);
    setArtNo("");
    setSize("");
    setSelectedSizes({});
    setIsSizeDropdownOpen(false);
    setPurchaseDate(getTodayDateString());
    setPurchaseValue("");
    setSellingPrice("");
    setQuantity("");
    setRemainingStock("");
    setImage("");
    setNotes("");
    setFormError("");
    setIsModalOpen(true);
  };

  // Open modal for Editing an Existing Purchase
  const handleOpenEditModal = (p: IPurchase) => {
    setEditingPurchase(p);
    setArtNo(p.artNo);
    setSize(p.size);
    setPurchaseDate(p.purchaseDate);
    setPurchaseValue(String(p.purchaseValue));
    setSellingPrice(p.sellingPrice ? String(p.sellingPrice) : "");
    setQuantity(String(p.quantity));
    setRemainingStock(String(p.remainingStock ?? p.quantity));
    setImage(p.image || "");
    setNotes(p.notes || "");
    setFormError("");
    setIsSizeDropdownOpen(false);
    setIsModalOpen(true);
  };

  // Toggle size checkbox in Add mode
  const handleToggleSize = (sz: string) => {
    setSelectedSizes((prev) => {
      const next = { ...prev };
      if (next[sz] !== undefined) {
        delete next[sz];
      } else {
        next[sz] = "50"; // default initial pairs
      }
      return next;
    });
  };

  // Quick preset selectors
  const handlePresetSelect = (preset: "common" | "all" | "clear") => {
    if (preset === "clear") {
      setSelectedSizes({});
    } else if (preset === "common") {
      setSelectedSizes({ "6": "50", "7": "50", "8": "50", "9": "50", "10": "50" });
    } else if (preset === "all") {
      const all: Record<string, string> = {};
      ALL_SIZES.forEach((s) => (all[s] = "50"));
      setSelectedSizes(all);
    }
  };

  const handleUpdateSizeQty = (sz: string, val: string) => {
    setSelectedSizes((prev) => ({
      ...prev,
      [sz]: val,
    }));
  };

  const handleStepQty = (sz: string, delta: number) => {
    setSelectedSizes((prev) => {
      const current = Number(prev[sz]) || 0;
      const nextVal = Math.max(1, current + delta);
      return {
        ...prev,
        [sz]: String(nextVal),
      };
    });
  };

  const handleSetAllQty = (qty: number) => {
    setSelectedSizes((prev) => {
      const next: Record<string, string> = {};
      Object.keys(prev).forEach((s) => {
        next[s] = String(qty);
      });
      return next;
    });
  };

  const handleRemoveSize = (sz: string) => {
    setSelectedSizes((prev) => {
      const next = { ...prev };
      delete next[sz];
      return next;
    });
  };

  // Totals for batch addition
  const selectedSizeKeys = Object.keys(selectedSizes).sort((a, b) => Number(a) - Number(b));
  const totalBatchPairs = selectedSizeKeys.reduce((acc, s) => acc + (Number(selectedSizes[s]) || 0), 0);
  const costPerPair = Number(purchaseValue) || 0;
  const totalBatchCost = totalBatchPairs * costPerPair;

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!artNo.trim()) {
      setFormError("Art.No is required");
      return;
    }
    if (!purchaseDate) {
      setFormError("Purchase date is required");
      return;
    }
    const val = Number(purchaseValue);
    if (isNaN(val) || val < 0) {
      setFormError("Valid purchase cost is required");
      return;
    }

    try {
      setSubmitting(true);

      if (editingPurchase) {
        // --- EDIT MODE ---
        if (!size.trim()) {
          setFormError("Size is required");
          return;
        }
        const qty = Number(quantity);
        if (isNaN(qty) || qty <= 0) {
          setFormError("Quantity must be at least 1");
          return;
        }
        const rem = Number(remainingStock);

        const res = await fetch(`/api/purchases/${editingPurchase._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            artNo: artNo.toUpperCase().trim(),
            size: size.trim(),
            purchaseDate,
            purchaseValue: val,
            sellingPrice: sellingPrice ? Number(sellingPrice) : 0,
            quantity: qty,
            remainingStock: isNaN(rem) ? qty : rem,
            image,
            notes,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to update purchase");
        }
      } else {
        // --- ADD MODE (Multi-size Batch) ---
        if (selectedSizeKeys.length === 0) {
          setFormError("Please select at least one size from the dropdown (Sizes 1-12)");
          return;
        }

        const sizesPayload = selectedSizeKeys.map((s) => ({
          size: s,
          quantity: Number(selectedSizes[s]) || 0,
        }));

        const hasZero = sizesPayload.some((s) => s.quantity <= 0);
        if (hasZero) {
          setFormError("Please enter a valid quantity (> 0) for each selected size");
          return;
        }

        const res = await fetch("/api/purchases", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            artNo: artNo.toUpperCase().trim(),
            purchaseDate,
            purchaseValue: val,
            sellingPrice: sellingPrice ? Number(sellingPrice) : 0,
            sizes: sizesPayload,
            image,
            notes,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to save purchase batch");
        }
      }

      setIsModalOpen(false);
      fetchPurchases();
    } catch (err: unknown) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, artNumber: string, itemSize: string) => {
    if (!confirm(`Delete purchase record for Art.No ${artNumber} (Size ${itemSize})?`)) return;

    try {
      const res = await fetch(`/api/purchases/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchPurchases();
      else alert(data.error || "Failed to delete");
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const totalStockPairs = purchases.reduce((acc, p) => acc + (p.remainingStock ?? 0), 0);
  const totalStockValuation = purchases.reduce(
    (acc, p) => acc + (p.remainingStock ?? 0) * p.purchaseValue,
    0
  );

  return (
    <div className="animate-fade-in">
      <Header
        title="Purchase Management"
        subtitle="Manage supplier acquisitions, Art.No stock-in, sizes, and purchase prices"
      />

      {/* KPI Ribbon */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr auto",
          gap: "10px",
          marginBottom: "12px",
          alignItems: "center",
        }}
      >
        <div
          className="kpi-card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            minHeight: "44px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              background: "#fef3c7",
              color: "#b45309",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Package size={14} />
          </div>
          <div style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden" }}>
            <span style={{ fontSize: "0.68rem", color: "#475569", fontWeight: 600 }}>
              INVENTORY STOCK
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                {totalStockPairs.toLocaleString()}
              </span>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>pairs in stock</span>
            </div>
          </div>
        </div>

        <div
          className="kpi-card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 12px",
            minHeight: "44px",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              background: "#e0f2fe",
              color: "#0369a1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Layers size={14} />
          </div>
          <div style={{ minWidth: 0, whiteSpace: "nowrap", overflow: "hidden" }}>
            <span style={{ fontSize: "0.68rem", color: "#475569", fontWeight: 600 }}>
              STOCK ASSET VALUE
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                ₹{totalStockValuation.toLocaleString()}
              </span>
              <span style={{ fontSize: "0.7rem", color: "#64748b" }}>at cost price</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="btn btn-primary"
          style={{ padding: "8px 16px", fontSize: "0.8rem", whiteSpace: "nowrap", height: "44px" }}
        >
          <Plus size={15} />
          <span>+ Add Slipper Stock</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: "7px 12px",
          marginBottom: "12px",
          display: "flex",
          gap: "8px",
          alignItems: "center",
          flexWrap: "nowrap",
          overflowX: "auto",
        }}
      >
        <div style={{ position: "relative", flex: 1, minWidth: "150px" }}>
          <Search
            size={13}
            style={{
              position: "absolute",
              left: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#64748b",
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search by Art.No..."
            value={searchArtNo}
            onChange={(e) => setSearchArtNo(e.target.value)}
            style={{ paddingLeft: "26px", height: "30px", fontSize: "0.78rem" }}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <Filter size={13} style={{ color: "#64748b" }} />
          <select
            className="input-field"
            value={selectedSize}
            onChange={(e) => setSelectedSize(e.target.value)}
            style={{ height: "30px", padding: "0 8px", fontSize: "0.78rem", minWidth: "100px" }}
          >
            <option value="">All Sizes</option>
            {ALL_SIZES.map((sz) => (
              <option key={sz} value={sz}>
                Size {sz}
              </option>
            ))}
          </select>
        </div>

        {(searchArtNo || selectedSize) && (
          <button
            onClick={() => {
              setSearchArtNo("");
              setSelectedSize("");
            }}
            className="btn btn-secondary btn-sm"
            style={{ height: "30px", padding: "0 8px", fontSize: "0.72rem", flexShrink: 0 }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Stock Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: "50px" }}>Image</th>
              <th>Art.No</th>
              <th>Size</th>
              <th>Purchase Date</th>
              <th>Cost Price</th>
              <th>Selling Price</th>
              <th>Purchased Qty</th>
              <th>Remaining Stock</th>
              <th>Stock Value</th>
              <th style={{ width: "80px", textAlign: "center" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "24px", color: "#475569", fontWeight: 600 }}>
                  Loading stock from database...
                </td>
              </tr>
            ) : purchases.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ textAlign: "center", padding: "24px", color: "#475569", fontWeight: 600 }}>
                  No purchases found. Click &quot;+ Add Slipper Stock&quot; to begin!
                </td>
              </tr>
            ) : (
              purchases.map((p) => {
                const isOutOfStock = p.remainingStock === 0;
                const isLowStock = p.remainingStock <= 5;

                return (
                  <tr key={p._id}>
                    <td style={{ width: "50px" }}>
                      <div
                        style={{
                          width: "44px",
                          height: "32px",
                          borderRadius: "4px",
                          backgroundColor: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {p.image ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={p.image}
                            alt={p.artNo}
                            style={{ width: "100%", height: "100%", objectFit: "contain" }}
                          />
                        ) : (
                          <Footprints size={14} style={{ color: "#64748b" }} />
                        )}
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-amber">{p.artNo}</span>
                      {p.notes && (
                        <span style={{ fontSize: "0.68rem", color: "#64748b", marginLeft: "6px" }}>
                          {p.notes}
                        </span>
                      )}
                    </td>

                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "1px 6px",
                          borderRadius: "3px",
                          background: "#e0f2fe",
                          color: "#0369a1",
                          fontWeight: 800,
                          fontSize: "0.78rem",
                        }}
                      >
                        {p.size}
                      </span>
                    </td>

                    <td style={{ color: "#475569" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={12} style={{ color: "#64748b" }} />
                        <span>{p.purchaseDate}</span>
                      </div>
                    </td>

                    <td style={{ fontWeight: 700, color: "#0f172a" }}>
                      ₹{p.purchaseValue.toLocaleString()}
                    </td>

                    <td>
                      {p.sellingPrice && p.sellingPrice > 0 ? (
                        <div>
                          <span style={{ fontWeight: 800, color: "#0284c7" }}>
                            ₹{p.sellingPrice.toLocaleString()}
                          </span>
                          {p.sellingPrice > p.purchaseValue && (
                            <span
                              style={{
                                display: "inline-block",
                                marginLeft: "4px",
                                fontSize: "0.65rem",
                                color: "#166534",
                                background: "#dcfce7",
                                padding: "1px 4px",
                                borderRadius: "3px",
                                fontWeight: 700,
                              }}
                              title={`Target Margin: ₹${(p.sellingPrice - p.purchaseValue).toFixed(0)}/pair`}
                            >
                              +₹{(p.sellingPrice - p.purchaseValue).toFixed(0)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>—</span>
                      )}
                    </td>

                    <td style={{ color: "#0f172a", fontWeight: 600 }}>{p.quantity} pairs</td>

                    <td>
                      <span
                        className={`badge ${
                          isOutOfStock ? "badge-amber" : isLowStock ? "badge-amber" : "badge-emerald"
                        }`}
                      >
                        {p.remainingStock} pairs left
                      </span>
                    </td>

                    <td style={{ fontWeight: 800, color: "#0f172a" }}>
                      ₹{((p.remainingStock ?? 0) * p.purchaseValue).toLocaleString()}
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: "4px", justifyContent: "center" }}>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          title="Edit Purchase Record"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "3px 6px" }}
                        >
                          <Pencil size={13} style={{ color: "#0284c7" }} />
                        </button>
                        <button
                          onClick={() => handleDelete(p._id, p.artNo, p.size)}
                          title="Delete Record"
                          className="btn btn-danger btn-sm"
                          style={{ padding: "3px 6px" }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Slipper Purchase Modal (Add Multi-Size Batch or Edit Single Record) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPurchase ? "Edit Slipper Purchase Stock" : "Add Slipper Purchase Stock"}
        subtitle={
          editingPurchase
            ? `Update stock, price, and quantities for Art.No ${editingPurchase.artNo} (Size ${editingPurchase.size})`
            : "Record new batch arrival with Article Number, multiple sizes (1-12), and quantities"
        }
        maxWidth="540px"
      >
        {formError && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 12px",
              marginBottom: "12px",
              borderRadius: "var(--radius-sm)",
              background: "#ffe4e6",
              border: "1px solid #fecdd3",
              color: "#be123c",
              fontSize: "0.8rem",
            }}
          >
            <AlertCircle size={15} />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit}>
          <div className="input-group">
            <label className="input-label">Slipper Image & Visual</label>
            <SlipperImagePicker value={image} artNo={artNo} onChange={(val) => setImage(val)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="input-group">
              <label className="input-label" htmlFor="artNo">
                Art.No *
              </label>
              <div style={{ position: "relative" }}>
                <Tag
                  size={14}
                  style={{
                    position: "absolute",
                    left: "8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                  }}
                />
                <input
                  id="artNo"
                  type="text"
                  className="input-field"
                  placeholder="e.g. SLIP-101"
                  value={artNo}
                  onChange={(e) => setArtNo(e.target.value)}
                  style={{ paddingLeft: "28px", textTransform: "uppercase" }}
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="purchaseDate">
                Purchase Date *
              </label>
              <input
                id="purchaseDate"
                type="date"
                className="input-field"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: editingPurchase ? "1fr 1fr 1fr" : "1fr 1fr", gap: "10px" }}>
            <div className="input-group">
              <label className="input-label" htmlFor="purchaseValue">
                Purchase Cost (₹) *
              </label>
              <input
                id="purchaseValue"
                type="number"
                step="any"
                className="input-field"
                placeholder="e.g. 150"
                value={purchaseValue}
                onChange={(e) => setPurchaseValue(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="sellingPrice">
                Default Selling Price (₹) *
              </label>
              <input
                id="sellingPrice"
                type="number"
                step="any"
                className="input-field"
                placeholder="e.g. 250"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
              />
            </div>

            {editingPurchase && (
              <div className="input-group">
                <label className="input-label" htmlFor="size">
                  Size *
                </label>
                <input
                  id="size"
                  type="text"
                  className="input-field"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  required
                />
              </div>
            )}
          </div>

          {/* Target Profit preview badge */}
          {purchaseValue && sellingPrice && Number(sellingPrice) > Number(purchaseValue) && (
            <div
              style={{
                marginTop: "-4px",
                marginBottom: "12px",
                padding: "6px 10px",
                borderRadius: "4px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                fontSize: "0.74rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span>
                💡 Target Profit: <strong>₹{(Number(sellingPrice) - Number(purchaseValue)).toFixed(2)}</strong> / pair
              </span>
              <span style={{ fontWeight: 800 }}>
                +{(((Number(sellingPrice) - Number(purchaseValue)) / Number(purchaseValue)) * 100).toFixed(1)}% Markup
              </span>
            </div>
          )}

          {/* EDIT MODE: Single Record Quantity and Remaining Stock */}
          {editingPurchase ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="input-group">
                <label className="input-label" htmlFor="quantity">
                  Purchased Qty (Pairs) *
                </label>
                <input
                  id="quantity"
                  type="number"
                  min="1"
                  className="input-field"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>

              <div className="input-group">
                <label className="input-label" htmlFor="remainingStock">
                  Remaining In-Stock (Pairs) *
                </label>
                <input
                  id="remainingStock"
                  type="number"
                  min="0"
                  className="input-field"
                  value={remainingStock}
                  onChange={(e) => setRemainingStock(e.target.value)}
                  required
                />
              </div>
            </div>
          ) : (
            /* ADD MODE: Multi-Size Selection with Checkboxes & Per-Size Quantities (Sizes 1 to 12) */
            <div className="input-group" style={{ marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label className="input-label" style={{ marginBottom: 0, fontWeight: 700, color: "#0f172a" }}>
                  Select Slipper Sizes (Check from 1 to 12) *
                </label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect("common")}
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      border: "1px solid #0284c7",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Common (6-10)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect("all")}
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      background: "#f1f5f9",
                      color: "#334155",
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    All (1-12)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSelect("clear")}
                    style={{
                      fontSize: "0.7rem",
                      padding: "2px 8px",
                      borderRadius: "4px",
                      border: "1px solid #cbd5e1",
                      background: "#f1f5f9",
                      color: "#64748b",
                      cursor: "pointer",
                    }}
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Sizes 1 to 12 Checkbox Grid - Directly Visible */}
              <div
                style={{
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-sm)",
                  padding: "8px 10px",
                  background: "#f8fafc",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: "6px",
                  }}
                >
                  {ALL_SIZES.map((sz) => {
                    const isChecked = selectedSizes[sz] !== undefined;
                    return (
                      <label
                        key={sz}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "5px",
                          padding: "6px 4px",
                          borderRadius: "4px",
                          background: isChecked ? "#0284c7" : "#ffffff",
                          border: `1px solid ${isChecked ? "#0284c7" : "#cbd5e1"}`,
                          cursor: "pointer",
                          userSelect: "none",
                          fontSize: "0.76rem",
                          fontWeight: 700,
                          color: isChecked ? "#ffffff" : "#0f172a",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSize(sz)}
                          style={{ cursor: "pointer", accentColor: "#0284c7" }}
                        />
                        <span>Size {sz}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Quantity input per selected size */}
              {selectedSizeKeys.length > 0 && (
                <div style={{ marginTop: "12px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                      flexWrap: "nowrap",
                    }}
                  >
                    <span style={{ fontSize: "0.74rem", color: "#0f172a", fontWeight: 700 }}>
                      Quantity per Size (Pairs):
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ fontSize: "0.68rem", color: "#64748b" }}>Set all:</span>
                      <button
                        type="button"
                        onClick={() => handleSetAllQty(25)}
                        style={{
                          fontSize: "0.68rem",
                          padding: "1px 6px",
                          borderRadius: "3px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#334155",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        25
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAllQty(50)}
                        style={{
                          fontSize: "0.68rem",
                          padding: "1px 6px",
                          borderRadius: "3px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#334155",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        50
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSetAllQty(100)}
                        style={{
                          fontSize: "0.68rem",
                          padding: "1px 6px",
                          borderRadius: "3px",
                          border: "1px solid #cbd5e1",
                          background: "#ffffff",
                          color: "#334155",
                          cursor: "pointer",
                          fontWeight: 600,
                        }}
                      >
                        100
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(215px, 1fr))",
                      gap: "10px",
                      maxHeight: "200px",
                      overflowY: "auto",
                      padding: "4px 2px",
                    }}
                  >
                    {selectedSizeKeys.map((sz) => (
                      <div
                        key={sz}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "8px 12px",
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          borderRadius: "8px",
                          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                          gap: "10px",
                        }}
                      >
                        {/* Size Badge */}
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: "52px",
                            height: "28px",
                            padding: "0 8px",
                            borderRadius: "6px",
                            background: "#e0f2fe",
                            color: "#0369a1",
                            fontWeight: 800,
                            fontSize: "0.8rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          Size {sz}
                        </div>

                        {/* Stepper + Quantity Input */}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              overflow: "hidden",
                              background: "#ffffff",
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => handleStepQty(sz, -5)}
                              style={{
                                width: "24px",
                                height: "28px",
                                border: "none",
                                background: "#f1f5f9",
                                color: "#334155",
                                cursor: "pointer",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                userSelect: "none",
                                padding: 0,
                              }}
                              title="Decrease 5 pairs"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              className="no-spin"
                              value={selectedSizes[sz]}
                              onChange={(e) => handleUpdateSizeQty(sz, e.target.value)}
                              style={{
                                width: "46px",
                                height: "28px",
                                border: "none",
                                textAlign: "center",
                                fontWeight: 800,
                                fontSize: "0.85rem",
                                color: "#0f172a",
                                outline: "none",
                                padding: "0 4px",
                              }}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => handleStepQty(sz, 5)}
                              style={{
                                width: "24px",
                                height: "28px",
                                border: "none",
                                background: "#f1f5f9",
                                color: "#334155",
                                cursor: "pointer",
                                fontWeight: 700,
                                fontSize: "0.9rem",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                userSelect: "none",
                                padding: 0,
                              }}
                              title="Increase 5 pairs"
                            >
                              +
                            </button>
                          </div>
                          <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
                            prs
                          </span>
                        </div>

                        {/* Dedicated, well-padded X (Remove) button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(sz)}
                          title={`Remove Size ${sz}`}
                          aria-label={`Remove Size ${sz}`}
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "6px",
                            border: "1px solid #fee2e2",
                            background: "#fff1f2",
                            color: "#ef4444",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flexShrink: 0,
                            padding: "5px",
                            transition: "all 0.15s ease",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#fee2e2";
                            e.currentTarget.style.borderColor = "#fca5a5";
                            e.currentTarget.style.color = "#b91c1c";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#fff1f2";
                            e.currentTarget.style.borderColor = "#fee2e2";
                            e.currentTarget.style.color = "#ef4444";
                          }}
                        >
                          <X size={14} strokeWidth={2.4} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Dynamic Batch Summary Badge */}
                  <div
                    style={{
                      marginTop: "10px",
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "0.76rem",
                    }}
                  >
                    <span style={{ color: "#166534", fontWeight: 700 }}>
                      📦 Batch Total: {selectedSizeKeys.length} sizes • {totalBatchPairs.toLocaleString()} pairs
                    </span>
                    <span style={{ color: "#166534", fontWeight: 800, fontSize: "0.82rem" }}>
                      Cost: ₹{totalBatchCost.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="input-group" style={{ marginBottom: "16px" }}>
            <label className="input-label" htmlFor="notes">
              Notes (Optional)
            </label>
            <input
              id="notes"
              type="text"
              className="input-field"
              placeholder="e.g. Supplier, batch, color (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editingPurchase
                ? "Update Purchase"
                : `Save Batch (${totalBatchPairs} pairs)`}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
