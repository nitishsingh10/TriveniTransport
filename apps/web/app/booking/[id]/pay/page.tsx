'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Banknote, CheckCircle2, ShieldCheck } from 'lucide-react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { bookings, token, ApiError, type Booking } from '../../../lib/api';
import { isCustomerProfileComplete } from '../../../lib/customerProfile';

export default function BookingPaymentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token.isLoggedIn()) {
      router.replace(`/login?next=/booking/${id}/pay`);
      return;
    }
    const storedUser = token.getUser();
    if (!isCustomerProfileComplete(storedUser)) {
      router.replace('/complete-profile');
      return;
    }
    bookings.get(id).then(setBooking).catch((err) => {
      if (err instanceof ApiError && (err.status === 403 || err.code === 'PHONE_NUMBER_REQUIRED')) {
        router.replace('/complete-profile');
        return;
      }
      setError('We could not load this booking. Please try again.');
    }).finally(() => setLoading(false));
  }, [id, router]);

  const confirmPaymentMethod = async () => {
    setConfirming(true);
    setError('');
    try {
      await bookings.confirmCod(id);
      router.replace(`/booking/${id}`);
    } catch {
      setError('We could not confirm your booking. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <>
      <Navbar />
      <main style={{ minHeight: '70vh', padding: '3rem 1rem', background: 'var(--gray-50)' }}>
        <section style={{ maxWidth: 640, margin: '0 auto', background: '#fff', borderRadius: 24, padding: 'clamp(1.25rem, 5vw, 2.5rem)', boxShadow: '0 18px 50px rgba(13,31,55,0.12)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 46, height: 46, display: 'grid', placeItems: 'center', borderRadius: 14, background: 'rgba(247,163,0,0.14)', color: '#B45309' }}><Banknote size={23} /></div>
            <div><div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1, color: '#B45309' }}>PAYMENT</div><h1 style={{ margin: '3px 0 0', fontSize: 26, color: '#0D1F37' }}>Choose how to pay</h1></div>
          </div>
          {loading ? <p>Loading booking…</p> : (
            <>
              <div style={{ padding: 20, borderRadius: 18, background: '#0D1F37', color: '#fff', marginBottom: 18 }}>
                <div style={{ fontSize: 11, color: '#CBD5E1', letterSpacing: 1 }}>ESTIMATED TOTAL</div>
                <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4 }}>₹{Number(booking?.finalAmount || booking?.baseQuoteAmount || 0).toLocaleString('en-IN')}</div>
                <div style={{ fontSize: 12, color: '#CBD5E1', marginTop: 8 }}>Booking #{id.slice(-6).toUpperCase()}</div>
              </div>
              <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start', border: '2px solid #F7A300', borderRadius: 16, padding: 17, background: 'rgba(247,163,0,0.08)' }}>
                <CheckCircle2 color="#B45309" size={20} />
                <div><strong style={{ color: '#0D1F37' }}>Cash or UPI to your driver</strong><p style={{ margin: '6px 0 0', color: '#486581', fontSize: 14, lineHeight: 1.55 }}>No advance payment is needed. Pay after your move is complete.</p></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '16px 0 22px', color: '#486581', fontSize: 12 }}><ShieldCheck size={15} /> Payment is made directly to your driver after delivery.</div>
              {error && <div role="alert" style={{ color: '#b91c1c', background: '#fef2f2', padding: 12, borderRadius: 10, marginBottom: 14 }}>{error}</div>}
              <button type="button" className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={confirmPaymentMethod} disabled={confirming || !booking}>
                {confirming ? 'Confirming…' : 'Confirm pay on move day'}
              </button>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
