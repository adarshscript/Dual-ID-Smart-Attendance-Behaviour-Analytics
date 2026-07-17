"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Home,
  LogOut,
  MoreVertical,
  Settings,
  Users
} from "lucide-react";
import { ReactNode, useMemo, useState } from "react";
import { clearAdminSession, clearStudentSession } from "@/lib/auth";
import { showRouteLoading, showToast } from "@/lib/feedback";
import { NavLink } from "@/components/shared/nav-link";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: Home },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 }
];

export function AdminLayout({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const currentLabel = useMemo(
    () => navItems.find((item) => item.href === pathname)?.label || "Dashboard",
    [pathname]
  );

  function handleLogout() {
    clearAdminSession();
    clearStudentSession();
    showToast({
      title: "Logged out",
      message: "Admin session ended successfully.",
      tone: "success"
    });
    showRouteLoading("Returning to admin login...");
    router.push("/admin/login");
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div className="brand-logo">◈</div>
          <div className="sidebar-brand-copy">
            <strong>DIAS</strong>
            <span>ADMIN CONSOLE</span>
          </div>

          <div className="sidebar-menu-wrap">
            <button
              type="button"
              className="sidebar-menu-button"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              <MoreVertical size={18} />
            </button>

            {menuOpen ? (
              <div className="sidebar-dropdown">
                <button
                  type="button"
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    showToast({
                      title: "Settings panel",
                      message: "The settings module will be expanded in a later update.",
                      tone: "info"
                    });
                  }}
                >
                  <Settings size={15} />
                  Settings
                </button>
                <button
                  type="button"
                  className="sidebar-dropdown-item"
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <NavLink
                key={item.href}
                href={item.href}
                label={`Opening ${item.label}...`}
                className={`sidebar-link ${active ? "sidebar-link--active" : ""}`}
              >
                <Icon size={18} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <p>SYSTEM ONLINE</p>
          <button type="button" className="sidebar-link" onClick={handleLogout}>
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="admin-main">
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="profile-chip">
            <div className="profile-avatar">A</div>
            <div>
              <strong>Admin Profile</strong>
              <span>{currentLabel}</span>
            </div>
          </div>
        </header>
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
}
