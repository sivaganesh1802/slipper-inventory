"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Modal } from "@/components/Modal";
import { IProductSearchResult } from "@/lib/db";
import {
  Search,
  Tag,
  Footprints,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  PackagePlus,
  AlertCircle,
  Check,
  Copy,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  SlidersHorizontal,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { getTodayDateString } from "@/lib/sampleData";

type StockFilter = "all" | "inStock" | "lowStock" | "outOfStock";
type SortOption =
  | "popular"
  | "stockDesc"
  | "stockAsc"
  | "marginDesc"
  | "priceDesc"
  | "priceAsc"
  | "artNoAsc";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<IProductSearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & sorting
  const [filterStatus, setFilterStatus] = useState<StockFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("popular");
  const [copiedArtNo, setCopiedArtNo] = useState<string | null>(null);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Quick Sale Modal State ("make the process")
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<IProductSearchResult | null>(null);
  const [saleSize, setSaleSize] = useState("");
  const [saleQty, setSaleQty] = useState<number>(1);
  const [saleCustomer, setSaleCustomer] = useState("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [saleDate, setSaleDate] = useState(getTodayDateString());
  const [saleNotes, setSaleNotes] = useState("");
  const [submittingSale, setSubmittingSale] = useState(false);
  const [saleError, setSaleError] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fetchProducts = async (searchQuery: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error("Error searching products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts(query);
    }, 180);
    return () => clearTimeout(timer);
  }, [query]);

  // Copy Art.No to clipboard
  const handleCopyArtNo = (artNo: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(artNo);
    setCopiedArtNo(artNo);
    setTimeout(() => {
      setCopiedArtNo(null);
    }, 1800);
  };

  // Toggle card details drawer
  const toggleCardExpand = (artNo: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [artNo]: !prev[artNo],
    }));
  };

  // Open Quick Sale Modal
  const handleOpenSaleModal = (product: IProductSearchResult, preselectedSize?: string) => {
    setSelectedProduct(product);
    const targetSize =
      preselectedSize ||
      product.purchases.find((p) => (p.remainingStock ?? 0) > 0)?.size ||
      product.sizes[0] ||
      "";
    setSaleSize(targetSize);
    setSaleQty(1);
    setSaleCustomer("");
    const defaultPrice = product.defaultSellingPrice || product.latestSalesValue;
    setSalePrice(String(defaultPrice || ""));
    setSaleDate(getTodayDateString());
    setSaleNotes("");
    setSaleError("");
    setIsSaleModalOpen(true);
  };

  // Submit quick sale directly from search card
  const handleQuickSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setSaleError("");

    if (!saleSize) {
      setSaleError("Please select a slipper size");
      return;
    }
    if (!saleCustomer.trim()) {
      setSaleError("Please enter customer name");
      return;
    }
    const val = Number(salePrice);
    if (isNaN(val) || val <= 0) {
      setSaleError("Please enter a valid selling price");
      return;
    }
    if (saleQty <= 0) {
      setSaleError("Quantity must be at least 1");
      return;
    }

    try {
      setSubmittingSale(true);
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artNo: selectedProduct.artNo,
          customerName: saleCustomer.trim(),
          size: saleSize,
          salesDate: saleDate,
          salesValue: val,
          quantity: saleQty,
          notes: saleNotes.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to record sale");
      }

      setIsSaleModalOpen(false);
      setToastMessage(`✓ Recorded sale for ${selectedProduct.artNo} (${saleQty} pair) to ${saleCustomer.trim()}!`);
      setTimeout(() => setToastMessage(null), 4000);
      // Refresh products to show updated stock counts
      fetchProducts(query);
    } catch (err: unknown) {
      setSaleError((err as Error).message || "Error submitting sale");
    } finally {
      setSubmittingSale(false);
    }
  };

  // Filter & sort products
  const { filteredProducts, counts, kpiTotals } = useMemo(() => {
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let totalStockPairs = 0;
    let totalSoldPairs = 0;

    products.forEach((p) => {
      totalStockPairs += p.totalRemainingStock;
      totalSoldPairs += p.totalSold;
      if (p.totalRemainingStock <= 0) {
        outOfStockCount++;
      } else if (p.totalRemainingStock <= 5) {
        lowStockCount++;
      } else {
        inStockCount++;
      }
    });

    const filtered = products.filter((p) => {
      if (filterStatus === "inStock") return p.totalRemainingStock > 0;
      if (filterStatus === "lowStock") return p.totalRemainingStock > 0 && p.totalRemainingStock <= 5;
      if (filterStatus === "outOfStock") return p.totalRemainingStock <= 0;
      return true;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "popular":
          return b.totalSold - a.totalSold;
        case "stockDesc":
          return b.totalRemainingStock - a.totalRemainingStock;
        case "stockAsc":
          return a.totalRemainingStock - b.totalRemainingStock;
        case "marginDesc":
          return b.avgProfitMargin - a.avgProfitMargin;
        case "priceDesc": {
          const priceA = a.defaultSellingPrice || a.latestSalesValue;
          const priceB = b.defaultSellingPrice || b.latestSalesValue;
          return priceB - priceA;
        }
        case "priceAsc": {
          const priceA = a.defaultSellingPrice || a.latestSalesValue;
          const priceB = b.defaultSellingPrice || b.latestSalesValue;
          return priceA - priceB;
        }
        case "artNoAsc":
          return a.artNo.localeCompare(b.artNo);
        default:
          return 0;
      }
    });

    return {
      filteredProducts: filtered,
      counts: {
        all: products.length,
        inStock: inStockCount,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
      },
      kpiTotals: {
        totalModels: products.length,
        totalStockPairs,
        totalSoldPairs,
      },
    };
  }, [products, filterStatus, sortBy]);

  // Compute remaining stock for selected product in sale modal
  const selectedSizeStock = useMemo(() => {
    if (!selectedProduct || !saleSize) return 0;
    const purchasesForSize = selectedProduct.purchases.filter((p) => p.size === saleSize);
    return purchasesForSize.reduce((sum, p) => sum + (p.remainingStock ?? 0), 0);
  }, [selectedProduct, saleSize]);

  const selectedSizeCost = useMemo(() => {
    if (!selectedProduct || !saleSize) return selectedProduct?.latestPurchaseValue || 0;
    const matchingPurchase = selectedProduct.purchases.find(
      (p) => p.size === saleSize && (p.remainingStock ?? 0) > 0
    ) || selectedProduct.purchases.find((p) => p.size === saleSize);
    return matchingPurchase?.purchaseValue || selectedProduct.latestPurchaseValue || 0;
  }, [selectedProduct, saleSize]);

  const saleNumericPrice = Number(salePrice) || 0;
  const estimatedOrderRevenue = saleNumericPrice * saleQty;
  const estimatedOrderCost = selectedSizeCost * saleQty;
  const estimatedOrderProfit = estimatedOrderRevenue - estimatedOrderCost;
  const estimatedOrderMargin =
    estimatedOrderRevenue > 0
      ? Math.round((estimatedOrderProfit / estimatedOrderRevenue) * 100)
      : 0;

  return (
    <div className="search-page">
      <Header
        title="Product & Price Finder"
        subtitle="Search slipper models by Art.No, customer, or size with live stock & quick sale entry"
      />

      {/* Success Notification Toast */}
      {toastMessage && (
        <div
          className="glass-card animate-fade-in"
          style={{
            padding: "10px 16px",
            background: "#d1fae5",
            borderColor: "#a7f3d0",
            color: "#065f46",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            fontSize: "0.85rem",
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} style={{ color: "#059669", flexShrink: 0 }} />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", color: "#065f46" }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Sticky Header Zone: KPI Metrics + Search Bar & Filters */}
      <div className="search-sticky-zone">
        {/* KPI Overview Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "10px",
            width: "100%",
          }}
        >
        <div
          className="glass-card"
          style={{
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: "3px solid #202b27",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#ebe7dc",
              color: "#202b27",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Layers size={16} />
          </div>
          <div>
            <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
              Models Catalog
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {kpiTotals.totalModels}{" "}
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)" }}>styles</span>
            </div>
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: "3px solid #1e6b57",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#e1eee8",
              color: "#1e6b57",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <Footprints size={16} />
          </div>
          <div>
            <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
              In-Stock Pairs
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#1e6b57" }}>
              {kpiTotals.totalStockPairs.toLocaleString()}{" "}
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)" }}>available</span>
            </div>
          </div>
        </div>

        <div
          className="glass-card"
          style={{
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            borderLeft: "3px solid #9a5d36",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "#faede6",
              color: "#9a5d36",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <TrendingUp size={16} />
          </div>
          <div>
            <div style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
              Pairs Sold
            </div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)" }}>
              {kpiTotals.totalSoldPairs.toLocaleString()}{" "}
              <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-muted)" }}>completed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Search & Filtering Control Card */}
      <div
        className="glass-card"
        style={{
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          width: "100%",
        }}
      >
        {/* Main Search Input */}
        <div style={{ position: "relative", width: "100%" }}>
          <Search
            size={18}
            style={{
              position: "absolute",
              left: "14px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#8a928d",
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search Art.No (e.g. SLIP-AIR-901, 550), customer name, or size..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              paddingLeft: "42px",
              paddingRight: query ? "38px" : "14px",
              fontSize: "0.92rem",
              paddingTop: "11px",
              paddingBottom: "11px",
              borderRadius: "10px",
              background: "#fbfaf7",
              borderColor: "#ded9cd",
            }}
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#8a928d",
                padding: "4px",
                display: "grid",
                placeItems: "center",
              }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            width: "100%",
          }}
        >
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 700, flexShrink: 0 }}>
            Quick Lookup:
          </span>
          {["SLIP-AIR-901", "ART-LITE-305", "ROYAL-ORTO-550", "URBAN-LEATHER-70", "KIDS-CARTOON-12"].map((sample) => (
            <button
              key={sample}
              type="button"
              onClick={() => setQuery(sample)}
              style={{
                background: query === sample ? "#202b27" : "#f5f3ee",
                color: query === sample ? "#f7f5ef" : "var(--text-secondary)",
                border: `1px solid ${query === sample ? "#202b27" : "#e4ded2"}`,
                borderRadius: "999px",
                padding: "3px 10px",
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              {sample}
            </button>
          ))}
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              style={{
                background: "transparent",
                color: "#b45309",
                border: "none",
                fontSize: "0.72rem",
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
                marginLeft: "auto",
              }}
            >
              Reset search
            </button>
          )}
        </div>

        {/* Filter Pills & Sorting Ribbon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "10px",
            paddingTop: "8px",
            borderTop: "1px solid var(--border-subtle)",
            width: "100%",
          }}
        >
          {/* Status Filter Tabs */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setFilterStatus("all")}
              className={`filter-chip-tab ${filterStatus === "all" ? "is-active" : ""}`}
            >
              <span>All Models</span>
              <span className="chip-count">{counts.all}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus("inStock")}
              className={`filter-chip-tab ${filterStatus === "inStock" ? "is-active" : ""}`}
            >
              <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#059669" }} />
              <span>In Stock</span>
              <span className="chip-count">{counts.inStock}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus("lowStock")}
              className={`filter-chip-tab ${filterStatus === "lowStock" ? "is-active" : ""}`}
            >
              <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#d97706" }} />
              <span>Low Stock (≤5)</span>
              <span className="chip-count">{counts.lowStock}</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterStatus("outOfStock")}
              className={`filter-chip-tab ${filterStatus === "outOfStock" ? "is-active" : ""}`}
            >
              <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#e11d48" }} />
              <span>Out of Stock</span>
              <span className="chip-count">{counts.outOfStock}</span>
            </button>
          </div>

          {/* Sort Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}>
            <SlidersHorizontal size={14} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", fontWeight: 600 }}>Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="input-field"
              style={{
                width: "auto",
                minWidth: "150px",
                padding: "5px 9px",
                fontSize: "0.78rem",
                borderRadius: "8px",
                background: "#fbfaf7",
                cursor: "pointer",
              }}
            >
              <option value="popular">Best Sellers (Volume)</option>
              <option value="stockDesc">Stock: High to Low</option>
              <option value="stockAsc">Stock: Low to High</option>
              <option value="marginDesc">Profit Margin (High)</option>
              <option value="priceDesc">Selling Price (High to Low)</option>
              <option value="priceAsc">Selling Price (Low to High)</option>
              <option value="artNoAsc">Art.No (A to Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Header Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.8rem",
          color: "var(--text-secondary)",
          padding: "0 2px",
          width: "100%",
        }}
      >
        <span>
          Showing <strong>{filteredProducts.length}</strong> of {products.length} slipper models
          {query && (
            <span>
              {" "}matching &ldquo;<strong>{query}</strong>&rdquo;
            </span>
          )}
        </span>
        <span style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          Click &ldquo;Record Sale&rdquo; to process sales directly
        </span>
      </div>
      </div>

      {/* Product Cards Grid - Auto filling 100% width with no right side gap */}
      {loading ? (
        <div className="search-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="glass-card"
              style={{
                height: "280px",
                background: "linear-gradient(90deg, #fbfaf7 25%, #f1ede4 50%, #fbfaf7 75%)",
                backgroundSize: "200% 100%",
                borderRadius: "14px",
              }}
            />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
            width: "100%",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "#ebe7dc",
              color: "#53605a",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Footprints size={28} />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text-primary)" }}>
            No Slipper Product Found
          </h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", maxWidth: "420px" }}>
            No slipper model matches &ldquo;{query}&rdquo; under the current &ldquo;{filterStatus}&rdquo; filter.
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilterStatus("all");
                }}
                className="btn btn-secondary btn-sm"
              >
                Clear Filters
              </button>
            )}
            <Link href="/purchases" className="btn btn-primary btn-sm">
              <PackagePlus size={14} />
              <span>Add Stock for this Model</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="search-grid">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.totalRemainingStock <= 0;
            const isLowStock = p.totalRemainingStock > 0 && p.totalRemainingStock <= 5;
            const sellingPrice = p.defaultSellingPrice || p.latestSalesValue;
            const profitPerPair = sellingPrice - p.latestPurchaseValue;
            const isExpanded = !!expandedCards[p.artNo];

            // Stock Health Percentage
            const stockPercent =
              p.totalPurchased > 0
                ? Math.min(100, Math.round((p.totalRemainingStock / p.totalPurchased) * 100))
                : 0;

            // Group sizes by purchase stock
            const sizeStockMap: Record<string, number> = {};
            p.purchases?.forEach((pch) => {
              sizeStockMap[pch.size] = (sizeStockMap[pch.size] || 0) + (pch.remainingStock ?? 0);
            });

            const totalRevenue = p.sales.reduce((sum, s) => sum + s.salesValue * s.quantity, 0);

            return (
              <div key={p.artNo} className="slipper-card">
                {/* Visual Showcase Header */}
                <div className="slipper-showcase">
                  {p.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={p.image}
                      alt={p.artNo}
                      className="slipper-showcase-img"
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        color: "#8a928d",
                      }}
                    >
                      <Footprints size={40} strokeWidth={1.5} />
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.08em", color: "#a2aaa4" }}>
                        NO IMAGE
                      </span>
                    </div>
                  )}

                  {/* Floating Art.No Pill with 1-Click Copy */}
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      left: "8px",
                      display: "flex",
                      alignItems: "center",
                      gap: "3px",
                      zIndex: 2,
                    }}
                  >
                    <span
                      className="badge badge-amber"
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.72rem",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                      }}
                    >
                      <Tag size={10} />
                      <span>{p.artNo}</span>
                    </span>

                    <button
                      type="button"
                      onClick={(e) => handleCopyArtNo(p.artNo, e)}
                      title="Copy Art.No"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "22px",
                        height: "22px",
                        borderRadius: "4px",
                        background: "rgba(255, 255, 255, 0.9)",
                        border: "1px solid #dcd7cb",
                        color: copiedArtNo === p.artNo ? "#059669" : "#53605a",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {copiedArtNo === p.artNo ? <Check size={12} /> : <Copy size={11} />}
                    </button>
                  </div>

                  {/* Floating Stock Status Badge */}
                  <div style={{ position: "absolute", top: "8px", right: "8px", zIndex: 2 }}>
                    <span
                      className={`badge ${
                        isOutOfStock
                          ? "badge-danger"
                          : isLowStock
                          ? "badge-amber"
                          : "badge-emerald"
                      }`}
                      style={{
                        padding: "3px 8px",
                        fontSize: "0.72rem",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                      }}
                    >
                      {isOutOfStock ? (
                        <>
                          <AlertCircle size={10} />
                          <span>Out of Stock</span>
                        </>
                      ) : isLowStock ? (
                        <>
                          <AlertCircle size={10} />
                          <span>{p.totalRemainingStock} Low Stock</span>
                        </>
                      ) : (
                        <>
                          <span
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: "#059669",
                              display: "inline-block",
                            }}
                          />
                          <span>{p.totalRemainingStock} In Stock</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* Card Main Body */}
                <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px", flex: 1 }}>
                  {/* Title & Stock Progress Meter */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                      <h4
                        style={{
                          fontSize: "0.98rem",
                          fontWeight: 800,
                          color: "var(--text-primary)",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {p.artNo}
                      </h4>
                      <span style={{ fontSize: "0.72rem", color: "var(--text-muted)", fontWeight: 600 }}>
                        {p.totalRemainingStock} / {p.totalPurchased} pairs ({stockPercent}%)
                      </span>
                    </div>

                    {/* Visual Meter Bar */}
                    <div className="stock-meter-track" title={`${p.totalRemainingStock} of ${p.totalPurchased} remaining`}>
                      <div
                        className="stock-meter-fill"
                        style={{
                          width: `${stockPercent}%`,
                          background: isOutOfStock
                            ? "#e11d48"
                            : isLowStock
                            ? "#d97706"
                            : "#1e6b57",
                        }}
                      />
                    </div>
                  </div>

                  {/* Pricing Matrix */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 1fr",
                      gap: "6px",
                      marginTop: "2px",
                    }}
                  >
                    <div className="price-box">
                      <span style={{ fontSize: "0.62rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                        Cost (Buy)
                      </span>
                      <strong style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                        ₹{p.latestPurchaseValue}
                      </strong>
                    </div>

                    <div className="price-box">
                      <span style={{ fontSize: "0.62rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                        Sell Price
                      </span>
                      <strong style={{ fontSize: "0.95rem", fontWeight: 800, color: "#1e6b57" }}>
                        ₹{sellingPrice}
                      </strong>
                    </div>

                    <div
                      className="price-box"
                      style={{
                        background: profitPerPair >= 0 ? "#f0fdf4" : "#fef2f2",
                        borderColor: profitPerPair >= 0 ? "#bbf7d0" : "#fecaca",
                      }}
                    >
                      <span style={{ fontSize: "0.62rem", textTransform: "uppercase", color: "#047857", fontWeight: 700 }}>
                        Profit / Pair
                      </span>
                      <strong style={{ fontSize: "0.92rem", fontWeight: 800, color: "#059669" }}>
                        +₹{profitPerPair}{" "}
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#047857" }}>
                          ({p.avgProfitMargin}%)
                        </span>
                      </strong>
                    </div>
                  </div>

                  {/* Size Stock Matrix - Clickable Pills */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "0.68rem", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>
                        Available Sizes & Stock:
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "#64748b" }}>
                        Click size to quick sell
                      </span>
                    </div>

                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      {p.sizes.map((sz) => {
                        const count = sizeStockMap[sz] ?? 0;
                        const hasStock = count > 0;

                        return (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleOpenSaleModal(p, sz)}
                            className={`size-pill-tag ${hasStock ? "is-available" : "is-depleted"}`}
                            title={hasStock ? `Size ${sz}: ${count} pairs available. Click to sell!` : `Size ${sz} is out of stock`}
                          >
                            <span>Sz {sz}</span>
                            <span style={{ opacity: 0.75 }}>({count})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lifetime Metrics Strip */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.72rem",
                      color: "var(--text-secondary)",
                      paddingTop: "4px",
                      borderTop: "1px dashed var(--border-subtle)",
                    }}
                  >
                    <span>
                      Purchased: <strong style={{ color: "var(--text-primary)" }}>{p.totalPurchased}</strong>
                    </span>
                    <span>
                      Sold: <strong style={{ color: "var(--text-primary)" }}>{p.totalSold}</strong>
                    </span>
                    <span>
                      Revenue: <strong style={{ color: "#1e6b57" }}>₹{totalRevenue.toLocaleString()}</strong>
                    </span>
                  </div>

                  {/* Batch & Sales History Accordion */}
                  <div>
                    <button
                      type="button"
                      onClick={() => toggleCardExpand(p.artNo)}
                      style={{
                        width: "100%",
                        padding: "5px 8px",
                        background: isExpanded ? "#ede9dc" : "#f5f3ee",
                        border: "1px solid var(--border-subtle)",
                        borderRadius: "6px",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <Layers size={12} />
                        <span>Batches & History ({p.purchases.length} stock-ins, {p.sales.length} sales)</span>
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isExpanded && (
                      <div
                        className="animate-fade-in"
                        style={{
                          marginTop: "6px",
                          padding: "8px 10px",
                          background: "#fbfaf7",
                          border: "1px solid #ebe5d8",
                          borderRadius: "6px",
                          fontSize: "0.72rem",
                          display: "flex",
                          flexDirection: "column",
                          gap: "8px",
                          maxHeight: "160px",
                          overflowY: "auto",
                        }}
                      >
                        {/* Batches Sub-section */}
                        <div>
                          <strong style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)" }}>
                            Stock-In Batches:
                          </strong>
                          <div style={{ marginTop: "3px", display: "flex", flexDirection: "column", gap: "3px" }}>
                            {p.purchases.map((pch) => (
                              <div
                                key={pch._id}
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  padding: "2px 0",
                                  borderBottom: "1px solid #f1ece1",
                                }}
                              >
                                <span>
                                  {pch.purchaseDate} (Sz {pch.size}):
                                </span>
                                <span>
                                  {pch.remainingStock}/{pch.quantity} left @ ₹{pch.purchaseValue}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recent Sales Sub-section */}
                        {p.sales.length > 0 && (
                          <div style={{ paddingTop: "4px", borderTop: "1px solid #e5dfd2" }}>
                            <strong style={{ fontSize: "0.68rem", textTransform: "uppercase", color: "var(--text-muted)" }}>
                              Recent Sales:
                            </strong>
                            <div style={{ marginTop: "3px", display: "flex", flexDirection: "column", gap: "3px" }}>
                              {p.sales.slice(0, 3).map((s) => (
                                <div
                                  key={s._id}
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    padding: "2px 0",
                                    borderBottom: "1px solid #f1ece1",
                                  }}
                                >
                                  <span>
                                    {s.customerName} ({s.quantity}x Sz {s.size}):
                                  </span>
                                  <span style={{ color: "#059669", fontWeight: 700 }}>
                                    ₹{s.salesValue * s.quantity} (+₹{s.profit})
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons ("make the process") */}
                  <div style={{ marginTop: "auto", paddingTop: "6px", display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => handleOpenSaleModal(p)}
                      disabled={isOutOfStock}
                      className="btn btn-emerald"
                      style={{
                        flex: 1.2,
                        padding: "7px 12px",
                        fontSize: "0.78rem",
                        opacity: isOutOfStock ? 0.6 : 1,
                        cursor: isOutOfStock ? "not-allowed" : "pointer",
                      }}
                    >
                      <ShoppingCart size={14} />
                      <span>{isOutOfStock ? "Out of Stock" : "Record Sale"}</span>
                    </button>

                    <Link
                      href={`/purchases?artNo=${encodeURIComponent(p.artNo)}`}
                      className="btn btn-secondary"
                      style={{
                        padding: "7px 11px",
                        fontSize: "0.78rem",
                      }}
                    >
                      <PackagePlus size={14} />
                      <span>Restock</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Sale Modal Flow ("make the process") */}
      {selectedProduct && (
        <Modal
          isOpen={isSaleModalOpen}
          onClose={() => setIsSaleModalOpen(false)}
          title="Instant Slipper Sale"
          subtitle={`Model ${selectedProduct.artNo} • Fast Record & Stock Update`}
          maxWidth="480px"
        >
          <form onSubmit={handleQuickSaleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {saleError && (
              <div
                style={{
                  padding: "8px 12px",
                  background: "#ffe4e6",
                  borderColor: "#fecdd3",
                  color: "#be123c",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <AlertCircle size={15} />
                <span>{saleError}</span>
              </div>
            )}

            {/* Model & Image Badge */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "8px 12px",
                background: "#fbfaf7",
                borderRadius: "8px",
                border: "1px solid #ebe5d8",
              }}
            >
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "8px",
                  background: "#f3f0e8",
                  display: "grid",
                  placeItems: "center",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
              >
                {selectedProduct.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={selectedProduct.image} alt={selectedProduct.artNo} style={{ maxHeight: "80%", maxWidth: "80%", objectFit: "contain" }} />
                ) : (
                  <Footprints size={20} style={{ color: "#64748b" }} />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  {selectedProduct.artNo}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  Total In Stock: <strong style={{ color: "#1e6b57" }}>{selectedProduct.totalRemainingStock} pairs</strong>
                </div>
              </div>
            </div>

            {/* Size Selector */}
            <div className="input-group">
              <label className="input-label">Select Slipper Size *</label>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "2px" }}>
                {selectedProduct.sizes.map((sz) => {
                  const szStock = selectedProduct.purchases
                    .filter((p) => p.size === sz)
                    .reduce((sum, p) => sum + (p.remainingStock ?? 0), 0);
                  const isSelected = saleSize === sz;
                  const isDisabled = szStock <= 0;

                  return (
                    <button
                      key={sz}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSaleSize(sz)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        border: `1.5px solid ${isSelected ? "#1e6b57" : isDisabled ? "#e5e0d4" : "#ded7ca"}`,
                        background: isSelected ? "#1e6b57" : isDisabled ? "#f5f3ee" : "#ffffff",
                        color: isSelected ? "#ffffff" : isDisabled ? "#a5afa9" : "var(--text-primary)",
                        cursor: isDisabled ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        opacity: isDisabled ? 0.6 : 1,
                      }}
                    >
                      <span>Sz {sz}</span>
                      <small style={{ fontSize: "0.68rem", opacity: 0.85 }}>({szStock})</small>
                    </button>
                  );
                })}
              </div>
              {saleSize && (
                <div style={{ fontSize: "0.72rem", color: selectedSizeStock > 0 ? "#047857" : "#be123c", marginTop: "3px" }}>
                  {selectedSizeStock > 0
                    ? `✓ Size ${saleSize} has ${selectedSizeStock} pairs remaining`
                    : `⚠ Size ${saleSize} is currently out of stock`}
                </div>
              )}
            </div>

            {/* Customer Name */}
            <div className="input-group">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label className="input-label">Customer Name *</label>
                <button
                  type="button"
                  onClick={() => setSaleCustomer("Walk-in Retail Customer")}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#1e6b57",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Quick: Walk-in Retail
                </button>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Ramesh Kumar, Walk-in Retail..."
                value={saleCustomer}
                onChange={(e) => setSaleCustomer(e.target.value)}
                required
              />
            </div>

            {/* Quantity & Selling Price in 2 Columns */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="input-group">
                <label className="input-label">Quantity (Pairs) *</label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setSaleQty((q) => Math.max(1, q - 1))}
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "1px solid var(--border-subtle)",
                      background: "#fbfaf7",
                      borderRadius: "6px 0 0 6px",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedSizeStock > 0 ? selectedSizeStock : undefined}
                    value={saleQty}
                    onChange={(e) => setSaleQty(Math.max(1, Number(e.target.value) || 1))}
                    className="input-field no-spin"
                    style={{
                      textAlign: "center",
                      borderRadius: "0",
                      borderLeft: "none",
                      borderRight: "none",
                      padding: "6px",
                    }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setSaleQty((q) => (selectedSizeStock > 0 ? Math.min(selectedSizeStock, q + 1) : q + 1))}
                    style={{
                      width: "32px",
                      height: "32px",
                      border: "1px solid var(--border-subtle)",
                      background: "#fbfaf7",
                      borderRadius: "0 6px 6px 0",
                      cursor: "pointer",
                      fontWeight: 800,
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Selling Price / Pair (₹) *</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#8a928d", fontWeight: 700 }}>
                    ₹
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="input-field"
                    style={{ paddingLeft: "24px" }}
                    placeholder="e.g. 350"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sale Date & Notes */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div className="input-group">
                <label className="input-label">Sale Date</label>
                <input
                  type="date"
                  className="input-field"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                />
              </div>

              <div className="input-group">
                <label className="input-label">Notes (Optional)</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Cash, GPay, Counter 1"
                  value={saleNotes}
                  onChange={(e) => setSaleNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Order Profit Summary Box */}
            <div
              style={{
                padding: "10px 14px",
                background: estimatedOrderProfit >= 0 ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${estimatedOrderProfit >= 0 ? "#bbf7d0" : "#fecaca"}`,
                borderRadius: "8px",
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px",
                textAlign: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                  Order Total
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)" }}>
                  ₹{estimatedOrderRevenue.toLocaleString()}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700 }}>
                  Unit Cost
                </div>
                <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#53605a" }}>
                  ₹{selectedSizeCost}
                </div>
              </div>

              <div>
                <div style={{ fontSize: "0.65rem", textTransform: "uppercase", color: "#047857", fontWeight: 700 }}>
                  Net Profit
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800, color: "#059669" }}>
                  +₹{estimatedOrderProfit.toLocaleString()}{" "}
                  <span style={{ fontSize: "0.68rem" }}>({estimatedOrderMargin}%)</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={() => setIsSaleModalOpen(false)}
                className="btn btn-secondary"
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingSale || selectedSizeStock <= 0}
                className="btn btn-emerald"
                style={{ flex: 2 }}
              >
                <ShoppingCart size={15} />
                <span>
                  {submittingSale
                    ? "Recording Sale..."
                    : `Confirm Sale (₹${estimatedOrderRevenue.toLocaleString()})`}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
