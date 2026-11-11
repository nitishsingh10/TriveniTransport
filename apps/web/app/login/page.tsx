'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Phone, Mail, ShieldCheck, Quote, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { auth, token } from '../lib/api';
import { ApiError } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import styles from './page.module.css';

type Method = 'phone' | 'email';

export default function LoginPage() {
  const router = useRouter();
  const { isLoggedIn, role, user, logout } = useAuth();
  const [method, setMethod] = useState<Method>('phone');
  const [identifier, setIdentifier] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isPhoneValid = method === 'phone' && identifier.replace(/\D/g, '').length === 10;
  const isEmailValid = method === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
  const canSubmit = method === 'phone' ? isPhoneValid : isEmailValid;
  const resolvedIdentifier = method === 'phone' ? identifier.replace(/\D/g, '') : identifier.trim().toLowerCase();

  const switchMethod = (m: Method) => {
    setMethod(m);
    setIdentifier('');
    setError('');
    setOtpSent(false);
    setOtp('');
  };

  const handleIdentifierChange = (val: string) => {
    // Smart detection: if user types an '@' or letters while in phone mode, switch to email
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
      await auth.requestOtp(resolvedIdentifier, 'customer');
      setOtpSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not send OTP. Please check your connection.');
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
      const res = await auth.verifyOtp(resolvedIdentifier, otp, 'customer');
      token.set(res.accessToken, res.refreshToken);
      token.setRole('customer');
      if (res.user) token.setUser(res.user);
      const next = new URLSearchParams(window.location.search).get('next') ?? '/bookings';
      router.push(next);
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

  if (isLoggedIn) {
    const next = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('next') : null;
    const destination = next || (role === 'vendor' ? '/admin/fleet' : role === 'admin' ? '/admin' : '/bookings');

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
                  Signed In as {role === 'vendor' ? 'Fleet Partner' : role === 'admin' ? 'Admin' : 'Customer'}
                </span>
                <h1 className={styles.title} style={{ marginTop: '0.75rem', marginBottom: '0.25rem' }}>
                  {user?.name || 'Welcome Back'}
                </h1>
                <p className={styles.subtitle} style={{ marginBottom: 0 }}>
                  {user?.phone || user?.email || 'You have an active session.'}
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
                  Sign Out / Use a Different Account
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
        <div className={styles.glassCard}>
          
          {/* Left Side: Form */}
          <div className={styles.leftPanel}>
            <Link href="/" className={styles.logo}>
              <img src="/logo.png" alt="Triveni" className={styles.logoImg} />
            </Link>

            <div className={styles.formWrapper}>
              <h1 className={styles.title}>Welcome back</h1>
              <p className={styles.subtitle}>Please enter your details to sign in.</p>

              {/* Error Banner */}
              {error && (
                <div className={styles.errorBanner}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {!otpSent ? (
                <form className={styles.form} onSubmit={requestOtp}>
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
                      <label>Mobile Number</label>
                      <div className={styles.inputWrapper}>
                        <span className={styles.countryCode}>+91</span>
                        <input
                          className={styles.input}
                          type="text"
                          inputMode="numeric"
                          placeholder="99999 99999"
                          maxLength={10}
                          value={identifier}
                          onChange={e => handleIdentifierChange(e.target.value)}
                          required
                          autoFocus
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
                        ✉️ Sign in with Email Address instead
                      </button>
                    </div>
                  ) : (
                    <div className={styles.inputGroup}>
                      <label>Email Address</label>
                      <div className={styles.inputWrapper}>
                        <input
                          className={`${styles.input} ${styles.inputEmail}`}
                          type="email"
                          placeholder="you@example.com"
                          value={identifier}
                          onChange={e => handleIdentifierChange(e.target.value)}
                          required
                          autoFocus
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
                        📱 Sign in with Mobile Number instead
                      </button>
                    </div>
                  )}
                  
                  <div className={styles.formOptions}>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" />
                      <span>Keep me logged in</span>
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
                    <label>Enter OTP</label>
                    <div className={styles.inputWrapper}>
                      <input
                        className={`${styles.input} ${styles.otpInput}`}
                        type="text"
                        inputMode="numeric"
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
                    onClick={() => { setOtpSent(false); setOtp(''); setError(''); }}
                  >
                    <ArrowLeft size={16} /> Change {method === 'phone' ? 'phone number' : 'email'}
                  </button>
                </form>
              )}

              <div className={styles.footerLinks}>
                <p>New to Triveni? <Link href="/signup">Create an account</Link></p>
              </div>
            </div>
          </div>

          {/* Right Side: Showcase */}
          <div className={styles.rightPanel}>
            <div className={styles.showcaseContent}>
              <h2 className={styles.showcaseTitle}>What our customers say.</h2>
              <div className={styles.quoteWrapper}>
                <Quote size={40} className={styles.quoteIcon} />
                <p className={styles.quoteText}>
                  &quot;Triveni Transports made my move from Thane to Pune absolutely effortless. The itemised, transparent pricing is a game changer.&quot;
                </p>
                <div className={styles.author}>
                  <p className={styles.authorName}>Rahul Sharma</p>
                  <p className={styles.authorRole}>Moved to Pune • Verified Customer</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
