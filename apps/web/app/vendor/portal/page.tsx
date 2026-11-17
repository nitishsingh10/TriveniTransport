'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, LogOut, MapPin, RefreshCw, Truck, UserRound } from 'lucide-react';
import { ApiError, vendor, VendorJob, VendorProfile, VendorVehicle } from '../../lib/api';
import { useAuth } from '../../lib/useAuth';
import styles from './page.module.css';

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function VendorPortalPage() {
  const router = useRouter();
  const { isLoggedIn, role, user, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [vehicles, setVehicles] = useState<VendorVehicle[]>([]);
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPortal = useCallback(() => Promise.all([
        vendor.getProfile(),
        vendor.getVehicles(),
        vendor.getJobs(),
      ]), []);

  const loadPortal = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextProfile, nextVehicles, nextJobs] = await fetchPortal();
      setProfile(nextProfile);
      setVehicles(nextVehicles);
      setJobs(nextJobs);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'We could not load your partner details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchPortal]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || role !== 'vendor') {
      router.replace('/vendor/login?next=%2Fvendor%2Fportal');
      return;
    }
    let active = true;
    fetchPortal()
      .then(([nextProfile, nextVehicles, nextJobs]) => {
        if (!active) return;
        setProfile(nextProfile);
        setVehicles(nextVehicles);
        setJobs(nextJobs);
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof ApiError ? cause.message : 'We could not load your partner details. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [authLoading, fetchPortal, isLoggedIn, role, router]);

  const handleLogout = async () => {
    await logout();
    router.replace('/vendor/login');
  };

  if (authLoading || !isLoggedIn || role !== 'vendor') {
    return <main className={styles.statusPage} role="status" aria-live="polite">Checking partner access…</main>;
  }

  const displayName = profile?.name || user?.name || 'Partner';

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <Link href="/" className={styles.brand}>TRIVENI <span>PARTNER PORTAL</span></Link>
            <p className={styles.eyebrow}>Fleet operations</p>
            <h1>Welcome, {displayName}</h1>
            <p className={styles.lede}>Your assignments, vehicles, and partner account in one place.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => void loadPortal()} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spinning : undefined} />
              Refresh
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleLogout}>
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </header>

        <section className={styles.summaryGrid} aria-label="Partner account summary">
          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}><UserRound size={18} /></span>
            <div><span className={styles.summaryLabel}>Account</span><strong>{profile?.status || 'Active partner'}</strong></div>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}><Truck size={18} /></span>
            <div><span className={styles.summaryLabel}>Active vehicles</span><strong>{vehicles.length}</strong></div>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}><CalendarDays size={18} /></span>
            <div><span className={styles.summaryLabel}>Moves in your queue</span><strong>{jobs.length}</strong></div>
          </article>
        </section>

        {error && (
          <div className={styles.error} role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => void loadPortal()}>Try again</button>
          </div>
        )}

        <div className={styles.columns}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div><p className={styles.eyebrow}>Assignments</p><h2>Available and assigned moves</h2></div>
              <span className={styles.count}>{jobs.length}</span>
            </div>
            {loading && jobs.length === 0 ? (
              <p className={styles.empty}>Loading your assignments…</p>
            ) : jobs.length === 0 ? (
              <p className={styles.empty}>There are no moves in your queue right now. New assignments will appear here.</p>
            ) : (
              <div className={styles.jobList}>
                {jobs.map((job) => (
                  <article className={styles.jobCard} key={job.id}>
                    <div className={styles.jobTop}>
                      <span className={styles.jobRef}>Move {job.id.slice(0, 8).toUpperCase()}</span>
                      <span className={styles.status}>{job.status.replaceAll('_', ' ')}</span>
                    </div>
                    <p className={styles.jobDate}><CalendarDays size={15} /> {formatDate(job.scheduledDate)} · {job.scheduledSlot}</p>
                    <div className={styles.route}>
                      <div><span className={styles.routeDot} /><p>{job.pickupAddress}</p></div>
                      <div><span className={`${styles.routeDot} ${styles.routeEnd}`} /><p>{job.dropAddress}</p></div>
                    </div>
                    {(job.customer?.name || job.vehicle) && (
                      <div className={styles.jobFooter}>
                        <span>{job.customer?.name || 'Customer'}</span>
                        {job.vehicle && <span>{job.vehicle.type} · {job.vehicle.registrationNumber}</span>}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className={styles.sideColumn}>
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.eyebrow}>Your fleet</p><h2>Vehicles</h2></div></div>
              {loading && vehicles.length === 0 ? (
                <p className={styles.empty}>Loading vehicles…</p>
              ) : vehicles.length === 0 ? (
                <p className={styles.empty}>No active vehicles are linked to this partner account yet.</p>
              ) : (
                <div className={styles.vehicleList}>
                  {vehicles.map((vehicle) => (
                    <article className={styles.vehicleCard} key={vehicle.id}>
                      <span className={styles.vehicleIcon}><Truck size={19} /></span>
                      <div><strong>{vehicle.registrationNumber}</strong><span>{vehicle.type} · {vehicle.capacityCft} CFT</span></div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <p className={styles.eyebrow}>Account details</p>
              <h2>{displayName}</h2>
              <p className={styles.contact}>{profile?.phone || user?.phone || 'Phone number not available'}</p>
              {profile?.email && <p className={styles.contact}>{profile.email}</p>}
              <p className={styles.accountNote}><MapPin size={15} /> Your job details are visible only to your signed-in partner account.</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
