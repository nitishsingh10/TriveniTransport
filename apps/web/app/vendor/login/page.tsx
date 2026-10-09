'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Phone, ShieldCheck, Quote, Star, ArrowLeft } from 'lucide-react';
import styles from './page.module.css';

export default function VendorLoginPage() {
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    setLoading(true);
    // In production: POST /api/v1/auth/otp/request (vendor role)
    setTimeout(() => {
      setOtpSent(true);
      setLoading(false);
    }, 800);
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) return;
    setLoading(true);
    // In production: POST /api/v1/auth/otp/verify (vendor role)
    setTimeout(() => {
      setLoading(false);
      window.location.href = '/vendor/dashboard';
    }, 800);
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
                  <div className={styles.authorStars}>
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} fill="currentColor" />)}
                  </div>
                  <p className={styles.authorName}>Vikram Singh</p>
                  <p className={styles.authorRole}>Fleet Owner, Thane</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
