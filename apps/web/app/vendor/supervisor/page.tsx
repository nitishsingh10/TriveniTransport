'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarDays, LogOut, MapPin, RefreshCw, Truck } from 'lucide-react';
import { ApiError, token, vendor, VendorJob } from '../../lib/api';
import { useAuth } from '../../lib/useAuth';
import styles from './page.module.css';

const nextStatus: Record<string, { value: string; label: string }> = {
  ASSIGNED: { value: 'EN_ROUTE', label: 'Start route' },
  EN_ROUTE: { value: 'ARRIVED', label: 'Mark arrived' },
  ARRIVED: { value: 'IN_PROGRESS', label: 'Start work' },
  IN_PROGRESS: { value: 'COMPLETED', label: 'Complete order' },
};

export default function SupervisorPortalPage() {
  const router = useRouter();
  const { isLoggedIn, role, user, loading: authLoading } = useAuth();
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const loadJobs = useCallback(async () => {
    setBusy(true); setError('');
    try { setJobs(await vendor.getSupervisorJobs()); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Could not load your assigned orders.'); }
    finally { setBusy(false); }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || role !== 'supervisor') {
      router.replace('/vendor/supervisor/login');
      return;
    }
    let active = true;
    vendor.getSupervisorJobs()
      .then((nextJobs) => { if (active) setJobs(nextJobs); })
      .catch((cause) => { if (active) setError(cause instanceof ApiError ? cause.message : 'Could not load your assigned orders.'); })
      .finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [authLoading, isLoggedIn, role, router]);

  const updateStatus = async (job: VendorJob) => {
    const transition = nextStatus[job.status];
    if (!transition) return;
    setBusy(true); setError('');
    try { await vendor.updateSupervisorJobStatus(job.id, transition.value); await loadJobs(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not update this order.'); setBusy(false); }
  };

  if (authLoading || !isLoggedIn || role !== 'supervisor') return <main className={styles.loading}>Checking supervisor access…</main>;

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div><Link href="/" className={styles.brand}>TRIVENI <span>P&amp;M FIELD TEAM</span></Link><p className={styles.eyebrow}>OTP verified supervisor</p><h1>Hello, {user?.name || 'Supervisor'}</h1><p>Your vendor’s assigned orders appear here.</p></div>
          <div className={styles.actions}><button type="button" disabled={busy} onClick={() => void loadJobs()}><RefreshCw size={15} /> Refresh</button><button type="button" onClick={() => { token.clear(); router.replace('/vendor/supervisor/login'); }}><LogOut size={15} /> Sign out</button></div>
        </header>
        {error && <div className={styles.error} role="alert">{error}</div>}
        {busy && jobs.length === 0 ? <div className={styles.empty}>Loading assigned orders…</div> : jobs.length === 0 ? <div className={styles.empty}>No P&amp;M orders have been assigned to you yet.</div> : (
          <div className={styles.list}>{jobs.map((job) => (
            <article className={styles.job} key={job.id}>
              <div className={styles.jobHeader}><span>ORDER {job.id.slice(0, 8).toUpperCase()}</span><b>{job.status.replaceAll('_', ' ')}</b></div>
              <p className={styles.date}><CalendarDays size={15} /> {new Date(job.scheduledDate).toLocaleDateString('en-IN')} · {job.scheduledSlot}</p>
              <div className={styles.route}><p><MapPin size={15} />{job.pickupAddress}</p><p><MapPin size={15} />{job.dropAddress}</p></div>
              <div className={styles.customer}><strong>{job.customer?.name || 'Customer'}</strong><a href={`tel:${job.customer?.phone || ''}`}>{job.customer?.phone || 'Contact not available'}</a></div>
              {job.vehicle && <p className={styles.vehicle}><Truck size={15} /> {job.vehicle.type} · {job.vehicle.registrationNumber}</p>}
              {nextStatus[job.status] && <button type="button" className={styles.action} disabled={busy} onClick={() => void updateStatus(job)}>{nextStatus[job.status].label}</button>}
            </article>
          ))}</div>
        )}
      </div>
    </main>
  );
}
