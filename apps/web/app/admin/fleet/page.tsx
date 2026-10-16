'use client';

import React, { useState, useEffect } from 'react';
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

export default function AdminFleetPage() {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [ven, veh] = await Promise.all([
      AdminDataService.listVendors(),
      AdminDataService.listVehicles(),
    ]);
    setVendors(ven);
    setVehicles(veh);
  };

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleCol}>
          <h1>Commercial Fleet & Captain Roster</h1>
          <p>Vehicle compliance documents, cubic feet (CFT) volumetric capacity, and driver performance.</p>
        </div>
      </div>

      {/* ── Vehicle Fleet Cards ─────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 16 }}>
          Commercial Vehicles ({vehicles.length} Units On-Duty)
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
                  <span style={{ color: '#10B981', fontWeight: 600 }}>{v.fitnessExpiry} (Verified)</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94A3B8' }}>
                  <span>Designated Captain:</span>
                  <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{v.vendorName}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Captain Roster Table ─────────────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Certified Shifting Captains</div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Captain Name</th>
                <th>Helpline / Contact</th>
                <th>Customer Rating</th>
                <th>Verified Moves</th>
                <th>Status</th>
                <th>Primary Vehicle</th>
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
                      <span>{ven.rating} / 5.0</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#FFFFFF' }}>{ven.totalTrips} Trips Settled</span>
                  </td>
                  <td>
                    <span
                      style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#34D399',
                        padding: '3px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      Active On-Duty
                    </span>
                  </td>
                  <td>
                    <span style={{ color: '#94A3B8', fontSize: 12.5 }}>{ven.assignedVehicle || 'Tata 407 (MH 12 RN 4071)'}</span>
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
