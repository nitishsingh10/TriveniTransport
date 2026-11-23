'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { ApiError, auth, token } from '../../../lib/api';
import { useAuth } from '../../../lib/useAuth';
import styles from './page.module.css';

export default function SupervisorLoginPage() {
  const router = useRouter();
  const { isLoggedIn, role } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [invitation, setInvitation] = useState(true);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoggedIn && role === 'supervisor') router.replace('/vendor/supervisor');
  }, [isLoggedIn, role, router]);

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try { await auth.requestOtp(phone, 'supervisor', invitation); setSent(true); }
    catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Could not send the verification code.'); }
    finally { setBusy(false); }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const result = await auth.verifyOtp(phone, otp, 'supervisor', undefined, invitation);
      token.set(result.accessToken, result.refreshToken); token.setRole('supervisor');
      if (result.user) token.setUser(result.user);
      router.replace('/vendor/supervisor');
    } catch (cause) { setError(cause instanceof ApiError ? cause.message : 'Could not verify this code.'); }
    finally { setBusy(false); }
  };

  return (
    <main className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}><Truck size={21} /></div>
        <p className={styles.eyebrow}>Triveni · P&amp;M operations</p>
        <h1>Supervisor access</h1>
        <p className={styles.subtitle}>Use the mobile number your P&amp;M vendor invited. OTP verification is required before assigned orders are visible.</p>
        <div className={styles.mode}>
          <button type="button" className={invitation ? styles.modeActive : ''} onClick={() => { setInvitation(true); setSent(false); setOtp(''); setError(''); }}>Accept invitation</button>
          <button type="button" className={!invitation ? styles.modeActive : ''} onClick={() => { setInvitation(false); setSent(false); setOtp(''); setError(''); }}>Sign in</button>
        </div>
        {error && <div className={styles.error} role="alert">{error}</div>}
        {!sent ? (
          <form onSubmit={requestCode} className={styles.form}>
            <label>Mobile number<input value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} type="tel" inputMode="numeric" pattern="[6-9][0-9]{9}" maxLength={10} placeholder="99999 99999" required /></label>
            <button className={styles.submit} type="submit" disabled={busy}>{busy ? 'Sending code…' : 'Send OTP'} <ArrowRight size={16} /></button>
          </form>
        ) : (
          <form onSubmit={verify} className={styles.form}>
            <label>6-digit OTP<input value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" maxLength={6} placeholder="••••••" required /></label>
            <button className={styles.submit} type="submit" disabled={busy || otp.length !== 6}>{busy ? 'Verifying…' : 'Verify and continue'} <ShieldCheck size={16} /></button>
            <button type="button" className={styles.textButton} onClick={() => { setSent(false); setOtp(''); }}>Change mobile number</button>
          </form>
        )}
        <p className={styles.footer}>A vendor must invite your number before you can accept the invitation.</p>
      </div>
    </main>
  );
}
