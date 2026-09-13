"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { IDashboardSummary } from "@/lib/types";
import {
  Footprints,
  DollarSign,
  TrendingUp,
  Package,
  ArrowUpRight,
  PlusCircle,
  Search,
  ShoppingCart,
  Calendar,
  ChevronRight,
} from "lucide-react";

export default function DashboardPage() {
  const [data, setData] = useState<IDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/summary");
      if (!res.ok) throw new Error("Failed to load dashboard data");
      const json = await res.json();
      if (json.success) setData(json.summary);
    } catch (err: unknown) {
      setError((err as Error).message || "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <Header title="Business Dashboard" subtitle="Loading live inventory and sales performance..." />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="glass-card"
              style={{ height: "54px", backgroundColor: "#ffffff" }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div>
        <Header title="Business Dashboard" subtitle="Error loading data" />
        <div className="glass-card" style={{ padding: "16px", textAlign: "center" }}>
          <p style={{ color: "#e11d48", marginBottom: "8px", fontSize: "0.82rem" }}>
            {error || "Unable to load dashboard data"}
          </p>
          <button onClick={fetchDashboard} className="btn btn-primary btn-sm">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const maxSales = Math.max(...data.last7Days.map((d) => Math.max(d.sales, d.profit, 100)), 500);

  return (
    <div className="animate-fade-in">
      <Header
        title="Business Dashboard"
        subtitle="Daily slipper sales volume, gross revenue & net profit"
      />

      {/* Quick Action Ribbon */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          gap: "8px",
          marginBottom: "12px",
          padding: "7px 12px",
          background: "#ffffff",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-xs)",
          overflowX: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, whiteSpace: "nowrap" }}>
          <Calendar size={14} style={{ color: "#0284c7", flexShrink: 0 }} />
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
            Today&apos;s Store Metrics
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, whiteSpace: "nowrap" }}>
          <Link href="/sales" className="btn btn-emerald btn-sm" style={{ padding: "4px 9px", fontSize: "0.75rem" }}>
            <ShoppingCart size={13} />
            <span>Record Sale</span>
          </Link>
          <Link href="/purchases" className="btn btn-primary btn-sm" style={{ padding: "4px 9px", fontSize: "0.75rem" }}>
            <PlusCircle size={13} />
            <span>Add Stock</span>
          </Link>
          <Link href="/search" className="btn btn-secondary btn-sm" style={{ padding: "4px 9px", fontSize: "0.75rem" }}>
            <Search size={13} />
            <span>Price Lookup</span>
          </Link>
        </div>
      </div>

      {/* Ultra-Compact KPI Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        {/* Metric 1: Today's Slippers Sold */}
        <div
          className="glass-card"
          style={{
            padding: "8px 12px",
            borderLeft: "3px solid #0284c7",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              backgroundColor: "#e0f2fe",
              color: "#0284c7",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Footprints size={15} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#475569", textTransform: "uppercase" }}>
              Today&apos;s Sold
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
              {data.todaySlippersSold} <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b" }}>pairs</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Today's Sales Amount */}
        <div
          className="glass-card"
          style={{
            padding: "8px 12px",
            borderLeft: "3px solid #4f46e5",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              backgroundColor: "#ede9fe",
              color: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <DollarSign size={15} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#475569", textTransform: "uppercase" }}>
              Today&apos;s Sales
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
              ₹{data.todaySalesAmount.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Metric 3: Today's Profit */}
        <div
          className="glass-card"
          style={{
            padding: "8px 12px",
            borderLeft: "3px solid #059669",
            backgroundColor: "#f0fdf4 !important",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              backgroundColor: "#d1fae5",
              color: "#059669",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <TrendingUp size={15} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#047857", textTransform: "uppercase" }}>
              Today&apos;s Profit
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669", lineHeight: 1.1 }}>
              +₹{data.todayProfit.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Metric 4: Stock in Warehouse */}
        <div
          className="glass-card"
          style={{
            padding: "8px 12px",
            borderLeft: "3px solid #d97706",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "4px",
              backgroundColor: "#fef3c7",
              color: "#d97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Package size={15} />
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#475569", textTransform: "uppercase" }}>
              Remaining Stock
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
              {data.totalInventoryPairs} <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b" }}>pairs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Grid: 7-Day Performance & Top Models */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "10px",
          marginBottom: "12px",
        }}
      >
        {/* 7-Day Trend Chart */}
        <div className="glass-card" style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", whiteSpace: "nowrap" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
                7-Day Sales & Profit Trends
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.7rem", whiteSpace: "nowrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#4f46e5", fontWeight: 600 }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: "#4f46e5" }} />
                Sales
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: "3px", color: "#059669", fontWeight: 600 }}>
                <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: "#059669" }} />
                Profit
              </span>
            </div>
          </div>

          <div style={{ width: "100%", height: "100px", display: "flex", alignItems: "flex-end", gap: "8px", paddingTop: "6px" }}>
            {data.last7Days.map((day, idx) => {
              const salesHeight = Math.max(5, Math.round((day.sales / maxSales) * 80));
              const profitHeight = Math.max(3, Math.round((day.profit / maxSales) * 80));
              const isToday = idx === data.last7Days.length - 1;

              return (
                <div
                  key={day.date}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "4px",
                    height: "100%",
                    justifyContent: "flex-end",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-end", gap: "2px", width: "100%", justifyContent: "center" }}>
                    <div
                      title={`Sales: ₹${day.sales}`}
                      style={{
                        width: "44%",
                        maxWidth: "12px",
                        height: `${salesHeight}px`,
                        backgroundColor: isToday ? "#4f46e5" : "#c7d2fe",
                        borderRadius: "2px 2px 0 0",
                      }}
                    />
                    <div
                      title={`Profit: ₹${day.profit}`}
                      style={{
                        width: "44%",
                        maxWidth: "12px",
                        height: `${profitHeight}px`,
                        backgroundColor: isToday ? "#059669" : "#a7f3d0",
                        borderRadius: "2px 2px 0 0",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: "0.65rem",
                      color: isToday ? "#0284c7" : "#64748b",
                      fontWeight: isToday ? 700 : 500,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {isToday ? "Today" : day.displayDate.split(",")[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Selling Slipper Models */}
        <div className="glass-card" style={{ padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", whiteSpace: "nowrap" }}>
            <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
              Top Selling Models
            </div>
            <Link
              href="/search"
              style={{
                fontSize: "0.72rem",
                color: "#0284c7",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: "2px",
                fontWeight: 600,
                whiteSpace: "nowrap",
              }}
            >
              <span>View all</span>
              <ChevronRight size={12} />
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {data.topArtNos.length === 0 ? (
              <p style={{ color: "#64748b", fontSize: "0.75rem" }}>No sales recorded yet</p>
            ) : (
              data.topArtNos.slice(0, 3).map((item, idx) => (
                <div
                  key={item.artNo}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "5px 8px",
                    background: "#f8fafc",
                    borderRadius: "4px",
                    border: "1px solid var(--border-subtle)",
                    whiteSpace: "nowrap",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, overflow: "hidden" }}>
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "3px",
                        backgroundColor: idx === 0 ? "#fef3c7" : "#e2e8f0",
                        color: idx === 0 ? "#b45309" : "#475569",
                        fontSize: "0.68rem",
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: "#0f172a",
                          fontSize: "0.78rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.artNo}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "#64748b", marginLeft: "6px" }}>
                        ({item.soldPairs} sold)
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", flexShrink: 0, whiteSpace: "nowrap" }}>
                    <span style={{ color: "#059669", fontWeight: 700, fontSize: "0.78rem" }}>
                      +₹{item.totalProfit.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Sales Ledger */}
      <div className="glass-card" style={{ padding: "12px 14px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "8px",
            whiteSpace: "nowrap",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>
            Recent Sales Orders
          </div>
          <Link
            href="/sales"
            className="btn btn-secondary btn-sm"
            style={{ padding: "3px 8px", fontSize: "0.72rem", whiteSpace: "nowrap" }}
          >
            <span>Full Ledger</span>
            <ArrowUpRight size={11} />
          </Link>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Art.No</th>
                <th>Customer</th>
                <th>Size</th>
                <th>Qty</th>
                <th>Sales Value</th>
                <th>Cost Price</th>
                <th>Profit Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.recentSales.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "16px", color: "#64748b" }}>
                    No sales recorded yet. Click &quot;Record Sale&quot; to begin!
                  </td>
                </tr>
              ) : (
                data.recentSales.map((sale) => (
                  <tr key={sale._id}>
                    <td style={{ color: "#475569" }}>{sale.salesDate}</td>
                    <td>
                      <span className="badge badge-cyan">{sale.artNo}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: "#0f172a" }}>{sale.customerName}</td>
                    <td>
                      <span style={{ padding: "1px 5px", background: "#f1f5f9", borderRadius: "3px", fontWeight: 700, color: "#0f172a" }}>
                        {sale.size}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>{sale.quantity} pair{sale.quantity > 1 ? "s" : ""}</td>
                    <td style={{ fontWeight: 700, color: "#0f172a" }}>
                      ₹{sale.salesValue * sale.quantity}
                    </td>
                    <td style={{ color: "#64748b" }}>₹{sale.purchaseValue * sale.quantity}</td>
                    <td>
                      <span className="badge badge-emerald">
                        +₹{sale.profit}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
