'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Layers, CheckCircle2, Sliders, IndianRupee, MapPin } from 'lucide-react';
import { AdminDataService, AdminPricingItem, AdminPricingRule } from '../adminData';
import styles from '../admin.module.css';

export default function AdminPricingPage() {
  const [items, setItems] = useState<AdminPricingItem[]>([]);
  const [rules, setRules] = useState<AdminPricingRule[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [itm, r] = await Promise.all([
      AdminDataService.listPricingItems(),
      AdminDataService.listPricingRules(),
    ]);
    setItems(itm);
    setRules(r);
  };

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleCol}>
          <h1>Volumetric Item Catalog & Pricing Multipliers</h1>
          <p>Versioned item dimensions (CFT), handling base tariffs, and floor/tier multipliers.</p>
        </div>
      </div>

      {/* ── Pricing Rules & Multipliers ─────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Active Dynamic Pricing Multipliers</div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Configuration Key</th>
                <th>Rule Category</th>
                <th>Rate / Multiplier</th>
                <th>Operational Rule Description</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: '#F7A300' }}>
                    {r.configKey}
                  </td>
                  <td>
                    <span
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                        fontWeight: 600,
                      }}
                    >
                      {r.ruleType.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#FFFFFF' }}>
                      {r.value > 10 ? `₹${r.value.toFixed(2)}` : `${r.value}x`}
                    </span>
                  </td>
                  <td style={{ color: '#CBD5E1', fontSize: 13 }}>{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Volumetric Item Catalog ──────────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Standardized Item Catalog (Volumetric Base)</div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Item Specification</th>
                <th>Category</th>
                <th>Standard Volume</th>
                <th>Estimated Weight</th>
                <th>Base Handling Tariff</th>
                <th>Compliance Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(itm => (
                <tr key={itm.id}>
                  <td style={{ fontWeight: 700, color: '#FFFFFF' }}>{itm.name}</td>
                  <td>
                    <span
                      style={{
                        background: 'rgba(247, 163, 0, 0.1)',
                        color: '#F7A300',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        fontWeight: 600,
                      }}
                    >
                      {itm.category}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#F1F5F9' }}>{itm.defaultCft} CFT</td>
                  <td style={{ color: '#94A3B8' }}>{itm.defaultWeightKg} kg</td>
                  <td style={{ fontWeight: 700, color: '#10B981' }}>₹{itm.baseHandlingRate}</td>
                  <td>
                    <span style={{ color: '#10B981', fontSize: 11.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle2 size={13} />
                      <span>Active</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
