'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Truck,
  Tag,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Bell,
  RefreshCw,
} from 'lucide-react';
import { token } from '../lib/api';
import styles from './admin.module.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // For the dedicated login page, render clean full viewport without sidebar
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const handleLogout = () => {
    token.clear();
    router.push('/admin/login');
  };

  const navItems = [
    { label: 'Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Bookings Console', href: '/admin/bookings', icon: Package, badge: 'Live' },
    { label: 'Fleet & Drivers', href: '/admin/fleet', icon: Truck },
    { label: 'Pricing & Catalog', href: '/admin/pricing', icon: Tag },
    { label: 'Audit & Alerts', href: '/admin/audit', icon: ShieldCheck },
  ];

  const getPageTitle = () => {
    if (pathname === '/admin') return 'Executive Dashboard';
    if (pathname.startsWith('/admin/bookings')) return 'Relocations & Bookings';
    if (pathname.startsWith('/admin/fleet')) return 'Fleet & Driver Roster';
    if (pathname.startsWith('/admin/pricing')) return 'Pricing & Item Catalog';
    if (pathname.startsWith('/admin/audit')) return 'Security, Audit & Alerts';
    return 'Admin Console';
  };

  return (
    <div className={styles.adminRoot}>
      {/* ── Left Sidebar Navigation ─────────────────────────────────── */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <div className={styles.sidebarBrand}>
          <div className={styles.brandLogoCircle}>T</div>
          <div className={styles.brandInfo}>
            <span className={styles.brandTitle}>Triveni Transports</span>
            <span className={styles.brandBadge}>Super Admin Console</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <span className={styles.navSectionLabel}>Operations Management</span>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className={styles.navLinkLeft}>
                  <Icon size={18} strokeWidth={isActive ? 2.4 : 2} />
                  <span>{item.label}</span>
                </div>
                {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
              </Link>
            );
          })}

          <span className={styles.navSectionLabel} style={{ marginTop: 16 }}>
            Quick Links
          </span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navLink}
            style={{ fontSize: 13 }}
          >
            <div className={styles.navLinkLeft}>
              <ExternalLink size={16} />
              <span>Customer Website</span>
            </div>
          </a>
          <a
            href="/quote"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.navLink}
            style={{ fontSize: 13 }}
          >
            <div className={styles.navLinkLeft}>
              <ExternalLink size={16} />
              <span>Instant Quote Form</span>
            </div>
          </a>
        </nav>

        {/* User Card & Logout */}
        <div className={styles.sidebarFooter}>
          <div className={styles.adminUserSnippet}>
            <div className={styles.adminAvatar}>AD</div>
            <div className={styles.adminNameCol}>
              <span className={styles.adminName}>Triveni Admin</span>
              <span className={styles.adminRole}>Master Dispatcher</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.logoutBtn}
            onClick={handleLogout}
            title="Sign out of Admin Console"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div className={styles.mainWrapper}>
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button
              type="button"
              className={styles.mobileMenuBtn}
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Navigation"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className={styles.breadcrumbs}>
              <span>Triveni Portal</span>
              <span>/</span>
              <span className={styles.breadcrumbActive}>{getPageTitle()}</span>
            </div>
          </div>

          <div className={styles.topbarRight}>
            <div className={styles.systemStatusPill}>
              <span className={styles.statusDot} />
              <span>Live Systems</span>
            </div>

            <button
              type="button"
              className={styles.actionIconBtn}
              onClick={() => {
                if (typeof window !== 'undefined') window.location.reload();
              }}
              title="Sync & Refresh Data"
            >
              <RefreshCw size={14} />
              <span>Sync</span>
            </button>
          </div>
        </header>

        <main className={styles.contentArea}>{children}</main>
      </div>
    </div>
  );
}
