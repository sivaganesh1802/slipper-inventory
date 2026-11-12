"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { ISale, IPurchase, IPeriodSummary } from "@/lib/types";
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
  BarChart3,
  Layers,
  ArrowRight,
  RotateCcw,
  Filter,
} from "lucide-react";
import { getTodayDateString } from "@/lib/sampleData";

type FilterType = "all" | "today" | "this_month" | "this_year" | "range" | "month" | "year" | "date";
type ActiveTab = "ledger" | "monthly" | "yearly";

export default function SalesPage() {
  const [sales, setSales] = useState<ISale[]>([]);
  const [monthlySummary, setMonthlySummary] = useState<IPeriodSummary[]>([]);
  const [yearlySummary, setYearlySummary] = useState<IPeriodSummary[]>([]);
  const [purchases, setPurchases] = useState<IPurchase[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab: ledger, monthly, or yearly
  const [activeTab, setActiveTab] = useState<ActiveTab>("ledger");

  // Search and Filter States
  const [searchArtNo, setSearchArtNo] = useState("");
  const [searchCustomer, setSearchCustomer] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(getTodayDateString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(getTodayDateString().slice(0, 4));
  const [selectedDate, setSelectedDate] = useState("");

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [artNo, setArtNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [size, setSize] = useState("");
  const [salesDate, setSalesDate] = useState(getTodayDateString());
  const [salesValue, setSalesValue] = useState<string>("" );
  const [quantity, setQuantity] = useState<string>("1");
  const [notes, setNotes] = useState("");

  const fetchSalesAndStock = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (searchArtNo.trim()) queryParams.set("artNo", searchArtNo.trim());
      if (searchCustomer.trim()) queryParams.set("customerName", searchCustomer.trim());

      const today = getTodayDateString();
      if (filterType === "today") {
        queryParams.set("date", today);
      } else if (filterType === "this_month") {
        queryParams.set("month", today.slice(0, 7));
      } else if (filterType === "this_year") {
        queryParams.set("year", today.slice(0, 4));
      } else if (filterType === "date" && selectedDate) {
        queryParams.set("date", selectedDate);
      } else if (filterType === "range") {
        if (startDate) queryParams.set("startDate", startDate);
        if (endDate) queryParams.set("endDate", endDate);
      } else if (filterType === "month" && selectedMonth) {
        queryParams.set("month", selectedMonth);
      } else if (filterType === "year" && selectedYear) {
        queryParams.set("year", selectedYear);
      }

      const [salesRes, purchasesRes] = await Promise.all([
        fetch(`/api/sales?${queryParams.toString()}`),
        fetch("/api/purchases"),
      ]);

      const salesData = await salesRes.json();
      const purchasesData = await purchasesRes.json();

      if (salesData.success) {
        setSales(salesData.sales || []);
        setMonthlySummary(salesData.monthlySummary || []);
        setYearlySummary(salesData.yearlySummary || []);
      }
      if (purchasesData.success) {
        setPurchases(purchasesData.purchases || []);
      }
    } catch (err) {
      console.error("Error fetching sales:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesAndStock();
  }, [
    searchArtNo,
    searchCustomer,
    filterType,
    startDate,
    endDate,
    selectedMonth,
    selectedYear,
    selectedDate,
  ]);

  const availableArtNos = useMemo(
    () => Array.from(new Set(purchases.map((p) => p.artNo.toUpperCase()))),
    [purchases]
  );

  const availableSizes = useMemo(
    () =>
      purchases
        .filter((p) => p.artNo.toUpperCase() === artNo.toUpperCase())
        .map((p) => ({ size: p.size, remaining: p.remainingStock, cost: p.purchaseValue })),
    [purchases, artNo]
  );

  const currentPurchase = useMemo(
    () =>
      purchases.find((p) => p.artNo.toUpperCase() === artNo.toUpperCase() && p.size === size) ||
      purchases.find((p) => p.artNo.toUpperCase() === artNo.toUpperCase()),
    [purchases, artNo, size]
  );

  const purchaseCost = currentPurchase ? currentPurchase.purchaseValue : 0;
  const numQty = Number(quantity) || 1;
  const numSalesVal = Number(salesValue) || 0;
  const estimatedProfit = (numSalesVal - purchaseCost) * numQty;
  const marginPercent =
    numSalesVal > 0 ? Math.round(((numSalesVal - purchaseCost) / numSalesVal) * 100) : 0;
  const defaultSellingPrice = currentPurchase?.sellingPrice || 0;

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
    const match =
      purchases.find((p) => p.artNo.toUpperCase() === newArt.toUpperCase() && p.remainingStock > 0) ||
      purchases.find((p) => p.artNo.toUpperCase() === newArt.toUpperCase());
    if (match) {
      setSize(match.size);
      if (match.sellingPrice && match.sellingPrice > 0) {
        setSalesValue(String(match.sellingPrice));
      } else if (match.purchaseValue) {
        setSalesValue(String(Math.round(match.purchaseValue * 1.5)));
      }
    }
  };

  const handleSizeChange = (newSize: string) => {
    setSize(newSize);
    const match = purchases.find(
      (p) => p.artNo.toUpperCase() === artNo.toUpperCase() && p.size === newSize
    );
    if (match && match.sellingPrice && match.sellingPrice > 0) {
      setSalesValue(String(match.sellingPrice));
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

  const resetAllFilters = () => {
    setFilterType("all");
    setStartDate("");
    setEndDate("");
    setSelectedDate("");
    setSearchArtNo("");
    setSearchCustomer("");
  };

  // Drill down from monthly/yearly summary directly into ledger
  const drillDownToMonth = (monthStr: string) => {
    setSelectedMonth(monthStr);
    setFilterType("month");
    setActiveTab("ledger");
  };

  const drillDownToYear = (yearStr: string) => {
    setSelectedYear(yearStr);
    setFilterType("year");
    setActiveTab("ledger");
  };

  const totalRevenue = sales.reduce((acc, s) => acc + s.salesValue * s.quantity, 0);
  const totalProfit = sales.reduce((acc, s) => acc + s.profit, 0);
  const totalPairsSold = sales.reduce((acc, s) => acc + s.quantity, 0);

  // Active filter label description
  const activeFilterLabel = useMemo(() => {
    if (filterType === "today") return `Today (${getTodayDateString()})`;
    if (filterType === "this_month") return `This Month (${getTodayDateString().slice(0, 7)})`;
    if (filterType === "this_year") return `This Year (${getTodayDateString().slice(0, 4)})`;
    if (filterType === "range") {
      if (startDate && endDate) return `Range: ${startDate} to ${endDate}`;
      if (startDate) return `From: ${startDate}`;
      if (endDate) return `Until: ${endDate}`;
      return "Custom Date Range";
    }
    if (filterType === "month") return `Month: ${selectedMonth}`;
    if (filterType === "year") return `Year: ${selectedYear}`;
    if (filterType === "date" && selectedDate) return `Date: ${selectedDate}`;
    return "All Time (All records)";
  }, [filterType, startDate, endDate, selectedMonth, selectedYear, selectedDate]);

  const currentYearNum = new Date().getFullYear();
  const availableYears = [
    String(currentYearNum + 1),
    String(currentYearNum),
    String(currentYearNum - 1),
    String(currentYearNum - 2),
    String(currentYearNum - 3),
  ];

  return (
    <div className="animate-fade-in">
      <Header
        title="Sales Management"
        subtitle="Track slipper transactions with full Date Range, Monthly & Yearly analytics"
      />

      {/* KPI Ribbon */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
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
              Total Pairs Sold
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

        <div
          className="glass-card"
          style={{
            padding: "8px 12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: "3px solid #d97706",
            whiteSpace: "nowrap",
            backgroundColor: "#fffbeb",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              backgroundColor: "#fef3c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#d97706",
              flexShrink: 0,
            }}
          >
            <Filter size={14} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: "0.68rem", color: "#92400e", fontWeight: 600, textTransform: "uppercase" }}>
              Active Period
            </div>
            <div
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#78350f",
                lineHeight: 1.2,
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
              title={activeFilterLabel}
            >
              {activeFilterLabel}
            </div>
          </div>
        </div>
      </div>

      {/* Primary Action Bar & Search Inputs */}
      <div
        className="glass-card"
        style={{
          padding: "10px 14px",
          marginBottom: "10px",
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
          <span>Record Sale</span>
        </button>

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
            placeholder="Search Art.No..."
            value={searchArtNo}
            onChange={(e) => setSearchArtNo(e.target.value)}
            style={{ paddingLeft: "28px", paddingRight: "6px" }}
          />
        </div>

        <div style={{ flex: "1 1 200px", position: "relative", minWidth: "150px" }}>
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

        {(searchArtNo || searchCustomer || filterType !== "all") && (
          <button
            onClick={resetAllFilters}
            className="btn btn-secondary btn-sm"
            style={{ flexShrink: 0, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px" }}
            title="Reset all search and date filters"
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        )}
      </div>

      {/* Date Range & Period Filter Bar */}
      <div
        className="glass-card"
        style={{
          padding: "8px 12px",
          marginBottom: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          flexWrap: "wrap",
          background: "#faf9f6",
        }}
      >
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#475569", marginRight: "4px" }}>
          Filter By:
        </span>

        {/* Quick Filter Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "5px", flexWrap: "wrap" }}>
          <button
            type="button"
            className={`filter-chip-tab ${filterType === "all" ? "is-active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Time
          </button>
          <button
            type="button"
            className={`filter-chip-tab ${filterType === "today" ? "is-active" : ""}`}
            onClick={() => setFilterType("today")}
          >
            Today
          </button>
          <button
            type="button"
            className={`filter-chip-tab ${filterType === "this_month" ? "is-active" : ""}`}
            onClick={() => setFilterType("this_month")}
          >
            This Month
          </button>
          <button
            type="button"
            className={`filter-chip-tab ${filterType === "this_year" ? "is-active" : ""}`}
            onClick={() => setFilterType("this_year")}
          >
            This Year
          </button>
          <button
            type="button"
            className={`filter-chip-tab ${filterType === "range" ? "is-active" : ""}`}
            onClick={() => setFilterType("range")}
          >
            📅 Date Range
          </button>
          <button
            type="button"
            className={`filter-chip-tab ${filterType === "month" ? "is-active" : ""}`}
            onClick={() => setFilterType("month")}
          >
            📆 By Month
          </button>
          <button
            type="button"
            className={`filter-chip-tab ${filterType === "year" ? "is-active" : ""}`}
            onClick={() => setFilterType("year")}
          >
            📈 By Year
          </button>
          <button
            type="button"
            className={`filter-chip-tab ${filterType === "date" ? "is-active" : ""}`}
            onClick={() => setFilterType("date")}
          >
            Specific Date
          </button>
        </div>

        {/* Dynamic Controls based on selected filter type */}
        {filterType === "range" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginLeft: "auto",
              flexWrap: "wrap",
              background: "#ffffff",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b" }}>From:</span>
            <input
              type="date"
              className="input-field"
              style={{ width: "135px", padding: "4px 6px", fontSize: "0.75rem" }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b" }}>To:</span>
            <input
              type="date"
              className="input-field"
              style={{ width: "135px", padding: "4px 6px", fontSize: "0.75rem" }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                }}
                className="btn btn-secondary btn-sm"
                style={{ padding: "3px 7px", fontSize: "0.7rem" }}
              >
                Clear
              </button>
            )}
          </div>
        )}

        {filterType === "month" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginLeft: "auto",
              background: "#ffffff",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b" }}>Select Month:</span>
            <input
              type="month"
              className="input-field"
              style={{ width: "150px", padding: "4px 6px", fontSize: "0.75rem" }}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </div>
        )}

        {filterType === "year" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginLeft: "auto",
              background: "#ffffff",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b" }}>Select Year:</span>
            <select
              className="input-field"
              style={{ width: "110px", padding: "4px 6px", fontSize: "0.75rem" }}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        )}

        {filterType === "date" && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginLeft: "auto",
              background: "#ffffff",
              padding: "4px 8px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
            }}
          >
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b" }}>Pick Date:</span>
            <input
              type="date"
              className="input-field"
              style={{ width: "135px", padding: "4px 6px", fontSize: "0.75rem" }}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            {selectedDate && (
              <button
                onClick={() => setSelectedDate("")}
                className="btn btn-secondary btn-sm"
                style={{ padding: "3px 7px", fontSize: "0.7rem" }}
              >
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main View Tabs (Ledger, Monthly Breakdown, Yearly Breakdown) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "12px",
          borderBottom: "2px solid #e2e8f0",
          paddingBottom: "4px",
        }}
      >
        <button
          onClick={() => setActiveTab("ledger")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            fontSize: "0.82rem",
            fontWeight: 700,
            background: "none",
            border: "none",
            cursor: "pointer",
            borderBottom: activeTab === "ledger" ? "3px solid #0f172a" : "3px solid transparent",
            color: activeTab === "ledger" ? "#0f172a" : "#64748b",
            transition: "all 0.15s ease",
          }}
        >
          <Layers size={15} />
          <span>Detailed Ledger</span>
          <span
            style={{
              fontSize: "0.68rem",
              padding: "2px 6px",
              borderRadius: "999px",
              backgroundColor: activeTab === "ledger" ? "#0f172a" : "#e2e8f0",
              color: activeTab === "ledger" ? "#ffffff" : "#475569",
            }}
          >
            {sales.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("monthly")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            fontSize: "0.82rem",
            fontWeight: 700,
            background: "none",
            border: "none",
            cursor: "pointer",
            borderBottom: activeTab === "monthly" ? "3px solid #0f172a" : "3px solid transparent",
            color: activeTab === "monthly" ? "#0f172a" : "#64748b",
            transition: "all 0.15s ease",
          }}
        >
          <Calendar size={15} />
          <span>Monthly Breakdown</span>
          <span
            style={{
              fontSize: "0.68rem",
              padding: "2px 6px",
              borderRadius: "999px",
              backgroundColor: activeTab === "monthly" ? "#0f172a" : "#e2e8f0",
              color: activeTab === "monthly" ? "#ffffff" : "#475569",
            }}
          >
            {monthlySummary.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("yearly")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 14px",
            fontSize: "0.82rem",
            fontWeight: 700,
            background: "none",
            border: "none",
            cursor: "pointer",
            borderBottom: activeTab === "yearly" ? "3px solid #0f172a" : "3px solid transparent",
            color: activeTab === "yearly" ? "#0f172a" : "#64748b",
            transition: "all 0.15s ease",
          }}
        >
          <BarChart3 size={15} />
          <span>Yearly Breakdown</span>
          <span
            style={{
              fontSize: "0.68rem",
              padding: "2px 6px",
              borderRadius: "999px",
              backgroundColor: activeTab === "yearly" ? "#0f172a" : "#e2e8f0",
              color: activeTab === "yearly" ? "#ffffff" : "#475569",
            }}
          >
            {yearlySummary.length}
          </span>
        </button>
      </div>

      {/* TAB 1: DETAILED SALES LEDGER */}
      {activeTab === "ledger" && (
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
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "24px", color: "#475569", fontWeight: 600 }}>
                    No sales found for the selected filter. Click &quot;+ Record Sale&quot; or reset your filters!
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
                      <span
                        style={{
                          padding: "2px 7px",
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderRadius: "4px",
                          fontWeight: 800,
                          color: "#0f172a",
                        }}
                      >
                        {sale.size}
                      </span>
                    </td>

                    <td style={{ fontWeight: 700, color: "#0f172a" }}>
                      {sale.quantity} pair{sale.quantity > 1 ? "s" : ""}
                    </td>

                    <td>
                      <span style={{ fontWeight: 800, color: "#0f172a" }}>
                        ₹{sale.salesValue * sale.quantity}
                      </span>
                    </td>

                    <td style={{ color: "#475569", fontWeight: 600 }}>
                      ₹{sale.purchaseValue * sale.quantity}
                    </td>

                    <td>
                      <span className="badge badge-emerald">+₹{sale.profit}</span>
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
      )}

      {/* TAB 2: MONTHLY BREAKDOWN */}
      {activeTab === "monthly" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Monthly Summary Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "12px",
            }}
          >
            {monthlySummary.map((m) => (
              <div
                key={m.period}
                className="glass-card"
                style={{
                  padding: "12px 14px",
                  borderTop: "3px solid #0284c7",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                    {m.label}
                  </div>
                  <span className="badge badge-cyan" style={{ fontSize: "0.68rem" }}>
                    {m.transactionCount} sale{m.transactionCount > 1 ? "s" : ""}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginTop: "4px" }}>
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>Pairs Sold</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                      {m.totalPairs} pairs
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>Turnover</div>
                    <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0284c7" }}>
                      ₹{m.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "6px",
                    paddingTop: "6px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "#059669", fontWeight: 700 }}>
                      Profit: +₹{m.totalProfit.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "0.66rem", color: "#64748b" }}>Margin: {m.profitMargin}%</div>
                  </div>
                  <button
                    onClick={() => drillDownToMonth(m.period)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "3px 7px", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "3px" }}
                    title="View all transactions in this month"
                  >
                    <span>View Ledger</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Monthly Detailed Summary Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Orders Count</th>
                  <th>Pairs Sold</th>
                  <th>Turnover (Revenue)</th>
                  <th>Total Cost</th>
                  <th>Net Profit</th>
                  <th>Profit Margin</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                      Calculating monthly data...
                    </td>
                  </tr>
                ) : monthlySummary.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                      No monthly records available for the selected period.
                    </td>
                  </tr>
                ) : (
                  monthlySummary.map((m) => (
                    <tr key={m.period}>
                      <td>
                        <div style={{ fontWeight: 800, color: "#0f172a" }}>{m.label}</div>
                        <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{m.period}</div>
                      </td>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>{m.transactionCount}</td>
                      <td style={{ fontWeight: 800, color: "#0f172a" }}>{m.totalPairs} pairs</td>
                      <td style={{ fontWeight: 800, color: "#0284c7" }}>₹{m.totalRevenue.toLocaleString()}</td>
                      <td style={{ color: "#64748b", fontWeight: 600 }}>₹{m.totalCost.toLocaleString()}</td>
                      <td>
                        <span className="badge badge-emerald">+₹{m.totalProfit.toLocaleString()}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor: m.profitMargin >= 30 ? "#dcfce7" : "#fef3c7",
                            color: m.profitMargin >= 30 ? "#15803d" : "#b45309",
                          }}
                        >
                          {m.profitMargin}%
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => drillDownToMonth(m.period)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "3px 8px", fontSize: "0.72rem" }}
                        >
                          Filter Month
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: YEARLY BREAKDOWN */}
      {activeTab === "yearly" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Yearly Summary Cards Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              gap: "12px",
            }}
          >
            {yearlySummary.map((y) => (
              <div
                key={y.period}
                className="glass-card"
                style={{
                  padding: "14px 16px",
                  borderTop: "3px solid #059669",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f172a" }}>
                    Year {y.label}
                  </div>
                  <span className="badge badge-emerald" style={{ fontSize: "0.7rem" }}>
                    {y.transactionCount} transactions
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "6px" }}>
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>Total Pairs</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                      {y.totalPairs}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>Annual Revenue</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0284c7" }}>
                      ₹{y.totalRevenue.toLocaleString()}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "8px",
                    paddingTop: "8px",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#059669", fontWeight: 800 }}>
                      Annual Profit: +₹{y.totalProfit.toLocaleString()}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Margin: {y.profitMargin}%</div>
                  </div>
                  <button
                    onClick={() => drillDownToYear(y.period)}
                    className="btn btn-secondary btn-sm"
                    style={{ padding: "4px 8px", fontSize: "0.72rem", display: "flex", alignItems: "center", gap: "3px" }}
                    title="View all transactions in this year"
                  >
                    <span>View Ledger</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Yearly Detailed Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Year</th>
                  <th>Orders Count</th>
                  <th>Pairs Sold</th>
                  <th>Turnover (Revenue)</th>
                  <th>Total Cost</th>
                  <th>Net Profit</th>
                  <th>Profit Margin</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "20px" }}>
                      Calculating annual data...
                    </td>
                  </tr>
                ) : yearlySummary.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "20px", color: "#64748b" }}>
                      No yearly records available.
                    </td>
                  </tr>
                ) : (
                  yearlySummary.map((y) => (
                    <tr key={y.period}>
                      <td style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>{y.period}</td>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>{y.transactionCount}</td>
                      <td style={{ fontWeight: 800, color: "#0f172a" }}>{y.totalPairs} pairs</td>
                      <td style={{ fontWeight: 800, color: "#0284c7" }}>₹{y.totalRevenue.toLocaleString()}</td>
                      <td style={{ color: "#64748b", fontWeight: 600 }}>₹{y.totalCost.toLocaleString()}</td>
                      <td>
                        <span className="badge badge-emerald">+₹{y.totalProfit.toLocaleString()}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            backgroundColor: y.profitMargin >= 30 ? "#dcfce7" : "#fef3c7",
                            color: y.profitMargin >= 30 ? "#15803d" : "#b45309",
                          }}
                        >
                          {y.profitMargin}%
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => drillDownToYear(y.period)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: "3px 8px", fontSize: "0.72rem" }}
                        >
                          Filter Year
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
              Which Art.No is Sold? *
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
                  onChange={(e) => handleSizeChange(e.target.value)}
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
                  onChange={(e) => handleSizeChange(e.target.value)}
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
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "3px",
                }}
              >
                <label className="input-label" htmlFor="salesValue" style={{ marginBottom: 0 }}>
                  Selling Price (₹) *
                </label>
                {defaultSellingPrice > 0 && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: "#0284c7",
                      background: "#e0f2fe",
                      padding: "1px 5px",
                      borderRadius: "3px",
                      fontWeight: 700,
                    }}
                    title="Pre-filled from Purchase. Editable for customer negotiations."
                  >
                    Default: ₹{defaultSellingPrice} (Editable)
                  </span>
                )}
              </div>
              <input
                id="salesValue"
                type="number"
                step="any"
                className="input-field"
                placeholder={defaultSellingPrice ? String(defaultSellingPrice) : "299"}
                value={salesValue}
                onChange={(e) => setSalesValue(e.target.value)}
                required
              />
              {defaultSellingPrice > 0 && numSalesVal > 0 && numSalesVal !== defaultSellingPrice && (
                <div
                  style={{
                    fontSize: "0.68rem",
                    color: numSalesVal < defaultSellingPrice ? "#b45309" : "#15803d",
                    fontWeight: 600,
                    marginTop: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  {numSalesVal < defaultSellingPrice ? (
                    <span>🤝 Negotiated: -₹{(defaultSellingPrice - numSalesVal).toFixed(0)}/pair off default</span>
                  ) : (
                    <span>📈 Premium: +₹{(numSalesVal - defaultSellingPrice).toFixed(0)}/pair over default</span>
                  )}
                </div>
              )}
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