"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { IProductSearchResult } from "@/lib/db";
import {
  Search,
  Tag,
  Footprints,
  TrendingUp,
  DollarSign,
  Sparkles,
} from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<IProductSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async (searchQuery: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) setProducts(data.products);
    } catch (err) {
      console.error("Error searching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="animate-fade-in">
      <Header
        title="Product & Price Finder"
        subtitle="Search slipper models by Art.No to inspect purchase cost, selling price, and stock levels"
      />

      {/* Compact Search Bar */}
      <div
        className="glass-card"
        style={{
          padding: "14px 16px",
          marginBottom: "16px",
        }}
      >
        <div style={{ position: "relative", marginBottom: "8px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-muted)",
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search Art.No (e.g. SLIP-AIR-901, ART-LITE, 550) or size..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              paddingLeft: "36px",
              fontSize: "0.875rem",
              paddingTop: "9px",
              paddingBottom: "9px",
            }}
            autoFocus
          />
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            flexWrap: "nowrap",
            overflowX: "auto",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", flexShrink: 0 }}>Quick:</span>
          {["SLIP-AIR-901", "ART-LITE-305", "ROYAL-ORTO-550", "URBAN-LEATHER-70", "KIDS-CARTOON-12"].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setQuery(sample)}
              style={{
                background: "#f1f5f9",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-full)",
                color: "var(--text-secondary)",
                padding: "2px 8px",
                fontSize: "0.72rem",
                cursor: "pointer",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {sample}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <div style={{ marginBottom: "12px", fontSize: "0.78rem", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
        Found <strong style={{ color: "#0f172a" }}>{products.length}</strong> slipper models
      </div>

      {/* Product Cards Grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card" style={{ height: "180px", backgroundColor: "#ffffff" }} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="glass-card" style={{ padding: "32px", textAlign: "center" }}>
          <Footprints size={32} style={{ color: "var(--text-muted)", margin: "0 auto 10px auto" }} />
          <h3 style={{ fontSize: "0.95rem", color: "#0f172a", marginBottom: "4px" }}>
            No Slipper Product Found
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", marginBottom: "12px" }}>
            No slipper matches &quot;{query}&quot;.
          </p>
          <Link href="/purchases" className="btn btn-primary btn-sm">
            Add This Slipper
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "14px",
          }}
        >
          {products.map((p) => {
            const isOutOfStock = p.totalRemainingStock <= 0;
            const profitPerPair = p.latestSalesValue - p.latestPurchaseValue;

            return (
              <div
                key={p.artNo}
                className="glass-card"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Visual Thumbnail Bar */}
                <div
                  style={{
                    height: "70px",
                    background: "#f8fafc",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderBottom: "1px solid var(--border-subtle)",
                  }}
                >
                  {p.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.image}
                      alt={p.artNo}
                      style={{ maxHeight: "80%", maxWidth: "80%", objectFit: "contain" }}
                    />
                  ) : (
                    <Footprints size={22} style={{ color: "#94a3b8" }} />
                  )}

                  <div style={{ position: "absolute", top: "6px", left: "6px" }}>
                    <span className="badge badge-amber" style={{ fontSize: "0.68rem" }}>
                      <Tag size={9} />
                      <span>{p.artNo}</span>
                    </span>
                  </div>

                  <div style={{ position: "absolute", top: "6px", right: "6px" }}>
                    <span
                      className={`badge ${
                        isOutOfStock
                          ? "badge-amber"
                          : p.totalRemainingStock <= 5
                          ? "badge-amber"
                          : "badge-emerald"
                      }`}
                      style={{ fontSize: "0.68rem" }}
                    >
                      {p.totalRemainingStock} in stock
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Sizes */}
                  <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: "0.68rem", color: "#64748b" }}>Sizes:</span>
                    <div style={{ display: "flex", gap: "3px", overflowX: "auto" }}>
                      {p.sizes.map((s) => (
                        <span
                          key={s}
                          style={{
                            padding: "1px 5px",
                            background: "#f1f5f9",
                            borderRadius: "3px",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price Grid */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "5px",
                      padding: "6px 8px",
                      background: "#f8fafc",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                      marginBottom: "8px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase" }}>
                        Cost
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a" }}>
                        ₹{p.latestPurchaseValue}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: "0.65rem", color: "#64748b", textTransform: "uppercase" }}>
                        Selling
                      </div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0284c7" }}>
                        ₹{p.latestSalesValue}
                      </div>
                    </div>

                    <div
                      style={{
                        gridColumn: "span 2",
                        paddingTop: "4px",
                        borderTop: "1px solid #e2e8f0",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ fontSize: "0.68rem", color: "#475569" }}>
                        Profit:
                      </span>
                      <span style={{ fontWeight: 800, color: "#059669", fontSize: "0.78rem" }}>
                        +₹{profitPerPair} ({p.avgProfitMargin}%)
                      </span>
                    </div>
                  </div>

                  {/* Volume History Single Line */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.72rem",
                      color: "var(--text-muted)",
                      marginBottom: "10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span>Purchased: <strong style={{ color: "#0f172a" }}>{p.totalPurchased}</strong></span>
                    <span>Saled: <strong style={{ color: "#0f172a" }}>{p.totalSold}</strong></span>
                  </div>

                  {/* Actions */}
                  <div style={{ marginTop: "auto", display: "flex", gap: "6px" }}>
                    <Link
                      href={`/sales?artNo=${encodeURIComponent(p.artNo)}`}
                      className="btn btn-emerald btn-sm"
                      style={{ flex: 1, whiteSpace: "nowrap" }}
                    >
                      <DollarSign size={13} />
                      <span>Record Sale</span>
                    </Link>
                    <Link
                      href={`/purchases?artNo=${encodeURIComponent(p.artNo)}`}
                      className="btn btn-secondary btn-sm"
                      style={{ whiteSpace: "nowrap" }}
                    >
                      <span>Stock In</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
