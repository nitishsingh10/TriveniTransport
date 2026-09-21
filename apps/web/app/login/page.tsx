'use client';

import { useState } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from './page.module.css';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState<'customer' | 'vendor' | 'admin'>('customer');
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (phone.length < 10) return;
    setLoading(true);
    // In production: POST /api/v1/auth/otp/request
    setTimeout(() => {
      setOtpSent(true);
      setLoading(false);
    }, 800);
  };

  const verifyOtp = async () => {
    if (otp.length < 6) return;
    setLoading(true);
    // In production: POST /api/v1/auth/otp/verify
    setTimeout(() => {
      setLoading(false);
      window.location.href = role === 'admin' ? '/admin/dashboard' : '/bookings';
    }, 800);
  };

  return (
    <>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.loginCard}>
          <div className={styles.header}>
            <span className={styles.icon}>🔐</span>
            <h1 className={styles.title}>Welcome Back</h1>
            <p className={styles.subtitle}>Sign in with your phone number</p>
          </div>

          <div className={styles.roleSelector}>
            {(['customer', 'vendor', 'admin'] as const).map(r => (
              <button key={r} className={`${styles.roleBtn} ${role === r ? styles.roleActive : ''}`} onClick={() => setRole(r)}>
                {r === 'customer' ? '👤' : r === 'vendor' ? '🚚' : '⚙️'} {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          {!otpSent ? (
            <div className={styles.form}>
              <div className="input-group">
                <label>Phone Number</label>
                <div className={styles.phoneInput}>
                  <span className={styles.countryCode}>+91</span>
                  <input className="input-field" type="tel" placeholder="99999 99999" maxLength={10} value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, ''))} />
                </div>
              </div>
              <button className="btn btn-primary btn-lg" style={{ width: '100%' }} onClick={requestOtp} disabled={phone.length < 10 || loading}>
                {loading ? 'Sending...' : 'Send OTP →'}
              </button>
            </div>
          ) : (
            <div className={styles.form}>
              <div className="input-group">
                <label>Enter OTP</label>
                <input className={`input-field ${styles.otpInput}`} type="text" placeholder="• • • • • •" maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} autoFocus />
                <span className={styles.otpHint}>Sent to +91 {phone}</span>
              </div>
              <button className="btn btn-accent btn-lg" style={{ width: '100%' }} onClick={verifyOtp} disabled={otp.length < 6 || loading}>
                {loading ? 'Verifying...' : 'Verify & Login →'}
              </button>
              <button className={styles.resendBtn} onClick={() => setOtpSent(false)}>
                ← Change number
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
