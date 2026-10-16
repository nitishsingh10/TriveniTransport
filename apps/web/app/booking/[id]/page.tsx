'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { bookings, token, Booking, ApiError } from '../../lib/api';
import styles from './page.module.css';

const STATUSES = ['REQUESTED', 'QUOTED', 'CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Requested', QUOTED: 'Quoted', CONFIRMED: 'Confirmed',
  ASSIGNED: 'Assigned', EN_ROUTE: 'En Route', ARRIVED: 'Arrived',
  IN_PROGRESS: 'In Progress', COMPLETED: 'Completed',
  CANCELLED: 'Cancelled', DISPUTED: 'Disputed', REVISION_PENDING: 'Revision Pending',
};
const STATUS_BADGE: Record<string, string> = {
  CONFIRMED: 'badge-success', COMPLETED: 'badge-success',
  CANCELLED: 'badge-error', DISPUTED: 'badge-error',
  EN_ROUTE: 'badge-warning', ARRIVED: 'badge-warning',
  IN_PROGRESS: 'badge-warning', REVISION_PENDING: 'badge-warning',
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!token.isLoggedIn()) {
      router.replace(`/login?next=/booking/${id}`);
      return;
    }

    bookings
      .get(id)
      .then(setBooking)
      .catch(err => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace(`/login?next=/booking/${id}`);
        } else {
          setError(err instanceof ApiError ? err.message : 'Failed to load booking.');
        }
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleCancel = async () => {
    if (!booking || !confirm('Are you sure you want to cancel this booking?')) return;
    setCancelling(true);
    try {
      const updated = await bookings.cancel(id);
      setBooking(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not cancel booking.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className="container" style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            Loading booking details…
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !booking) {
    return (
      <>
        <Navbar />
        <main className={styles.main}>
          <div className="container" style={{ padding: '3rem 0' }}>
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '1rem', marginBottom: '1rem' }}>
              ⚠️ {error || 'Booking not found.'}
            </div>
            <Link href="/bookings" className="btn btn-outline">← Back to My Bookings</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const currentIdx = STATUSES.indexOf(booking.status);
  const isCancellable = ['REQUESTED', 'QUOTED', 'CONFIRMED'].includes(booking.status);
  const advancePaid = booking.payments
    ?.filter(p => p.type === 'advance' && p.status === 'captured')
    .reduce((s, p) => s + Number(p.amount), 0) ?? 0;
  const remaining = Number(booking.finalAmount) - advancePaid;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Booking #{id.slice(0, 8).toUpperCase()}</h1>
              <p className={styles.subtitle}>
                {booking.configurationType.toUpperCase().replace('BHK', ' BHK')} &nbsp;·&nbsp;
                {formatDate(booking.scheduledDate)} &nbsp;·&nbsp;
                {booking.scheduledSlot.charAt(0).toUpperCase() + booking.scheduledSlot.slice(1)}
              </p>
            </div>
            <span className={`badge ${STATUS_BADGE[booking.status] ?? 'badge-info'}`} style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-2) var(--space-4)' }}>
              {STATUS_LABELS[booking.status] ?? booking.status}
            </span>
          </div>

          {/* Status Tracker (only for active flow) */}
          {booking.status !== 'CANCELLED' && booking.status !== 'DISPUTED' && (
            <div className={styles.tracker}>
              {STATUSES.map((s, i) => (
                <div key={s} className={`${styles.trackerStep} ${i <= currentIdx ? styles.trackerDone : ''} ${i === currentIdx ? styles.trackerCurrent : ''}`}>
                  <div className={styles.trackerDot}>
                    {i < currentIdx ? '✓' : i === currentIdx ? '●' : ''}
                  </div>
                  <span className={styles.trackerLabel}>{STATUS_LABELS[s]}</span>
                </div>
              ))}
              <div className={styles.trackerLine}>
                <div className={styles.trackerFill} style={{ width: `${Math.max(0, currentIdx / (STATUSES.length - 1)) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Cancelled Banner */}
          {booking.status === 'CANCELLED' && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', fontWeight: 500 }}>
              🚫 This booking has been cancelled.
            </div>
          )}

          <div className={styles.grid}>
            {/* Left Column */}
            <div className={styles.detailsCol}>
              {/* Route */}
              <div className="card">
                <h3 className={styles.cardTitle}>📍 Route</h3>
                <div className={styles.routeBox}>
                  <div className={styles.routePoint}>
                    <span className={styles.routeDot} style={{ background: 'var(--success-500)' }} />
                    <div>
                      <span className={styles.routeLabel}>Pickup</span>
                      <span className={styles.routeAddr}>{booking.pickupAddress}</span>
                    </div>
                  </div>
                  <div className={styles.routeLine} />
                  <div className={styles.routePoint}>
                    <span className={styles.routeDot} style={{ background: 'var(--error-500)' }} />
                    <div>
                      <span className={styles.routeLabel}>Drop</span>
                      <span className={styles.routeAddr}>{booking.dropAddress}</span>
                    </div>
                  </div>
                </div>
                {booking.floorNumber > 0 && (
                  <p style={{ marginTop: '0.75rem', fontSize: 'var(--text-sm)', color: 'var(--gray-500)' }}>
                    Floor {booking.floorNumber} &nbsp;·&nbsp; Lift: {booking.liftAvailable ? 'Available' : 'Not available'}
                  </p>
                )}
              </div>

              {/* Items */}
              {booking.items && booking.items.length > 0 && (
                <div className="card">
                  <h3 className={styles.cardTitle}>📦 Items</h3>
                  <div className={styles.itemsList}>
                    {booking.items.map(item => (
                      <div key={item.id} className={styles.itemRow}>
                        <span>{item.customName ?? `Item ${item.id.slice(0, 6)}`} × {item.quantity}</span>
                        <span className={styles.itemAmount}>₹{Number(item.lineTotal).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Team */}
              {booking.vendor && (
                <div className="card">
                  <h3 className={styles.cardTitle}>🚚 Assigned Team</h3>
                  <div className={styles.teamGrid}>
                    <div>
                      <span className={styles.teamLabel}>Driver / Contact</span>
                      <span className={styles.teamValue}>{booking.vendor.name}</span>
                      <a href={`tel:${booking.vendor.phone}`} className={styles.teamSub}>📞 {booking.vendor.phone}</a>
                    </div>
                    {booking.vehicle && (
                      <div>
                        <span className={styles.teamLabel}>Vehicle</span>
                        <span className={styles.teamValue}>{booking.vehicle.type}</span>
                        <span className={styles.teamSub}>{booking.vehicle.registrationNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className={styles.summaryCol}>
              <div className={styles.summaryCard}>
                <h3 className={styles.cardTitle}>💳 Payment Summary</h3>
                <div className={styles.summaryRows}>
                  <div className={styles.summaryRow}>
                    <span>Total Amount</span>
                    <span>₹{Number(booking.finalAmount).toLocaleString('en-IN')}</span>
                  </div>
                  {advancePaid > 0 && (
                    <div className={styles.summaryRow}>
                      <span>Advance Paid</span>
                      <span className={styles.paidAmount}>− ₹{advancePaid.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className={`${styles.summaryRow} ${styles.summaryRemaining}`}>
                    <span>Balance Due</span>
                    <span>₹{remaining.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {booking.status === 'COMPLETED' && (
                  <button className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 'var(--space-6)' }}>
                    📄 Download Invoice
                  </button>
                )}
              </div>

              <div className="card" style={{ marginTop: 'var(--space-4)' }}>
                <h3 className={styles.cardTitle}>💬 Need Help?</h3>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', marginBottom: 'var(--space-4)' }}>
                  Contact us for any questions about your booking.
                </p>
                <a href="tel:+918828647785" className="btn btn-outline" style={{ width: '100%' }}>
                  📞 Call Support
                </a>
              </div>

              {isCancellable && (
                <div className="card" style={{ marginTop: 'var(--space-4)' }}>
                  <h3 className={styles.cardTitle}>Cancel Booking</h3>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--gray-500)', marginBottom: 'var(--space-4)' }}>
                    Bookings can be cancelled before the move begins.
                  </p>
                  <button
                    className="btn btn-outline"
                    style={{ width: '100%', color: '#dc2626', borderColor: '#fecaca' }}
                    onClick={handleCancel}
                    disabled={cancelling}
                  >
                    {cancelling ? 'Cancelling…' : '🚫 Cancel Booking'}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/bookings" className="btn btn-outline">← All Bookings</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
