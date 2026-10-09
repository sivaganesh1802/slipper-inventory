"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LayoutDashboard, PackagePlus, ShoppingCart, Search, LogOut, Footprints, ArrowUpRight } from "lucide-react";

const navItems = [
  { label: "Overview", href: "/", icon: LayoutDashboard, desc: "Store pulse" },
  { label: "Purchases", href: "/purchases", icon: PackagePlus, desc: "Stock in" },
  { label: "Sales ledger", href: "/sales", icon: ShoppingCart, desc: "Transactions" },
  { label: "Price search", href: "/search", icon: Search, desc: "Find an item" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  if (pathname === "/login") return null;

  return (
    <aside className="sidebar-desktop editorial-sidebar">
      <div className="brand-lockup">
        <div className="brand-mark"><Footprints aria-hidden="true" /></div>
        <div><div className="brand-name">SOLE<span>TRACK</span></div><div className="brand-caption">Retail operations</div></div>
      </div>
      <div className="sidebar-section-label">Workspace</div>
      <nav className="sidebar-nav" aria-label="Main navigation">
        {navItems.map(({ label, href, icon: Icon, desc }) => {
          const active = pathname === href;
          return <Link key={href} href={href} className={`sidebar-link${active ? " is-active" : ""}`} aria-current={active ? "page" : undefined}>
            <span className="sidebar-link-icon"><Icon aria-hidden="true" /></span>
            <span className="sidebar-link-copy"><strong>{label}</strong><small>{desc}</small></span>
            {active && <ArrowUpRight className="sidebar-link-arrow" aria-hidden="true" />}
          </Link>;
        })}
      </nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-note"><span className="status-dot" />Inventory is up to date</div>
      <div className="account-card">
        <div className="avatar">{user?.name ? user.name[0].toUpperCase() : "A"}</div>
        <div className="account-copy"><strong>{user?.name || "Admin"}</strong><small>{user?.role || "Manager"}</small></div>
        <button onClick={() => logout()} title="Sign out" aria-label="Sign out"><LogOut aria-hidden="true" /></button>
      </div>
    </aside>
  );
}

export default Sidebar;
              
