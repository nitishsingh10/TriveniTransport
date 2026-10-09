'use client';

import { useState } from 'react';
import { Home, Building2, Briefcase, LandPlot } from 'lucide-react';
import styles from './InstantEstimate.module.css';

const CONFIG_TYPES = [
  { value: '1bhk', label: '1 BHK', Icon: Home },
  { value: '2bhk', label: '2 BHK', Icon: LandPlot },
  { value: '3bhk', label: '3 BHK', Icon: Building2 },
  { value: 'office', label: 'Office', Icon: Briefcase },
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
        <h2 className={styles.title}>Instant Estimate</h2>
        <p className={styles.subtitle}>
          Get a quick price range for your move — no commitment
        </p>
      </div>

      <div className={styles.form}>
        <div className={styles.inputRow}>
          <div className={styles.inputWrap}>
            <label htmlFor="pickup" className={styles.label}>Pickup Location</label>
            <input
              id="pickup"
              className={styles.input}
              type="text"
              placeholder="e.g. Thane West"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
          </div>
          <div className={styles.inputWrap}>
            <label htmlFor="drop" className={styles.label}>Drop Location</label>
            <input
              id="drop"
              className={styles.input}
              type="text"
              placeholder="e.g. Andheri East"
              value={drop}
              onChange={(e) => setDrop(e.target.value)}
            />
          </div>
        </div>

        <div>
          <p className={styles.label} style={{ marginBottom: 'var(--space-3)' }}>Property Type</p>
          <div className={styles.configGrid}>
            {CONFIG_TYPES.map((ct) => (
              <button
                key={ct.value}
                className={`${styles.configBtn} ${config === ct.value ? styles.active : ''}`}
                onClick={() => setConfig(ct.value)}
              >
                <ct.Icon size={22} strokeWidth={1.75} className={styles.configIcon} />
                <span className={styles.configLabel}>{ct.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          className={styles.cta}
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
          <span className={styles.resultLabel}>Estimated Range</span>
          <span className={styles.resultPrice}>
            ₹{estimate.min.toLocaleString('en-IN')} – ₹{estimate.max.toLocaleString('en-IN')}
          </span>
          <span className={styles.resultNote}>
            Final price calculated after itemised inventory review
          </span>
          <a href="/quote" className={styles.resultCta}>
            Get Detailed Quote →
          </a>
        </div>
      )}
    </div>
  );
}
