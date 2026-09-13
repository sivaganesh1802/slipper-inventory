"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  PackagePlus,
  ShoppingCart,
  Search,
  LogOut,
  Footprints,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  if (pathname === "/login") return null;

  const navItems = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
      desc: "Daily Sales & Profit",
    },
    {
      label: "Purchases",
      href: "/purchases",
      icon: PackagePlus,
      desc: "Stock In & Art.No",
    },
    {
      label: "Sales Ledger",
      href: "/sales",
      icon: ShoppingCart,
      desc: "Record Sales & Margins",
    },
    {
      label: "Price Search",
      href: "/search",
      icon: Search,
      desc: "Lookup Art.No & Costs",
    },
  ];

  return (
    <aside
      className="sidebar-desktop"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: "var(--sidebar-width)",
        backgroundColor: "#ffffff",
        borderRight: "1px solid var(--border-subtle)",
        display: "flex",
        flexDirection: "column",
        zIndex: 40,
        boxShadow: "1px 0 3px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: "14px 16px",
          borderBottom: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          whiteSpace: "nowrap",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "6px",
            backgroundColor: "#0284c7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            flexShrink: 0,
          }}
        >
          <Footprints size={18} />
        </div>
        <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1rem",
              fontWeight: 800,
              color: "#0f172a",
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            SOLE<span style={{ color: "#0284c7" }}>TRACK</span>
          </div>
          <div
            style={{
              fontSize: "0.68rem",
              color: "var(--text-muted)",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap",
            }}
          >
            Slipper Inventory
          </div>
        </div>
      </div>

      {/* Nav Menu */}
      <div style={{ padding: "12px 10px", flex: 1, display: "flex", flexDirection: "column", gap: "3px" }}>
        <div
          style={{
            padding: "0 8px 6px 8px",
            fontSize: "0.68rem",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: "var(--text-muted)",
            whiteSpace: "nowrap",
          }}
        >
          Menu
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                borderRadius: "var(--radius-sm)",
                textDecoration: "none",
                color: isActive ? "#0284c7" : "var(--text-secondary)",
                backgroundColor: isActive ? "#e0f2fe" : "transparent",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.825rem",
                transition: "all 0.1s ease",
                whiteSpace: "nowrap",
                overflow: "hidden",
              }}
            >
              <Icon
                size={16}
                style={{
                  color: isActive ? "#0284c7" : "var(--text-muted)",
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {item.label}
              </span>
              {isActive && (
                <div
                  style={{
                    marginLeft: "auto",
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    backgroundColor: "#0284c7",
                    flexShrink: 0,
                  }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* User Footer & Logout */}
      <div
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
          backgroundColor: "#f8fafc",
          whiteSpace: "nowrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0, overflow: "hidden" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              backgroundColor: "#e2e8f0",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.75rem",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user?.name ? user.name[0].toUpperCase() : "A"}
          </div>
          <div style={{ minWidth: 0, overflow: "hidden" }}>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#0f172a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.name || "Admin"}
            </div>
            <div
              style={{
                fontSize: "0.68rem",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.role || "Manager"}
            </div>
          </div>
        </div>

        <button
          onClick={() => logout()}
          title="Sign Out"
          style={{
            background: "none",
            border: "none",
            color: "var(--text-muted)",
            cursor: "pointer",
            padding: "5px",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e11d48")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <LogOut size={15} />
        </button>
      </div>
    </aside>
  );
}
