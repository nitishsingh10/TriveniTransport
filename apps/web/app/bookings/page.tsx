import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Link from 'next/link';
import styles from './page.module.css';

const MOCK_BOOKINGS = [
  { id: 'b1', status: 'CONFIRMED', pickup: 'Thane West', drop: 'Andheri East', date: '2026-09-25', amount: 12500 },
  { id: 'b2', status: 'EN_ROUTE', pickup: 'Powai', drop: 'Bandra West', date: '2026-09-21', amount: 8900 },
  { id: 'b3', status: 'COMPLETED', pickup: 'Mulund', drop: 'Borivali', date: '2026-09-15', amount: 15200 },
  { id: 'b4', status: 'CANCELLED', pickup: 'Dadar', drop: 'Pune', date: '2026-09-10', amount: 22000 },
];

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  REQUESTED: { label: 'Requested', className: 'badge-info' },
  QUOTED: { label: 'Quoted', className: 'badge-info' },
  CONFIRMED: { label: 'Confirmed', className: 'badge-success' },
  ASSIGNED: { label: 'Assigned', className: 'badge-info' },
  EN_ROUTE: { label: 'En Route', className: 'badge-warning' },
  ARRIVED: { label: 'Arrived', className: 'badge-warning' },
  IN_PROGRESS: { label: 'In Progress', className: 'badge-warning' },
  COMPLETED: { label: 'Completed', className: 'badge-success' },
  CANCELLED: { label: 'Cancelled', className: 'badge-error' },
};

export default function BookingsPage() {
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

          <div className={styles.list}>
            {MOCK_BOOKINGS.map(b => {
              const status = STATUS_MAP[b.status] || STATUS_MAP.REQUESTED;
              return (
                <Link href={`/booking/${b.id}`} key={b.id} className={styles.bookingCard}>
                  <div className={styles.bookingTop}>
                    <span className={styles.bookingId}>#{b.id}</span>
                    <span className={`badge ${status.className}`}>{status.label}</span>
                  </div>
                  <div className={styles.route}>
                    <span className={styles.routeFrom}>📍 {b.pickup}</span>
                    <span className={styles.routeArrow}>→</span>
                    <span className={styles.routeTo}>📍 {b.drop}</span>
                  </div>
                  <div className={styles.bookingBottom}>
                    <span className={styles.bookingDate}>📅 {b.date}</span>
                    <span className={styles.bookingAmount}>₹{b.amount.toLocaleString('en-IN')}</span>
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
