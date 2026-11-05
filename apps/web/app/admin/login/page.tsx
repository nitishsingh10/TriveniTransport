'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, KeyRound, ArrowRight, Lock } from 'lucide-react';
import { auth, token, ApiError } from '../../lib/api';

type Method = 'phone' | 'email';

export default function AdminLoginPage() {
  const router = useRouter();
  const [method, setMethod] = useState<Method>('phone');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPhoneValid = method === 'phone' && identifier.replace(/\D/g, '').length === 10;
  const isEmailValid = method === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim());
  const canSubmit = method === 'phone' ? isPhoneValid : isEmailValid;
  const resolvedIdentifier = method === 'phone' ? identifier.replace(/\D/g, '') : identifier.trim().toLowerCase();

  const switchMethod = (m: Method) => {
    setMethod(m);
    setIdentifier('');
    setError(null);
    setStep('identifier');
    setOtp('');
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await auth.requestOtp(resolvedIdentifier, 'admin');
      setStep('otp');
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Could not send OTP. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await auth.verifyOtp(resolvedIdentifier, otp, 'admin');
      token.set(res.accessToken, res.refreshToken);
      token.setRole('admin');
      router.push('/admin');
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Invalid security code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: '#081220',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    padding: '12px 14px 12px 42px',
    borderRadius: '10px',
    color: '#FFFFFF',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #0D1F37 0%, #081220 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#FFFFFF',
        fontFamily: 'var(--font-inter, sans-serif)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#0D1F37',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '16px',
          padding: '36px 32px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #F7A300 0%, #D48800 100%)',
              color: '#081220',
              fontWeight: 900,
              fontSize: '26px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(247, 163, 0, 0.4)',
            }}
          >
            T
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px' }}>
            Triveni Super Admin
          </h1>
          <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
            Restricted Central Dispatch &amp; Financial Console
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#FCA5A5',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {step === 'identifier' ? (
          <form onSubmit={handleRequestOtp}>
            {/* Method Toggle */}
            <div
              style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                padding: '4px',
                marginBottom: '20px',
                gap: '4px',
              }}
            >
              {(['phone', 'email'] as Method[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMethod(m)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px',
                    borderRadius: '7px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    background: method === m ? '#F7A300' : 'transparent',
                    color: method === m ? '#081220' : '#94A3B8',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {m === 'phone' ? <Phone size={13} /> : <Mail size={13} />}
                  {m === 'phone' ? 'Mobile' : 'Email'}
                </button>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#94A3B8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '8px',
                }}
              >
                {method === 'phone' ? 'Admin Phone Number' : 'Admin Email Address'}
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {method === 'phone' ? (
                  <Phone size={16} style={{ position: 'absolute', left: 14, color: '#64748B' }} />
                ) : (
                  <Mail size={16} style={{ position: 'absolute', left: 14, color: '#64748B' }} />
                )}
                <input
                  type={method === 'phone' ? 'tel' : 'email'}
                  value={identifier}
                  onChange={e => setIdentifier(method === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value)}
                  placeholder={method === 'phone' ? '9999999999' : 'admin@triveni.com'}
                  maxLength={method === 'phone' ? 10 : undefined}
                  required
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !canSubmit}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #F7A300 0%, #D48800 100%)',
                color: '#081220',
                border: 'none',
                padding: '13px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '15px',
                cursor: loading || !canSubmit ? 'not-allowed' : 'pointer',
                opacity: loading || !canSubmit ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(247, 163, 0, 0.3)',
              }}
            >
              <span>{loading ? 'Transmitting OTP...' : 'Request Security Code'}</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#94A3B8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  Enter 6-Digit OTP
                </label>
                {process.env.NODE_ENV !== 'production' && (
                  <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                    Dev Code: 123456
                  </span>
                )}
              </div>
              <p style={{ fontSize: '12px', color: '#64748B', marginBottom: '10px' }}>
                {method === 'phone' ? `Sent via SMS to +91 ${identifier}` : `Sent via email to ${identifier}`}
              </p>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound
                  size={16}
                  style={{ position: 'absolute', left: 14, color: '#64748B' }}
                />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  required
                  style={{ ...inputStyle, fontSize: '18px', letterSpacing: '0.25em' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #F7A300 0%, #D48800 100%)',
                color: '#081220',
                border: 'none',
                padding: '13px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(247, 163, 0, 0.3)',
              }}
            >
              <span>{loading ? 'Authenticating...' : 'Authorize Dispatcher Access'}</span>
              <Lock size={16} />
            </button>

            <button
              type="button"
              onClick={() => { setStep('identifier'); setOtp(''); setError(null); }}
              style={{
                width: '100%',
                marginTop: '12px',
                background: 'transparent',
                color: '#64748B',
                border: 'none',
                fontSize: '13px',
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              ← Change {method === 'phone' ? 'phone number' : 'email'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
