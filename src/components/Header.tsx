"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Menu,
  X,
  Footprints,
  LayoutDashboard,
  PackagePlus,
  ShoppingCart,
  Search,
  LogOut,
} from "lucide-react";

export function Header({ title, subtitle }: { title?: string; subtitle?: string }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (pathname === "/login") return null;

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Purchases", href: "/purchases", icon: PackagePlus },
    { label: "Sales Ledger", href: "/sales", icon: ShoppingCart },
    { label: "Price Search", href: "/search", icon: Search },
  ];

  return (
    <header style={{ marginBottom: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
      {/* Mobile Top Bar */}
      <div
        style={{
          display: "none",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "#ffffff",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-sm)",
          boxShadow: "var(--shadow-xs)",
        }}
        className="mobile-bar"
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", whiteSpace: "nowrap" }}>
          <Footprints size={20} style={{ color: "#0284c7" }} />
          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
            SOLE<span style={{ color: "#0284c7" }}>TRACK</span>
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            background: "none",
            border: "none",
            color: "#0f172a",
            cursor: "pointer",
            padding: "4px",
          }}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "8px",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
            boxShadow: "var(--shadow-md)",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 10px",
                  borderRadius: "var(--radius-sm)",
                  color: isActive ? "#0284c7" : "#475569",
                  background: isActive ? "#e0f2fe" : "transparent",
                  textDecoration: "none",
                  fontWeight: isActive ? 700 : 500,
                  fontSize: "0.825rem",
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 10px",
              borderRadius: "var(--radius-sm)",
              color: "#be123c",
              background: "#ffe4e6",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: "0.825rem",
              marginTop: "4px",
              whiteSpace: "nowrap",
            }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}

      {/* Desktop Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "nowrap",
          gap: "12px",
          minWidth: 0,
        }}
      >
        <div style={{ minWidth: 0, overflow: "hidden" }}>
          {title && (
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: 800,
                color: "#0f172a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title}
            </h1>
          )}
          {subtitle && (
            <p
              style={{
                color: "#475569",
                fontSize: "0.78rem",
                fontWeight: 500,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: "1px",
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Compact Date Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            padding: "4px 9px",
            borderRadius: "4px",
            fontSize: "0.75rem",
            color: "#0f172a",
            flexShrink: 0,
            whiteSpace: "nowrap",
            boxShadow: "var(--shadow-xs)",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#059669",
              flexShrink: 0,
            }}
          />
          <span style={{ fontWeight: 700, color: "#0f172a" }}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .mobile-bar {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
