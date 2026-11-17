'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import styles from './admin.module.css';

export function AdminDataNotice({
  loading = false,
  error,
  onRetry,
}: {
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}) {
  if (loading) {
    return <div className={styles.sectionCard} role="status" aria-live="polite">Loading live admin data…</div>;
  }
  if (!error) return null;

  return (
    <div className={styles.sectionCard} role="alert" style={{ borderColor: '#F87171' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle size={17} color="#F87171" />{error}</span>
        {onRetry && (
          <button type="button" className={styles.tableActionBtn} onClick={onRetry}>
            <RefreshCw size={14} /> Retry
          </button>
        )}
      </div>
    </div>
  );
}
