'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, ShieldCheck, Quote, ArrowLeft, AlertCircle } from 'lucide-react';
import { auth, token, ApiError } from '../../lib/api';
import styles from './page.module.css';

export default function VendorLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setError('');
    setLoading(true);
    try {
      await auth.requestOtp(phone, 'vendor', false);
      setOtpSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not connect to partner dispatch service. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await auth.verifyOtp(phone, otp, 'vendor');
      token.set(res.accessToken, res.refreshToken);
      token.setRole('vendor');
      const next = new URLSearchParams(window.location.search).get('next') ?? '/admin/fleet';
      router.push(next);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Partner verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      {/* Mesh Gradient Background */}
      <div className={styles.bgMesh}>
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.blob3} />
      </div>

      <div className={styles.container}>
        <div className={styles.glassCard}>
          
          {/* Left Side: Form */}
          <div className={styles.leftPanel}>
            <Link href="/" className={styles.logo}>
              <img src="/logo.png" alt="Triveni" className={styles.logoImg} />
            </Link>

            <div className={styles.formWrapper}>
              <h1 className={styles.title}>Partner Login</h1>
              <p className={styles.subtitle}>Welcome back to the Triveni Partner network.</p>

              {error && (
                <div className={styles.errorBanner}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {!otpSent ? (
                <form className={styles.form} onSubmit={requestOtp}>
                  <div className={styles.inputGroup}>
                    <label>Registered Mobile Number</label>
                    <div className={styles.inputWrapper}>
                      <span className={styles.countryCode}>+91</span>
                      <input
                        className={styles.input}
                        type="tel"
                        placeholder="99999 99999"
                        maxLength={10}
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                        required
                        autoFocus
                      />
                      <Phone size={18} className={styles.inputIcon} />
                    </div>
                  </div>
                  
                  <div className={styles.formOptions}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" />
                      <span>Keep me logged in</span>
                    </label>
                  </div>

                  <button 
                    type="submit"
                    className={styles.submitBtn} 
                    disabled={phone.length < 10 || loading}
                  >
                    {loading ? <span className={styles.spinner} /> : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form className={styles.form} onSubmit={verifyOtp}>
                  <div className={styles.inputGroup}>
                    <label>Enter OTP</label>
                    <div className={styles.inputWrapper}>
                      <input
                        className={`${styles.input} ${styles.otpInput}`}
                        type="text"
                        placeholder="• • • • • •"
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        required
                        autoFocus
                      />
                      <ShieldCheck size={18} className={styles.inputIcon} />
                    </div>
                    <span className={styles.hint}>Sent to +91 {phone}</span>
                    {process.env.NODE_ENV !== 'production' && (
                      <span className={styles.hint} style={{ color: 'var(--accent-500)', fontWeight: 600 }}>
                        Dev mode: use OTP <strong>123456</strong>
                      </span>
                    )}
                  </div>

                  <button 
                    type="submit"
                    className={`${styles.submitBtn} ${styles.submitBtnAccent}`} 
                    disabled={otp.length < 6 || loading}
                  >
                    {loading ? <span className={styles.spinner} /> : 'Verify & Sign in'}
                  </button>

                  <button 
                    type="button"
                    className={styles.backBtn} 
                    onClick={() => setOtpSent(false)}
                  >
                    <ArrowLeft size={16} /> Change mobile number
                  </button>
                </form>
              )}

              <div className={styles.footerLinks}>
                <p>Want to become a partner? <Link href="/vendor/signup">Apply here</Link></p>
              </div>
            </div>
          </div>

          {/* Right Side: Showcase */}
          <div className={styles.rightPanel}>
            <div className={styles.showcaseContent}>
              <h2 className={styles.showcaseTitle}>Grow your transport business.</h2>
              <div className={styles.quoteWrapper}>
                <Quote size={40} className={styles.quoteIcon} />
                <p className={styles.quoteText}>
                  &quot;Partnering with Triveni as a vendor has boosted my bookings by 40%. The platform is seamless and the payments are always on time.&quot;
                </p>
                <div className={styles.author}>
                  <p className={styles.authorName}>Vikram Singh</p>
                  <p className={styles.authorRole}>Fleet Owner, Thane • Verified Partner</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
