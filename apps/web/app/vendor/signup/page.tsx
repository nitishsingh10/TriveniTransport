'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Mail, ShieldCheck, ArrowLeft, UserCircle, AlertCircle } from 'lucide-react';
import { auth, token, ApiError } from '../../lib/api';
import { useAuth } from '../../lib/useAuth';
import { getRoleSafeDestination } from '../../lib/authNavigation';
import { useOtpResendCooldown } from '../../lib/useOtpResendCooldown';
import styles from './page.module.css';

type Method = 'phone' | 'email';

export default function VendorSignupPage() {
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
      await auth.requestOtp(resolvedIdentifier, 'vendor', true, 'packers_movers');
      setOtpSent(true);
      setOtp('');
      startResendCooldown();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not submit application. Please check your network connection.');
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
      await auth.requestOtp(resolvedIdentifier, 'vendor', true, 'packers_movers');
      setOtp('');
      startResendCooldown();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not resend OTP. Please try again.');
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
      const res = await auth.verifyOtp(resolvedIdentifier, otp, 'vendor', name.trim(), true, 'packers_movers');
      token.set(res.accessToken, res.refreshToken);
      token.setRole('vendor');
      if (res.user) token.setUser(res.user);
      router.replace('/vendor/onboarding');
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Verification failed. Please try again.');
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
                {user?.name ? user.name.trim().charAt(0).toUpperCase() : 'P'}
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '3px 10px', borderRadius: 999, background: 'rgba(247,163,0,0.15)', color: '#B45309' }}>
                  Account Active · {role === 'vendor' ? 'Fleet Partner' : role === 'admin' ? 'Admin' : 'Customer'}
                </span>
                <h1 className={styles.title} style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                  {user?.name || 'Partner Account'}
                </h1>
                <p className={styles.subtitle} style={{ marginBottom: 0 }}>
                  You are already registered and signed in.
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
                  Register with Different Details
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
              <h1 className={styles.title}>Become a Partner</h1>
              <p className={styles.subtitle}>Join Triveni Transports to start earning.</p>

              {error && (
                <div className={styles.errorBanner}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {!otpSent ? (
                <form className={styles.form} onSubmit={requestOtp}>
                  <div className={styles.inputGroup}>
                    <label htmlFor="vendor-signup-name">Full Name / Company Name</label>
                    <div className={styles.inputWrapper}>
                      <input
                        className={`${styles.input} ${styles.inputName}`}
                        id="vendor-signup-name"
                        type="text"
                        placeholder="John Doe Logistics"
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
                      Business Email
                    </button>
                  </div>

                  {method === 'phone' ? (
                    <div className={styles.inputGroup}>
                      <label htmlFor="vendor-signup-phone">Mobile Number</label>
                      <div className={styles.inputWrapper}>
                        <span className={styles.countryCode}>+91</span>
                        <input
                          className={styles.input}
                          id="vendor-signup-phone"
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
                        ✉️ Register with Business Email instead
                      </button>
                    </div>
                  ) : (
                    <div className={styles.inputGroup}>
                      <label htmlFor="vendor-signup-email">Business Email Address</label>
                      <div className={styles.inputWrapper}>
                        <input
                          className={`${styles.input} ${styles.inputEmail}`}
                          id="vendor-signup-email"
                          type="email"
                          placeholder="business@example.com"
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
                      <span>I agree to the Vendor <Link href="/terms" target="_blank" rel="noreferrer">Terms &amp; Conditions</Link></span>
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
                    <label htmlFor="vendor-signup-otp">Enter OTP</label>
                    <div className={styles.inputWrapper}>
                      <input
                        className={`${styles.input} ${styles.otpInput}`}
                        id="vendor-signup-otp"
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
                    {loading ? <span className={styles.spinner} /> : 'Verify & Apply'}
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
                <p>Already a partner? <Link href="/vendor/login">Sign in</Link></p>
              </div>
            </div>
          </div>

          {/* Left Side (visually): Showcase */}
          <div className={styles.rightPanel}>
            <div className={styles.showcaseContent}>
              <h2 className={styles.showcaseTitle}>Apply to join the P&amp;M partner network.</h2>
              <div className={styles.quoteWrapper}>
                <ShieldCheck size={36} className={styles.quoteIcon} />
                <p className={styles.quoteText}>How approval works</p>
                <div className={styles.author}>
                  <p className={styles.authorName}>1. Verify your contact</p>
                  <p className={styles.authorRole}>2. Submit business details and documents</p>
                </div>
                <p className={styles.subtitle}>Triveni operations reviews the application. P&amp;M orders and supervisor tools stay locked until approval.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
