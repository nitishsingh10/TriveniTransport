'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  PhoneCall,
  Package,
  Truck,
  ShieldCheck,
  LogOut,
  ChevronDown,
  MapPin,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../lib/useAuth';
import styles from './Navbar.module.css';

export default function Navbar() {
  const router = useRouter();
  const { isLoggedIn, role, user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [locDropdownOpen, setLocDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locDropdownRef = useRef<HTMLLIElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (locDropdownRef.current && !locDropdownRef.current.contains(e.target as Node)) {
        setLocDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setUserDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const closeMenu = () => {
    setMobileOpen(false);
    setUserDropdownOpen(false);
    setLocDropdownOpen(false);
  };

  const handleLogout = async () => {
    closeMenu();
    await logout();
    router.push('/');
  };

  const userInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : role === 'vendor'
    ? 'P'
    : role === 'admin'
    ? 'A'
    : 'C';

  const roleLabel =
    role === 'vendor'
      ? 'Driver Partner'
      : role === 'admin'
      ? 'Administrator'
      : 'Customer';

  const displayName = user?.name || (role === 'vendor' ? 'Partner' : role === 'admin' ? 'Admin' : 'Customer');

  return (
    <>
      <nav className={styles.navbar}>
        <div className={`container ${styles.inner}`}>
          <Link href="/" className={styles.logo} onClick={closeMenu}>
            <img src="/logo-cropped.png" alt="Triveni Transports Logo" className={styles.logoImage} />
            <div className={styles.logoTextWrapper}>
              <span className={styles.logoTitle}>TRIVENI</span>
              <div className={styles.logoSubtitleRow}>
                <span className={styles.subDash} aria-hidden="true" />
                <span className={styles.logoSubtitle}>TRANSPORTS</span>
                <span className={styles.subDash} aria-hidden="true" />
              </div>
              <span className={styles.logoTagline}>SAFE HANDS FOR YOUR SHIFTING PLANS</span>
            </div>
          </Link>

          <ul className={`${styles.navLinks} ${mobileOpen ? styles.open : ''}`}>
            {/* Mobile User Profile Header (Visible only when drawer is open and user is logged in) */}
            {isLoggedIn && (
              <li className={styles.mobileOnlyLink}>
                <div className={styles.mobileUserCard}>
                  <div className={styles.avatarCircle}>
                    {userInitial}
                    <span className={styles.statusDot} />
                  </div>
                  <div className={styles.mobileUserInfo}>
                    <span className={styles.mobileUserName}>{displayName}</span>
                    <span className={styles.mobileUserSub}>{user?.phone || user?.email || roleLabel}</span>
                    <span className={styles.mobileRoleBadge}>{roleLabel}</span>
                  </div>
                </div>
              </li>
            )}

            <li>
              <Link href="/" onClick={closeMenu}>Home</Link>
            </li>

            {/* My Bookings in Nav: Shown directly when logged in as Customer */}
            {isLoggedIn && role === 'customer' && (
              <li>
                <Link href="/bookings" onClick={closeMenu} style={{ color: 'var(--brand-900)', fontWeight: 700 }}>
                  My Bookings
                  <span className={styles.bookingsNavDot} />
                </Link>
              </li>
            )}

            {/* Fleet portal link when logged in as Vendor */}
            {isLoggedIn && role === 'vendor' && (
              <li>
                <Link href="/admin/fleet" onClick={closeMenu} style={{ color: 'var(--brand-900)', fontWeight: 700 }}>
                  Fleet Portal
                </Link>
              </li>
            )}

            {/* Admin Console link when logged in as Admin */}
            {isLoggedIn && role === 'admin' && (
              <li>
                <Link href="/admin" onClick={closeMenu} style={{ color: 'var(--brand-900)', fontWeight: 700 }}>
                  Admin Console
                </Link>
              </li>
            )}

            <li>
              <Link href="/services" onClick={closeMenu}>Services</Link>
            </li>

            {/* Locations dropdown — desktop hover / mobile toggle */}
            <li
              className={styles.locDropdownWrapper}
              ref={locDropdownRef}
              onMouseEnter={() => setLocDropdownOpen(true)}
              onMouseLeave={() => setLocDropdownOpen(false)}
            >
              <button
                type="button"
                className={styles.locTrigger}
                onClick={() => setLocDropdownOpen(!locDropdownOpen)}
                aria-expanded={locDropdownOpen}
              >
                <MapPin size={14} />
                <span>Locations</span>
                <ChevronDown size={13} className={`${styles.locChevron} ${locDropdownOpen ? styles.locChevronOpen : ''}`} />
              </button>
              {locDropdownOpen && (
                <div className={styles.locDropdown}>
                  <Link
                    href="/packers-and-movers-thane"
                    className={styles.locItem}
                    onClick={closeMenu}
                  >
                    <MapPin size={14} />
                    <div>
                      <div className={styles.locItemTitle}>Thane</div>
                      <div className={styles.locItemSub}>Ghodbunder Rd, GB Road, Majiwada</div>
                    </div>
                  </Link>
                  <Link
                    href="/packers-and-movers-mumbai"
                    className={styles.locItem}
                    onClick={closeMenu}
                  >
                    <MapPin size={14} />
                    <div>
                      <div className={styles.locItemTitle}>Mumbai</div>
                      <div className={styles.locItemSub}>Andheri, Bandra, Powai, South Mumbai</div>
                    </div>
                  </Link>
                </div>
              )}
            </li>

            <li>
              <Link href="/quote" onClick={closeMenu}>Get Quote</Link>
            </li>

            {/* Work with us is shown for public visitors only */}
            {!isLoggedIn && (
              <li>
                <Link href="/vendor/signup" onClick={closeMenu}>Work with Us</Link>
              </li>
            )}

            {/* Mobile-only Login / Logout items */}
            {!isLoggedIn ? (
              <li>
                <Link href="/login" onClick={closeMenu} className={styles.mobileOnlyLink}>
                  Customer Login
                </Link>
              </li>
            ) : (
              <li className={`${styles.mobileOnlyLink} ${styles.mobileLogoutRow}`}>
                <button type="button" className={styles.mobileLogoutBtn} onClick={handleLogout}>
                  <LogOut size={16} /> Sign Out
                </button>
              </li>
            )}

            <li className={styles.mobileActions}>
              <Link href="/quote" className={`btn btn-accent ${styles.mobileCta}`} onClick={closeMenu}>
                Get Instant Quote <ArrowRight size={16} />
              </Link>
              <div className={styles.mobileSupport}>
                <PhoneCall size={14} className={styles.mobileSupportIcon} />
                <span>Call 24/7: <strong>8828647785</strong></span>
              </div>
            </li>
          </ul>

          <div className={styles.actions}>
            {!isLoggedIn ? (
              /* Non-Logged In State */
              <Link href="/login" className={`btn btn-primary btn-sm ${styles.desktopLogin}`}>
                Login
              </Link>
            ) : (
              /* Logged In State */
              <div className={styles.authActions}>
                {role === 'customer' && (
                  <Link href="/bookings" className={styles.bookingsLinkBtn}>
                    <Package size={15} />
                    <span>My Bookings</span>
                  </Link>
                )}

                {role === 'vendor' && (
                  <Link href="/admin/fleet" className={styles.bookingsLinkBtn}>
                    <Truck size={15} />
                    <span>Fleet Portal</span>
                  </Link>
                )}

                {role === 'admin' && (
                  <Link href="/admin" className={styles.bookingsLinkBtn}>
                    <ShieldCheck size={15} />
                    <span>Admin</span>
                  </Link>
                )}

                {/* User Dropdown Pill */}
                <div className={styles.userMenuWrapper} ref={dropdownRef}>
                  <button
                    type="button"
                    className={styles.userPill}
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    aria-expanded={userDropdownOpen}
                    title="Account details"
                  >
                    <div className={styles.avatarCircle}>
                      {userInitial}
                      <span className={styles.statusDot} />
                    </div>
                    <span className={styles.userPillName}>{displayName}</span>
                    <ChevronDown
                      size={14}
                      className={`${styles.userPillChevron} ${userDropdownOpen ? styles.userPillChevronOpen : ''}`}
                    />
                  </button>

                  {userDropdownOpen && (
                    <div className={styles.userDropdown}>
                      <div className={styles.dropdownHeader}>
                        <div className={styles.dropdownName}>{displayName}</div>
                        {(user?.phone || user?.email) && (
                          <div className={styles.dropdownContact}>
                            {user.phone || user.email}
                          </div>
                        )}
                        <span className={styles.dropdownBadge}>{roleLabel}</span>
                      </div>

                      {role === 'customer' && (
                        <Link
                          href="/bookings"
                          className={styles.dropdownItem}
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Package size={16} /> My Bookings
                        </Link>
                      )}

                      {role === 'vendor' && (
                        <Link
                          href="/admin/fleet"
                          className={styles.dropdownItem}
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Truck size={16} /> Fleet Duty Dashboard
                        </Link>
                      )}

                      {role === 'admin' && (
                        <Link
                          href="/admin"
                          className={styles.dropdownItem}
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <ShieldCheck size={16} /> Dispatch Console
                        </Link>
                      )}

                      <Link
                        href="/quote"
                        className={styles.dropdownItem}
                        onClick={() => setUserDropdownOpen(false)}
                      >
                        <ArrowRight size={16} /> Plan New Move
                      </Link>

                      <div className={styles.dropdownDivider} />

                      <button
                        type="button"
                        className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                        onClick={handleLogout}
                      >
                        <LogOut size={16} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              className={`${styles.burger} ${mobileOpen ? styles.burgerOpen : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className={styles.overlay}
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
}
