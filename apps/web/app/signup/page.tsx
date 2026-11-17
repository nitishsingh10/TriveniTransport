'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Mail, ShieldCheck, Quote, ArrowLeft, AlertCircle, UserCircle } from 'lucide-react';
import { auth, token, ApiError } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { getRoleSafeDestination } from '../lib/authNavigation';
import { useOtpResendCooldown } from '../lib/useOtpResendCooldown';
import styles from './page.module.css';

type Method = 'phone' | 'email';

export default function SignupPage() {
  const router = useRouter();
  const { isLoggedIn, role, user, logout, loading: authLoading } = useAuth();
  const [method, setMethod] = useState<Method>('phone');
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { secondsRemaining, start: startResendCooldown, reset: resetResendCooldown } = useOtpResendCooldown();

  const phoneDigits = identifier.replace(/\D/g, '');
  const isPhoneValid = method === 'phone' && /^[6-9]\d{9}$/.test(phoneDigits);
  const isEmailValid = method === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
  const canSubmit = (method === 'phone' ? isPhoneValid : isEmailValid) && name.trim().length >= 2 && name.trim().length <= 150 && termsAccepted;
  const resolvedIdentifier = method === 'phone' ? phoneDigits : identifier.trim().toLowerCase();

  const switchMethod = (m: Method) => {
    setMethod(m);
    setIdentifier('');
    setError('');
    setOtpSent(false);
    setOtp('');
    resetResendCooldown();
  };

  const handleIdentifierChange = (val: string) => {
    if (method === 'phone' && (val.includes('@') || /[a-zA-Z]/.test(val))) {
      setMethod('email');
      setIdentifier(val);
      return;
    }
    if (method === 'phone') {
      setIdentifier(val.replace(/\D/g, ''));
    } else {
      setIdentifier(val);
    }
  };

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      await auth.requestOtp(resolvedIdentifier, 'customer', true);
      setOtpSent(true);
      setOtp('');
      startResendCooldown();
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

  const resendOtp = async () => {
    if (loading || secondsRemaining > 0) return;
    setError('');
    setLoading(true);
    try {
      await auth.requestOtp(resolvedIdentifier, 'customer', true);
      setOtp('');
      startResendCooldown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend OTP. Please check your network connection.');
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
      const res = await auth.verifyOtp(resolvedIdentifier, otp, 'customer', name.trim(), true);
      token.set(res.accessToken, res.refreshToken);
      token.setRole('customer');
      if (res.user) token.setUser(res.user);
      router.replace(getRoleSafeDestination('customer'));
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

  if (authLoading) {
    return <main className={styles.main} aria-busy="true"><div className={styles.container}><div className={styles.glassCard} role="status">Checking your session…</div></div></main>;
  }

  if (isLoggedIn) {
    const destination = getRoleSafeDestination(role);

    return (
      <main className={styles.main}>
        <div className={styles.bgMesh}>
          <div className={styles.blob1} />
          <div className={styles.blob2} />
          <div className={styles.blob3} />
        </div>
        <div className={styles.container}>
          <div className={styles.glassCard} style={{ maxWidth: 520, margin: '0 auto', padding: '2.5rem' }}>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #0D1F37, #1E3A8A)', color: '#F7A300', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', fontWeight: 800 }}>
                {user?.name ? user.name.trim().charAt(0).toUpperCase() : '✓'}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 10px', borderRadius: 999, background: 'rgba(247,163,0,0.15)', color: '#B45309' }}>
                  Account Active · {role === 'vendor' ? 'Fleet Partner' : role === 'admin' ? 'Admin' : 'Customer'}
                </span>
                <h1 className={styles.title} style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                  {user?.name || 'Welcome Back'}
                </h1>
                <p className={styles.subtitle} style={{ marginBottom: 0 }}>
                  You are already signed in.
                </p>
              </div>

              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
                <Link href={destination} className={styles.submitBtn}>
                  Continue to {role === 'vendor' ? 'Fleet Portal' : role === 'admin' ? 'Admin Console' : 'My Bookings'} →
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                  }}
                  className={styles.backBtn}
                  style={{ padding: '0.75rem', cursor: 'pointer' }}
                >
                  Create Account with Different Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

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
                    <label htmlFor="signup-name">Full Name</label>
                    <div className={styles.inputWrapper}>
                      <input
                        className={`${styles.input} ${styles.inputName}`}
                        id="signup-name"
                        type="text"
                        placeholder="Your name"
                        autoComplete="name"
                        maxLength={150}
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        autoFocus
                      />
                      <UserCircle size={18} className={styles.inputIcon} />
                    </div>
                  </div>

                  {/* Method Toggle */}
                  <div className={styles.methodToggle}>
                    <button
                      type="button"
                      className={`${styles.methodTab} ${method === 'phone' ? styles.methodTabActive : ''}`}
                      onClick={() => switchMethod('phone')}
                    >
                      <Phone size={14} />
                      Mobile Number
                    </button>
                    <button
                      type="button"
                      className={`${styles.methodTab} ${method === 'email' ? styles.methodTabActive : ''}`}
                      onClick={() => switchMethod('email')}
                    >
                      <Mail size={14} />
                      Email Address
                    </button>
                  </div>

                  {method === 'phone' ? (
                    <div className={styles.inputGroup}>
                    <label htmlFor="signup-phone">Mobile Number</label>
                      <div className={styles.inputWrapper}>
                        <span className={styles.countryCode}>+91</span>
                        <input
                          className={styles.input}
                          id="signup-phone"
                          type="tel"
                          inputMode="numeric"
                          placeholder="99999 99999"
                          maxLength={10}
                          pattern="[6-9][0-9]{9}"
                          value={identifier}
                          onChange={e => handleIdentifierChange(e.target.value)}
                          required
                        />
                        <Phone size={18} className={styles.inputIcon} />
                      </div>
                      <button
                        type="button"
                        onClick={() => switchMethod('email')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          padding: '4px 0 0 2px',
                          fontWeight: 500,
                        }}
                      >
                        ✉️ Register with Email Address instead
                      </button>
                    </div>
                  ) : (
                    <div className={styles.inputGroup}>
                    <label htmlFor="signup-email">Email Address</label>
                      <div className={styles.inputWrapper}>
                        <input
                          className={`${styles.input} ${styles.inputEmail}`}
                          id="signup-email"
                          type="email"
                          placeholder="you@example.com"
                          autoComplete="email"
                          value={identifier}
                          onChange={e => handleIdentifierChange(e.target.value)}
                          required
                        />
                        <Mail size={18} className={styles.inputIcon} />
                      </div>
                      <button
                        type="button"
                        onClick={() => switchMethod('phone')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#2563EB',
                          fontSize: '0.8rem',
                          textAlign: 'left',
                          cursor: 'pointer',
                          padding: '4px 0 0 2px',
                          fontWeight: 500,
                        }}
                      >
                        📱 Register with Mobile Number instead
                      </button>
                    </div>
                  )}

                  <div className={styles.formOptions}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" required checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                      <span>I agree to the <Link href="/terms" target="_blank" rel="noreferrer">Terms &amp; Conditions</Link></span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={!canSubmit || loading}
                  >
                    {loading ? <span className={styles.spinner} /> : 'Send OTP'}
                  </button>
                </form>
              ) : (
                <form className={styles.form} onSubmit={verifyOtp}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="signup-otp">Enter OTP</label>
                    <div className={styles.inputWrapper}>
                      <input
                        className={`${styles.input} ${styles.otpInput}`}
                        id="signup-otp"
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        placeholder="• • • • • •"
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        required
                        autoFocus
                      />
                      <ShieldCheck size={18} className={styles.inputIcon} />
                    </div>
                    <span className={styles.hint}>
                      {method === 'phone' ? `Sent via SMS to +91 ${identifier}` : `Sent via email to ${identifier}`}
                    </span>
                    {process.env.NODE_ENV !== 'production' && (
                      <span className={styles.hint} style={{ color: 'var(--accent-500)', fontWeight: 600 }}>
                        Local development: check the backend terminal for the current OTP.
                      </span>
                    )}
                    <button type="button" className={styles.resendButton} onClick={resendOtp} disabled={loading || secondsRemaining > 0}>
                      {loading ? 'Sending…' : secondsRemaining > 0 ? `Resend code in ${secondsRemaining}s` : 'Resend code'}
                    </button>
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
                    onClick={() => { setOtpSent(false); setOtp(''); setError(''); resetResendCooldown(); }}
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
