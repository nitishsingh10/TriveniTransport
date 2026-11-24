'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Phone, ShieldCheck, UserCircle } from 'lucide-react';
import { ApiError, customer, token } from '../lib/api';
import { useAuth } from '../lib/useAuth';
import { getRoleSafeDestination } from '../lib/authNavigation';
import { useOtpResendCooldown } from '../lib/useOtpResendCooldown';
import styles from './page.module.css';

const normalizePhone = (value?: string | null) => (value || '').replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');

export default function CompleteProfilePage() {
  const router = useRouter();
  const { isLoggedIn, role, user, loading: authLoading } = useAuth();
  const [name, setName] = useState(() => user?.name && !['customer', 'valued customer'].includes(user.name.trim().toLowerCase()) ? user.name : '');
  const [phone, setPhone] = useState('');
  const [currentPhone, setCurrentPhone] = useState('');
  const [profileEmail, setProfileEmail] = useState(user?.email || '');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState('');
  const { secondsRemaining, start: startCooldown, reset: resetCooldown } = useOtpResendCooldown();

  useEffect(() => {
    if (user?.email) setProfileEmail(user.email);
    if (!name && user?.name && !['customer', 'valued customer'].includes(user.name.trim().toLowerCase())) setName(user.name);
  }, [user, name]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn) {
      router.replace('/login?next=/complete-profile');
      setChecking(false);
      return;
    }
    if (role && role !== 'customer') {
      router.replace(getRoleSafeDestination(role));
      setChecking(false);
      return;
    }

    let active = true;
    customer.getProfile().then((profile) => {
      if (!active) return;
      if (profile.profileCompleted) {
        token.setUser({
          ...(token.getUser() || {}),
          id: profile.id,
          role: 'customer',
          name: profile.name,
          phone: profile.phone || '',
          email: profile.email || undefined,
          profileCompleted: true,
        });
        router.replace('/bookings');
        return;
      }
      setName(profile.name && !['customer', 'valued customer'].includes(profile.name.trim().toLowerCase()) ? profile.name : '');
      setPhone(normalizePhone(profile.phone));
      setCurrentPhone(normalizePhone(profile.phone));
      setProfileEmail(profile.email || '');
    }).catch((e) => {
      if (active) setError(e instanceof ApiError ? e.message : 'Could not load your profile. Please try again.');
    }).finally(() => {
      if (active) setChecking(false);
    });
    return () => { active = false; };
  }, [authLoading, isLoggedIn, role, router]);

  const cleanPhone = normalizePhone(phone);
  const phoneValid = /^[6-9]\d{9}$/.test(cleanPhone);
  const nameValid = name.trim().length >= 2 && name.trim().length <= 100;
  const hasVerifiedEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileEmail.trim());
  const hasExistingPhone = /^[6-9]\d{9}$/.test(currentPhone);

  const finishProfile = async (savedPhone: string) => {
    const profile = await customer.updateProfile({ name: name.trim(), phone: savedPhone });
    token.setUser({
      ...(token.getUser() || {}),
      id: profile.id,
      role: 'customer',
      name: profile.name,
      phone: profile.phone || savedPhone,
      email: profile.email || undefined,
      profileCompleted: true,
    });
    router.replace('/bookings');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!nameValid) return setError('Enter your full name (2–100 characters).');
    if (!phoneValid) return setError('Enter a valid 10-digit Indian mobile number.');

    setLoading(true);
    try {
      // Adding phone number as next step of creating account:
      // Verification is NOT required.
      if (!hasExistingPhone) {
        await finishProfile(cleanPhone);
        return;
      }

      // Changing an existing phone number requires OTP verification:
      if (otpSent) {
        const verified = await customer.verifyPhoneOtp(cleanPhone, otp);
        setCurrentPhone(normalizePhone(verified.phone));
        setOtpSent(false);
        setOtp('');
        await finishProfile(normalizePhone(verified.phone) || cleanPhone);
      } else if (currentPhone === cleanPhone) {
        await finishProfile(cleanPhone);
      } else {
        await customer.requestPhoneOtp(cleanPhone);
        setOtpSent(true);
        setOtp('');
        startCooldown();
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save your details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (loading || secondsRemaining > 0) return;
    setLoading(true);
    setError('');
    try {
      await customer.requestPhoneOtp(cleanPhone);
      setOtp('');
      startCooldown();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not resend the OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.glow} />
      <section className={styles.card} aria-busy={checking}>
        <div className={styles.brand} aria-label="Triveni Transports">
          <img src="/logo-cropped.png" alt="" width="42" height="42" />
          <span className={styles.brandName}>TRIVENI <small>TRANSPORTS</small></span>
        </div>
        {checking ? <p className={styles.subtitle}>Loading your profile…</p> : (
          <>
            <div className={styles.icon}><CheckCircle2 size={26} /></div>
            <h1>Complete your profile</h1>
            <p className={styles.subtitle}>
              {!hasExistingPhone
                ? 'Please add your full name and 10-digit mobile number to complete your account setup.'
                : 'Update your details to coordinate your move and receive booking updates.'}
            </p>
            {error && <div className={styles.error}><AlertCircle size={17} /><span>{error}</span></div>}
            <form onSubmit={handleSubmit} className={styles.form}>
              <label htmlFor="profile-name">Full name</label>
              <div className={styles.inputWrap}>
                <input id="profile-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={100} required />
                <UserCircle size={18} />
              </div>
              {hasVerifiedEmail && (
                <div className={styles.verifiedEmail}>
                  <ShieldCheck size={18} />
                  <span><strong>Verified email</strong><br />{profileEmail}</span>
                  <CheckCircle2 size={17} />
                </div>
              )}
              <label htmlFor="profile-phone">Mobile number</label>
              <div className={styles.inputWrap}>
                <span className={styles.country}>+91</span>
                <input id="profile-phone" value={phone} onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); setOtpSent(false); setOtp(''); resetCooldown(); }} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10} placeholder="99999 99999" required />
                <Phone size={18} />
              </div>
              {otpSent && <>
                <label htmlFor="profile-otp">Mobile verification code</label>
                <div className={styles.inputWrap}>
                  <input id="profile-otp" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="6-digit OTP" required />
                  <ShieldCheck size={18} />
                </div>
                <p className={styles.hint}>Enter the OTP sent to +91 {cleanPhone}.</p>
                <button type="button" className={styles.resend} onClick={resendOtp} disabled={loading || secondsRemaining > 0}>{secondsRemaining > 0 ? `Resend code in ${secondsRemaining}s` : 'Resend code'}</button>
              </>}
              <button className={styles.submit} type="submit" disabled={loading || !nameValid || !phoneValid || (otpSent && otp.length !== 6)}>
                {loading ? 'Please wait…' : !hasExistingPhone ? 'Complete account' : otpSent ? 'Verify number & continue' : currentPhone === cleanPhone ? 'Save profile' : 'Send mobile OTP'}
              </button>
            </form>
            <button type="button" className={styles.signout} onClick={() => { token.clear(); router.replace('/login'); }}>Sign out</button>
          </>
        )}
      </section>
    </main>
  );
}
