"use client";

import React, { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { ISale, IPurchase } from "@/lib/types";
import {
  ShoppingCart,
  Plus,
  Search,
  TrendingUp,
  Calendar,
  AlertCircle,
  DollarSign,
  Trash2,
  CheckCircle2,
} from "lucide-react";
import { getTodayDateString } from "@/lib/sampleData";

export default function SalesPage() {
  const [sales, setSales] = useState<ISale[]>([]);
  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchArtNo, setSearchArtNo] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form Fields requested by user - start clean
  const [artNo, setArtNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [size, setSize] = useState("");
  const [salesDate, setSalesDate] = useState(getTodayDateString());
  const [salesValue, setSalesValue] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [notes, setNotes] = useState("");

  const fetchSalesAndStock = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (searchArtNo.trim()) queryParams.set("artNo", searchArtNo.trim());
      if (searchCustomer.trim()) queryParams.set("customerName", searchCustomer.trim());
      if (selectedDate) queryParams.set("date", selectedDate);

      const [salesRes, purchasesRes] = await Promise.all([
        fetch(`/api/sales?${queryParams.toString()}`),
        fetch("/api/purchases"),
      ]);

      const salesData = await salesRes.json();
      const purchasesData = await purchasesRes.json();

      if (salesData.success) setSales(salesData.sales);
      if (purchasesData.success) setPurchases(purchasesData.purchases);
    } catch (err) {
      console.error("Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesAndStock();
  }, [searchArtNo, searchCustomer, selectedDate]);

  const availableArtNos = Array.from(new Set(purchases.map((p) => p.artNo.toUpperCase())));

  const availableSizes = purchases
    .filter((p) => p.artNo.toUpperCase() === artNo.toUpperCase())
    .map((p) => ({ size: p.size, remaining: p.remainingStock, cost: p.purchaseValue }));

  const currentPurchase = purchases.find(
    (p) => p.artNo.toUpperCase() === artNo.toUpperCase() && p.size === size
  ) || purchases.find((p) => p.artNo.toUpperCase() === artNo.toUpperCase());

  const purchaseCost = currentPurchase ? currentPurchase.purchaseValue : 0;
  const numQty = Number(quantity) || 1;
  const numSalesVal = Number(salesValue) || 0;
  const estimatedProfit = (numSalesVal - purchaseCost) * numQty;
  const marginPercent = numSalesVal > 0 ? Math.round(((numSalesVal - purchaseCost) / numSalesVal) * 100) : 0;

  const handleOpenAddModal = () => {
    setArtNo("");
    setSize("");
    setCustomerName("");
    setSalesDate(getTodayDateString());
    setSalesValue("");
    setQuantity("1");
    setNotes("");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleArtNoSelect = (newArt: string) => {
    setArtNo(newArt);
    const match = purchases.find((p) => p.artNo.toUpperCase() === newArt.toUpperCase() && p.remainingStock > 0);
    if (match) {
      setSize(match.size);
      if (!salesValue) {
        setSalesValue(String(Math.round(match.purchaseValue * 1.6)));
      }
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!artNo.trim()) {
      setFormError("Art.No is required");
      return;
    }
    if (!customerName.trim()) {
      setFormError("Customer name is required");
      return;
    }
    if (!size.trim()) {
      setFormError("Size is required");
      return;
    }
    if (isNaN(numSalesVal) || numSalesVal <= 0) {
      setFormError("Valid sales value is required");
      return;
    }
    if (isNaN(numQty) || numQty <= 0) {
      setFormError("Quantity must be at least 1");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artNo: artNo.toUpperCase().trim(),
          customerName: customerName.trim(),
          size: size.trim(),
          salesDate,
          salesValue: numSalesVal,
          purchaseValue: purchaseCost,
          quantity: numQty,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record sale");
      }

      setIsModalOpen(false);
      fetchSalesAndStock();
    } catch (err: unknown) {
      setFormError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, customer: string) => {
    if (!confirm(`Delete sale record for ${customer}?`)) return;

    try {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) fetchSalesAndStock();
      else alert(data.error || "Failed to delete");
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const totalRevenue = sales.reduce((acc, s) => acc + s.salesValue * s.quantity, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  const totalPairsSold = sales.reduce((acc, s) => acc + s.quantity, 0);

  return (
    <div className="animate-fade-in">
      <Header
        title="Sales Management"
        subtitle="Record slipper customer sales, track which Art.No is sold, and realize instant profit"
      />

      {/* KPI Ribbon */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: "3px solid #4f46e5",
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              backgroundColor: "#ede9fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#4f46e5",
              flexShrink: 0,
            }}
          >
            <ShoppingCart size={15} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: "0.68rem", color: "#475569", fontWeight: 600, textTransform: "uppercase" }}>
              Total Pairs Saled
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
              {totalPairsSold} <span style={{ fontSize: "0.72rem", color: "#64748b" }}>pairs</span>
            </div>
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: "3px solid #0284c7",
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              backgroundColor: "#e0f2fe",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0284c7",
              flexShrink: 0,
            }}
          >
            <DollarSign size={15} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: "0.68rem", color: "#475569", fontWeight: 600, textTransform: "uppercase" }}>
              Total Turnover
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0284c7", lineHeight: 1.1 }}>
              ₹{totalRevenue.toLocaleString()}
            </div>
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: "3px solid #059669",
            backgroundColor: "#f0fdf4 !important",
            whiteSpace: "nowrap",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              backgroundColor: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#059669",
              flexShrink: 0,
            }}
          >
            <TrendingUp size={15} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: "0.68rem", color: "#047857", fontWeight: 600, textTransform: "uppercase" }}>
              Realized Profit
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669", lineHeight: 1.1 }}>
              +₹{totalProfit.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar & Filters */}
      <div
        className="glass-card"
        style={{
          padding: "10px 14px",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexWrap: "nowrap",
          overflowX: "auto",
        }}
      >
        <button
          onClick={handleOpenAddModal}
          className="btn btn-emerald btn-sm"
          style={{ flexShrink: 0, whiteSpace: "nowrap" }}
        >
          <Plus size={15} />
          <span>+ Record Sale</span>
        </button>

        <div style={{ flex: "1 1 160px", position: "relative", minWidth: "130px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search Art.No..."
            value={searchArtNo}
            onChange={(e) => setSearchArtNo(e.target.value)}
            style={{ paddingLeft: "28px", paddingRight: "6px" }}
          />
        </div>

        <div style={{ flex: "1 1 180px", position: "relative", minWidth: "140px" }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search Customer..."
            value={searchCustomer}
            onChange={(e) => setSearchCustomer(e.target.value)}
            style={{ paddingLeft: "28px", paddingRight: "6px" }}
          />
        </div>

        <input
          type="date"
          className="input-field"
          style={{ width: "auto", minWidth: "130px", flexShrink: 0 }}
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        {selectedDate && (
          <button
            onClick={() => setSelectedDate("")}
            className="btn btn-secondary btn-sm"
            style={{ flexShrink: 0, whiteSpace: "nowrap" }}
          >
            Clear Date
          </button>
        )}
      </div>

      {/* Sales Ledger Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Art.No</th>
              <th>Customer Name</th>
              <th>Size</th>
              <th>Qty</th>
              <th>Sales Value</th>
              <th>Cost Price</th>
              <th>Net Profit</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "24px", color: "#475569", fontWeight: 600 }}>
                  Loading sales from database...
                </td>
              </tr>
            ) : sales.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "24px", color: "#475569", fontWeight: 600 }}>
                  No sales recorded. Click &quot;+ Record Sale&quot; to add one!
                </td>
              </tr>
            ) : (
              sales.map((sale) => (
                <tr key={sale._id}>
                  <td style={{ color: "#0f172a", fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={12} style={{ color: "#64748b" }} />
                      <span>{sale.salesDate}</span>
                    </div>
                  </td>

                  <td>
                    <span className="badge badge-cyan">{sale.artNo}</span>
                  </td>

                  <td>
                    <span style={{ fontWeight: 700, color: "#0f172a" }}>{sale.customerName}</span>
                    {sale.notes && (
                      <span style={{ fontSize: "0.7rem", color: "#475569", marginLeft: "6px" }}>
                        ({sale.notes})
                      </span>
                    )}
                  </td>

                  <td>
                    <span style={{ padding: "2px 7px", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "4px", fontWeight: 800, color: "#0f172a" }}>
                      {sale.size}
                    </span>
                  </td>

                  <td style={{ fontWeight: 700, color: "#0f172a" }}>{sale.quantity} pair{sale.quantity > 1 ? "s" : ""}</td>

                  <td>
                    <span style={{ fontWeight: 800, color: "#0f172a" }}>
                      ₹{sale.salesValue * sale.quantity}
                    </span>
                  </td>

                  <td style={{ color: "#475569", fontWeight: 600 }}>
                    ₹{sale.purchaseValue * sale.quantity}
                  </td>

                  <td>
                    <span className="badge badge-emerald">
                      +₹{sale.profit}
                    </span>
                  </td>

                  <td>
                    <button
                      onClick={() => handleDelete(sale._id, sale.customerName)}
                      title="Delete sale"
                      className="btn btn-danger btn-sm"
                      style={{ padding: "3px 6px" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Sale Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Slipper Sale"
        subtitle="Record which Art.No is sold, buyer details, and compute net profit"
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
            <label className="input-label" htmlFor="artNoSelect">
              Which Art.No is Saled? *
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              <select
                id="artNoSelect"
                className="input-field"
                value={artNo}
                onChange={(e) => handleArtNoSelect(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">-- Select Art.No --</option>
                {availableArtNos.map((art) => (
                  <option key={art} value={art}>
                    {art}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="input-field"
                placeholder="Or custom"
                value={artNo}
                onChange={(e) => setArtNo(e.target.value.toUpperCase())}
                style={{ width: "120px", textTransform: "uppercase" }}
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="customerName">
              Customer Name *
            </label>
            <input
              id="customerName"
              type="text"
              className="input-field"
              placeholder="e.g. Rajesh Kumar"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="input-group">
              <label className="input-label" htmlFor="saleSize">
                Size *
              </label>
              {availableSizes.length > 0 ? (
                <select
                  id="saleSize"
                  className="input-field"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                >
                  {availableSizes.map((s, i) => (
                    <option key={i} value={s.size}>
                      Size {s.size} ({s.remaining} left)
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="saleSize"
                  type="text"
                  className="input-field"
                  placeholder="8"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="salesDate">
                Sales Date *
              </label>
              <input
                id="salesDate"
                type="date"
                className="input-field"
                value={salesDate}
                onChange={(e) => setSalesDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            <div className="input-group">
              <label className="input-label" htmlFor="salesValue">
                Selling Price (₹) *
              </label>
              <input
                id="salesValue"
                type="number"
                step="any"
                className="input-field"
                placeholder="299"
                value={salesValue}
                onChange={(e) => setSalesValue(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="saleQuantity">
                Quantity (Pairs) *
              </label>
              <input
                id="saleQuantity"
                type="number"
                min="1"
                className="input-field"
                placeholder="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Profit Preview */}
          <div
            style={{
              padding: "10px 12px",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "var(--radius-sm)",
              marginBottom: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              whiteSpace: "nowrap",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <CheckCircle2 size={14} style={{ color: "#059669" }} />
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#047857" }}>
                  Estimated Profit
                </span>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "2px" }}>
                Cost: ₹{purchaseCost} | Selling: ₹{numSalesVal} ({marginPercent}%)
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#059669" }}>
                +₹{estimatedProfit}
              </div>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: "16px" }}>
            <label className="input-label" htmlFor="saleNotes">
              Notes (Optional)
            </label>
            <input
              id="saleNotes"
              type="text"
              className="input-field"
              placeholder="UPI / Cash"
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
              className="btn btn-emerald btn-sm"
              disabled={submitting}
            >
              {submitting ? "Recording..." : "Record Sale"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
