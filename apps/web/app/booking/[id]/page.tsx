'use client';

import { use } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import styles from './page.module.css';

const STATUSES = ['REQUESTED', 'QUOTED', 'CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'];
const STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Requested', QUOTED: 'Quoted', CONFIRMED: 'Confirmed',
  ASSIGNED: 'Assigned', EN_ROUTE: 'En Route', ARRIVED: 'Arrived',
  IN_PROGRESS: 'In Progress', COMPLETED: 'Completed',
};

// Mock data
const MOCK_BOOKING = {
  id: 'b1',
  status: 'EN_ROUTE',
  pickup: 'A-201, Hiranandani Estate, Thane West 400607',
  drop: '305, Lokhandwala Complex, Andheri West 400053',
  date: '2026-09-25',
  slot: '9:00 AM - 12:00 PM',
  config: '2 BHK',
  vendor: { name: 'Rajesh Kumar', phone: '9876543210' },
  vehicle: { type: 'Tata 407', reg: 'MH-04-AB-1234' },
  items: [
    { name: 'Double Bed', qty: 1, amount: 1560 },
    { name: 'Wardrobe (Large)', qty: 1, amount: 1950 },
    { name: 'Sofa (3 Seater)', qty: 1, amount: 1040 },
    { name: 'Refrigerator', qty: 1, amount: 910 },
    { name: 'Washing Machine', qty: 1, amount: 780 },
    { name: 'Kitchen Boxes', qty: 4, amount: 520 },
  ],
  subtotal: 6760,
  gst: 1217,
  total: 7977,
  advancePaid: 1595,
  remaining: 6382,
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const booking = MOCK_BOOKING;
  const currentIdx = STATUSES.indexOf(booking.status);

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className="container">
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>Booking #{id}</h1>
              <p className={styles.subtitle}>{booking.config} • {booking.date} • {booking.slot}</p>
            </div>
            <span className={`badge badge-warning`} style={{ fontSize: 'var(--text-sm)', padding: 'var(--space-2) var(--space-4)' }}>
              {STATUS_LABELS[booking.status]}
            </span>
          </div>

          {/* Status Tracker */}
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
              <div className={styles.trackerFill} style={{ width: `${(currentIdx / (STATUSES.length - 1)) * 100}%` }} />
            </div>
          </div>

          <div className={styles.grid}>
            {/* Left Column: Details */}
            <div className={styles.detailsCol}>
              {/* Route */}
              <div className="card">
                <h3 className={styles.cardTitle}>📍 Route</h3>
                <div className={styles.routeBox}>
                  <div className={styles.routePoint}>
                    <span className={styles.routeDot} style={{ background: 'var(--success-500)' }} />
                    <div>
                      <span className={styles.routeLabel}>Pickup</span>
                      <span className={styles.routeAddr}>{booking.pickup}</span>
                    </div>
                  </div>
                  <div className={styles.routeLine} />
                  <div className={styles.routePoint}>
                    <span className={styles.routeDot} style={{ background: 'var(--error-500)' }} />
                    <div>
                      <span className={styles.routeLabel}>Drop</span>
                      <span className={styles.routeAddr}>{booking.drop}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="card">
                <h3 className={styles.cardTitle}>📦 Items</h3>
                <div className={styles.itemsList}>
                  {booking.items.map(item => (
                    <div key={item.name} className={styles.itemRow}>
                      <span>{item.name} × {item.qty}</span>
                      <span className={styles.itemAmount}>₹{item.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Vendor & Vehicle */}
              <div className="card">
                <h3 className={styles.cardTitle}>🚚 Assigned Team</h3>
                <div className={styles.teamGrid}>
                  <div>
                    <span className={styles.teamLabel}>Driver</span>
                    <span className={styles.teamValue}>{booking.vendor.name}</span>
                    <span className={styles.teamSub}>📞 {booking.vendor.phone}</span>
                  </div>
                  <div>
                    <span className={styles.teamLabel}>Vehicle</span>
                    <span className={styles.teamValue}>{booking.vehicle.type}</span>
                    <span className={styles.teamSub}>{booking.vehicle.reg}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Payment Summary */}
            <div className={styles.summaryCol}>
              <div className={styles.summaryCard}>
                <h3 className={styles.cardTitle}>💳 Payment Summary</h3>
                <div className={styles.summaryRows}>
                  <div className={styles.summaryRow}>
                    <span>Subtotal</span>
                    <span>₹{booking.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>GST (18%)</span>
                    <span>₹{booking.gst.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                    <span>Total</span>
                    <span>₹{booking.total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={styles.summaryDivider} />
                  <div className={styles.summaryRow}>
                    <span>Advance Paid</span>
                    <span className={styles.paidAmount}>- ₹{booking.advancePaid.toLocaleString('en-IN')}</span>
                  </div>
                  <div className={`${styles.summaryRow} ${styles.summaryRemaining}`}>
                    <span>Balance Due</span>
                    <span>₹{booking.remaining.toLocaleString('en-IN')}</span>
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
                <a href="tel:+919999999999" className="btn btn-outline" style={{ width: '100%' }}>
                  📞 Call Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
