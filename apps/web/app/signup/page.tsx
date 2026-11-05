'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, ShieldCheck, Quote, ArrowLeft, UserCircle, AlertCircle } from 'lucide-react';
import { auth, token, ApiError } from '../lib/api';
import styles from './page.module.css';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10 || name.length < 2) return;
    setError('');
    setLoading(true);
    try {
      await auth.requestOtp(phone, 'customer', true);
      setOtpSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not send OTP. Please check your network connection.');
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
      const res = await auth.verifyOtp(phone, otp, 'customer', name, true);
      token.set(res.accessToken, res.refreshToken);
      token.setRole('customer');
      const next = new URLSearchParams(window.location.search).get('next') ?? '/bookings';
      router.push(next);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Account verification failed. Please try again.');
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
        <div className={styles.glassCard} style={{ flexDirection: 'row-reverse' }}>

          {/* Right Side (visually): Form */}
          <div className={styles.leftPanel}>
            <Link href="/" className={styles.logo}>
              <img src="/logo.png" alt="Triveni" className={styles.logoImg} />
            </Link>

            <div className={styles.formWrapper}>
              <h1 className={styles.title}>Create an account</h1>
              <p className={styles.subtitle}>Join Triveni Transports to start moving.</p>

              {error && (
                <div className={styles.errorBanner}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {!otpSent ? (
                <form className={styles.form} onSubmit={requestOtp}>
                  <div className={styles.inputGroup}>
                    <label>Full Name</label>
                    <div className={styles.inputWrapper}>
                      <input
                        className={`${styles.input} ${styles.inputName}`}
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        autoFocus
                      />
                      <UserCircle size={18} className={styles.inputIcon} />
                    </div>
                  </div>

                  <div className={styles.inputGroup}>
                    <label>Phone Number</label>
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
                      />
                      <Phone size={18} className={styles.inputIcon} />
                    </div>
                  </div>

                  <div className={styles.formOptions}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" required />
                      <span>I agree to the Terms & Conditions</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={phone.length < 10 || name.length < 2 || loading}
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
                    {loading ? <span className={styles.spinner} /> : 'Verify & Create Account'}
                  </button>

                  <button
                    type="button"
                    className={styles.backBtn}
                    onClick={() => setOtpSent(false)}
                  >
                    <ArrowLeft size={16} /> Edit details
                  </button>
                </form>
              )}

              <div className={styles.footerLinks}>
                <p>Already have an account? <Link href="/login">Sign in</Link></p>
              </div>
            </div>
          </div>

          {/* Left Side (visually): Showcase */}
          <div className={styles.rightPanel}>
            <div className={styles.showcaseContent}>
              <h2 className={styles.showcaseTitle}>Join thousands of happy families.</h2>
              <div className={styles.quoteWrapper}>
                <Quote size={40} className={styles.quoteIcon} />
                <p className={styles.quoteText}>
                  &quot;The packing team was extremely professional. Not a single scratch on my fragile items, and they delivered exactly on time!&quot;
                </p>
                <div className={styles.author}>
                  <p className={styles.authorName}>Priya Patel</p>
                  <p className={styles.authorRole}>Moved within Mumbai • Verified Customer</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
