'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, KeyRound, ArrowRight, Lock } from 'lucide-react';
import { auth, token, ApiError } from '../../lib/api';

export default function AdminLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await auth.requestOtp(phone, 'admin');
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
      const res = await auth.verifyOtp(phone, otp, 'admin');
      token.set(res.accessToken, res.refreshToken);
      token.setRole('admin');
      router.push('/admin');
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : 'Invalid security code. Please try again.');
    } finally {
      setLoading(false);
    }
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
            Restricted Central Dispatch & Financial Console
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

        {step === 'phone' ? (
          <form onSubmit={handleRequestOtp}>
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
                Admin Phone Number
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Phone
                  size={16}
                  style={{ position: 'absolute', left: 14, color: '#64748B' }}
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="9999999999"
                  required
                  style={{
                    width: '100%',
                    background: '#081220',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    outline: 'none',
                  }}
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
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <KeyRound
                  size={16}
                  style={{ position: 'absolute', left: 14, color: '#64748B' }}
                />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                  style={{
                    width: '100%',
                    background: '#081220',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    color: '#FFFFFF',
                    fontSize: '18px',
                    letterSpacing: '0.25em',
                    outline: 'none',
                  }}
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
          </form>
        )}
      </div>
    </div>
  );
}
