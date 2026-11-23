'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Truck,
  User,
  Phone,
  ShieldCheck,
  Star,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { AdminDataService, AdminVendor, AdminVehicle } from '../adminData';
import styles from '../admin.module.css';
import { AdminDataNotice } from '../AdminDataNotice';

export default function AdminFleetPage() {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [serviceType, setServiceType] = useState<'packers_movers' | 'transport'>('transport');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestFleetData = useCallback(() => Promise.all([
    AdminDataService.listVendors(serviceType),
    AdminDataService.listVehicles(serviceType),
  ]), [serviceType]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ven, veh] = await requestFleetData();
      setError(null);
      setVendors(ven);
      setVehicles(veh);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load fleet data.');
    } finally { setLoading(false); }
  }, [requestFleetData]);

  useEffect(() => {
    let active = true;
    requestFleetData()
      .then(([ven, veh]) => {
        if (!active) return;
        setError(null);
        setVendors(ven);
        setVehicles(veh);
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load fleet data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestFleetData]);

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleCol}>
          <h1>{serviceType === 'packers_movers' ? 'P&M partner roster' : 'Pickup & truck fleet'}</h1>
          <p>{serviceType === 'packers_movers' ? 'View verified packers and movers businesses and their order history.' : 'Review verified pickup and truck partners, vehicle capacity, and compliance.'}</p>
        </div>
      </div>
      <AdminDataNotice loading={loading} error={error} onRetry={loadData} />

      <div className={styles.filterChips} role="tablist" aria-label="Partner service" style={{ marginBottom: 18 }}>
        {([['packers_movers', 'P&M vendors'], ['transport', 'Pickup & truck drivers']] as const).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={serviceType === value}
            className={`${styles.chip} ${serviceType === value ? styles.chipActive : ''}`}
            onClick={() => setServiceType(value)}>{label}</button>
        ))}
      </div>

      {/* ── Vehicle Fleet Cards ─────────────────────────────────────── */}
      {serviceType === 'transport' && <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>
          Pickup & truck vehicles ({vehicles.length})
        </h2>
        <div className={styles.kpiGrid}>
          {vehicles.map(v => (
            <div key={v.id} className={styles.kpiCard} style={{ borderTop: '3px solid #F7A300' }}>
              <div className={styles.kpiTopRow}>
                <span className={styles.kpiLabel}>{v.type}</span>
                <div className={styles.kpiIconWrapper}>
                  <Truck size={18} />
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', marginBottom: 8, letterSpacing: '0.04em' }}>
                {v.registrationNumber}
              </div>
              <div style={{ fontSize: 13, color: '#F7A300', fontWeight: 600, marginBottom: 12 }}>
                {v.capacityCft} CFT Volumetric Capacity
              </div>
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                  <span>Permit Expiry:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{v.permitExpiry}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                  <span>Fitness Certificate:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{v.fitnessExpiry || 'Not recorded'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                  <span>Vehicle road-use document expiry:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{v.insuranceExpiry || 'Not recorded'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                  <span>Driver partner:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{v.vendorName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>}

      {/* ── Captain Roster Table ─────────────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>{serviceType === 'packers_movers' ? 'Packers & movers partners' : 'Pickup & truck drivers'}</div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Captain Name</th>
                <th>Helpline / Contact</th>
                <th>Rating</th>
                <th>Bookings</th>
                <th>Status</th>
                {serviceType === 'transport' && <th>Primary Vehicle</th>}
              </tr>
            </thead>
            <tbody>
              {vendors.map(ven => (
                <tr key={ven.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'rgba(247, 163, 0, 0.15)',
                          color: '#F7A300',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {ven.name.charAt(0)}
                      </div>
                      <span style={{ fontWeight: 700, color: '#FFFFFF', fontSize: 13.5 }}>{ven.name}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: 12.5 }}>
                      <Phone size={13} color="#F7A300" />
                      <span>{ven.phone}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F7A300', fontWeight: 700, fontSize: 13 }}>
                      <Star size={14} fill="#F7A300" color="#F7A300" />
                      <span>{ven.rating == null ? 'Not rated' : `${ven.rating.toFixed(1)} / 5.0`}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{ven.totalTrips} bookings</span>
                  </td>
                  <td>
                    <span
                      style={{
                        background: ven.onboardingStatus === 'approved' && ven.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(247,163,0,.12)',
                        border: `1px solid ${ven.onboardingStatus === 'approved' && ven.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(247,163,0,.3)'}`,
                        color: ven.onboardingStatus === 'approved' && ven.status === 'active' ? '#34D399' : '#F7A300',
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {ven.onboardingStatus.replaceAll('_', ' ')}
                    </span>
                  </td>
                  {serviceType === 'transport' && <td><span style={{ color: '#94A3B8', fontSize: 12.5 }}>{ven.assignedVehicle || 'No vehicle assigned'}</span></td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
