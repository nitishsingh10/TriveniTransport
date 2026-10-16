'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import { bookings, token, Booking, ApiError } from '../lib/api';
import styles from './page.module.css';

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: 'Requested', className: 'badge-info' },
  QUOTED: { label: 'Quoted', className: 'badge-info' },
  CONFIRMED: { label: 'Confirmed', className: 'badge-success' },
  ASSIGNED: { label: 'Assigned', className: 'badge-info' },
  EN_ROUTE: { label: 'En Route', className: 'badge-warning' },
  ARRIVED: { label: 'Arrived', className: 'badge-warning' },
  IN_PROGRESS: { label: 'In Progress', className: 'badge-warning' },
  REVISION_PENDING: { label: 'Revision Pending', className: 'badge-warning' },
  COMPLETED: { label: 'Completed', className: 'badge-success' },
  CANCELLED: { label: 'Cancelled', className: 'badge-error' },
  DISPUTED: { label: 'Disputed', className: 'badge-error' },
};

export default function BookingsPage() {
  const router = useRouter();
  const [list, setList] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token.isLoggedIn()) {
      router.replace('/login?next=/bookings');
      return;
    }

    bookings
      .list()
      .then(setList)
      .catch(err => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace('/login?next=/bookings');
        } else {
          setError(err instanceof ApiError ? err.message : 'Failed to load bookings.');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <h1 className={styles.title}>My Bookings</h1>
            <Link href="/quote" className="btn btn-primary">
              + New Booking
            </Link>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray-400)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
              Loading your bookings…
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
              ⚠️ {error}
            </div>
          )}

          {!loading && !error && list.length === 0 && (
            <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <h3 style={{ color: 'var(--gray-700)', marginBottom: '0.5rem' }}>No bookings yet</h3>
              <p style={{ color: 'var(--gray-500)', marginBottom: '1.5rem' }}>Get an instant quote and book your first move.</p>
              <Link href="/quote" className="btn btn-primary">Get a Quote</Link>
            </div>
          )}

          <div className={styles.list}>
            {list.map(b => {
              const status = STATUS_MAP[b.status] ?? STATUS_MAP.REQUESTED;
              return (
                <Link href={`/booking/${b.id}`} key={b.id} className={styles.bookingCard}>
                  <div className={styles.bookingTop}>
                    <span className={styles.bookingId}>#{b.id.slice(0, 8).toUpperCase()}</span>
                    <span className={`badge ${status.className}`}>{status.label}</span>
                  </div>
                  <div className={styles.route}>
                    <span className={styles.routeFrom}>📍 {b.pickupAddress}</span>
                    <span className={styles.routeArrow}>→</span>
                    <span className={styles.routeTo}>📍 {b.dropAddress}</span>
                  </div>
                  <div className={styles.bookingBottom}>
                    <span className={styles.bookingDate}>📅 {formatDate(b.scheduledDate)} · {b.scheduledSlot}</span>
                    <span className={styles.bookingAmount}>₹{Number(b.finalAmount).toLocaleString('en-IN')}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
