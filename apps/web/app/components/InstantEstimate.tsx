'use client';

import { useState } from 'react';
import styles from './InstantEstimate.module.css';

const CONFIG_TYPES = [
  { value: '1bhk', label: '1 BHK', icon: '🏠' },
  { value: '2bhk', label: '2 BHK', icon: '🏡' },
  { value: '3bhk', label: '3 BHK', icon: '🏘️' },
  { value: 'office', label: 'Office', icon: '🏢' },
];

export default function InstantEstimate() {
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [config, setConfig] = useState('');
  const [estimate, setEstimate] = useState<{ min: number; max: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const getEstimate = () => {
    if (!pickup || !drop || !config) return;
    setLoading(true);

    // Client-side heuristic (same logic as Layer-1 on backend)
    const baseRates: Record<string, number> = {
      '1bhk': 3000,
      '2bhk': 5000,
      '3bhk': 8000,
      'office': 12000,
    };
    const base = baseRates[config] || 5000;

    setTimeout(() => {
      setEstimate({
        min: Math.round(base * 0.9),
        max: Math.round(base * 1.3),
      });
      setLoading(false);
    }, 600);
  };

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <h2 className={styles.title}>Get Instant Estimate</h2>
        <p className={styles.subtitle}>
          Enter your move details for a quick price range
        </p>
      </div>

      <div className={styles.form}>
        <div className={styles.inputRow}>
          <div className={`input-group ${styles.inputWrap}`}>
            <label htmlFor="pickup">Pickup Location</label>
            <input
              id="pickup"
              className="input-field"
              type="text"
              placeholder="e.g. Thane West"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
          </div>
          <div className={`input-group ${styles.inputWrap}`}>
            <label htmlFor="drop">Drop Location</label>
            <input
              id="drop"
              className="input-field"
              type="text"
              placeholder="e.g. Andheri East"
              value={drop}
              onChange={(e) => setDrop(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.configGrid}>
          {CONFIG_TYPES.map((ct) => (
            <button
              key={ct.value}
              className={`${styles.configBtn} ${config === ct.value ? styles.active : ''}`}
              onClick={() => setConfig(ct.value)}
            >
              <span className={styles.configIcon}>{ct.icon}</span>
              <span className={styles.configLabel}>{ct.label}</span>
            </button>
          ))}
        </div>

        <button
          className={`btn btn-accent btn-lg ${styles.cta}`}
          onClick={getEstimate}
          disabled={!pickup || !drop || !config || loading}
        >
          {loading ? (
            <span className={styles.spinner} />
          ) : (
            'Get Estimate →'
          )}
        </button>
      </div>

      {estimate && (
        <div className={styles.result}>
          <div className={styles.resultInner}>
            <span className={styles.resultLabel}>Estimated Range</span>
            <span className={styles.resultPrice}>
              ₹{estimate.min.toLocaleString('en-IN')} — ₹{estimate.max.toLocaleString('en-IN')}
            </span>
            <span className={styles.resultNote}>
              Final price calculated after itemized inventory
            </span>
            <a href="/quote" className="btn btn-primary" style={{ marginTop: 'var(--space-4)' }}>
              Get Detailed Quote →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
