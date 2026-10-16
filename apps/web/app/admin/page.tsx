'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Truck,
  IndianRupee,
  Clock,
  ArrowRight,
  MapPin,
  Flag,
  User,
  Phone,
  Calendar,
  Layers,
  ChevronRight,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AdminDataService, AdminBooking, AdminVendor, AdminVehicle } from './adminData';
import styles from './admin.module.css';

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    activeRevenue: 0,
    totalVehicles: 3,
  });

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [statusDraft, setStatusDraft] = useState<AdminBooking['status']>('REQUESTED');
  const [vendorDraft, setVendorDraft] = useState<string>('');
  const [vehicleDraft, setVehicleDraft] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [m, b, ven, veh] = await Promise.all([
      AdminDataService.getMetrics(),
      AdminDataService.listBookings(),
      AdminDataService.listVendors(),
      AdminDataService.listVehicles(),
    ]);

    setMetrics(m as any);
    setBookings(b);
    setVendors(ven);
    setVehicles(veh);
  };

  const handleOpenDrawer = (b: AdminBooking) => {
    setSelectedBooking(b);
    setStatusDraft(b.status);
    setVendorDraft(b.vendorId || '');
    setVehicleDraft(b.vehicleId || '');
    setActionSuccess(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedBooking) return;
    await AdminDataService.updateBookingStatus(
      selectedBooking.id,
      statusDraft,
      `Status updated to ${statusDraft} via Executive Overview`
    );
    setActionSuccess(`Booking ${selectedBooking.id} updated to ${statusDraft}`);
    loadData();
  };

  const handleUpdateAssignment = async () => {
    if (!selectedBooking || !vendorDraft) return;
    await AdminDataService.assignBooking(selectedBooking.id, vendorDraft, vehicleDraft || undefined);
    setActionSuccess(`Driver & vehicle assigned to ${selectedBooking.id}`);
    loadData();
  };

  const renderStatusPill = (status: AdminBooking['status']) => {
    switch (status) {
      case 'EN_ROUTE':
      case 'ARRIVED':
      case 'IN_PROGRESS':
        return (
          <span className={`${styles.statusPill} ${styles.statusEnRoute}`}>
            <span className={styles.pillDot} />
            <span>{status.replace('_', ' ')}</span>
          </span>
        );
      case 'ASSIGNED':
        return (
          <span className={`${styles.statusPill} ${styles.statusAssigned}`}>
            <span className={styles.pillDot} />
            <span>Assigned</span>
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className={`${styles.statusPill} ${styles.statusConfirmed}`}>
            <span className={styles.pillDot} />
            <span>Confirmed</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className={`${styles.statusPill} ${styles.statusCompleted}`}>
            <span className={styles.pillDot} />
            <span>Completed</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className={`${styles.statusPill} ${styles.statusCancelled}`}>
            <span className={styles.pillDot} />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className={`${styles.statusPill} ${styles.statusRequested}`}>
            <span className={styles.pillDot} />
            <span>Requested</span>
          </span>
        );
    }
  };

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleCol}>
          <h1>Executive Operations Console</h1>
          <p>Real-time telemetry of Pune & Mumbai shifting assignments, dispatch pipelines, and fiscal turnover.</p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/admin/bookings" className={styles.tableActionBtn} style={{ padding: '9px 16px', background: '#F7A300', color: '#081220', borderColor: '#F7A300' }}>
            <span>Manage All Bookings</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* ── 4-Up KPI Cards ──────────────────────────────────────────── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Total Relocations</span>
            <div className={styles.kpiIconWrapper}>
              <Package size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>{metrics.totalBookings}</div>
          <div className={styles.kpiSubtext}>
            <span>100% cloud database synchronized</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Active In-Transit</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(14, 165, 233, 0.15)', color: '#38BDF8' }}>
              <Clock size={20} />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ color: '#38BDF8' }}>
            {metrics.activeBookings}
          </div>
          <div className={styles.kpiSubtext} style={{ color: '#38BDF8' }}>
            <span>{metrics.pendingBookings} awaiting confirmation</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Settled Turnover</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
              <IndianRupee size={20} />
            </div>
          </div>
          <div className={styles.kpiValue} style={{ color: '#10B981' }}>
            ₹{metrics.totalRevenue.toLocaleString('en-IN')}
          </div>
          <div className={styles.kpiSubtext}>
            <span>+₹{metrics.activeRevenue.toLocaleString('en-IN')} in-transit pipeline</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Active Commercial Fleet</span>
            <div className={styles.kpiIconWrapper} style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#C084FC' }}>
              <Truck size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>
            {vehicles.filter(v => v.active).length} / {vehicles.length}
          </div>
          <div className={styles.kpiSubtext} style={{ color: '#C084FC' }}>
            <span>1,900 CFT total volume on-duty</span>
          </div>
        </div>
      </div>

      {/* ── Active Moves Stream Table ─────────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Live Relocation Stream & Dispatch Queue</div>
          <Link href="/admin/bookings" className={styles.tableActionBtn}>
            <span>View Full Log</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Booking Ref</th>
                <th>Customer Info</th>
                <th>Route (Pickup ➔ Drop)</th>
                <th>Scheduled Slot</th>
                <th>Assigned Captain / Truck</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map(b => (
                <tr key={b.id}>
                  <td className={styles.bookingIdCell}>{b.id}</td>
                  <td>
                    <div className={styles.customerCell}>
                      <span className={styles.customerName}>{b.customerName}</span>
                      <span className={styles.customerPhone}>{b.customerPhone}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.routeCell}>
                      <div className={styles.routePoint}>
                        <MapPin size={12} color="#F7A300" style={{ flexShrink: 0 }} />
                        <span title={b.pickupAddress}>{b.pickupAddress}</span>
                      </div>
                      <div className={styles.routePoint}>
                        <Flag size={12} color="#10B981" style={{ flexShrink: 0 }} />
                        <span title={b.dropAddress}>{b.dropAddress}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: '#F1F5F9' }}>
                      {b.scheduledDate}
                    </div>
                    <div style={{ fontSize: 11, color: '#94A3B8' }}>{b.scheduledSlot}</div>
                  </td>
                  <td>
                    {b.vendorName ? (
                      <div>
                        <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: 12.5 }}>
                          {b.vendorName}
                        </div>
                        <div style={{ fontSize: 11, color: '#F7A300' }}>
                          {b.vehicleNumber || 'Tata 407'}
                        </div>
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: '#F87171', fontStyle: 'italic' }}>
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td>
                    <div className={styles.amountCell}>₹{b.finalAmount.toLocaleString('en-IN')}</div>
                    {b.advancePaid > 0 && (
                      <span className={styles.advanceBadge}>
                        Paid ₹{b.advancePaid.toLocaleString('en-IN')}
                      </span>
                    )}
                  </td>
                  <td>{renderStatusPill(b.status)}</td>
                  <td>
                    <button
                      type="button"
                      className={styles.tableActionBtn}
                      onClick={() => handleOpenDrawer(b)}
                    >
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Slide-in Booking Detail Drawer ───────────────────────────── */}
      {selectedBooking && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedBooking(null)}>
          <div className={styles.drawerContent} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#F7A300', textTransform: 'uppercase' }}>
                  Relocation Manifest
                </div>
                <div className={styles.drawerTitle}>{selectedBooking.id}</div>
              </div>
              <button
                type="button"
                className={styles.drawerCloseBtn}
                onClick={() => setSelectedBooking(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {actionSuccess && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    padding: '12px 16px',
                    borderRadius: 8,
                    color: '#34D399',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{actionSuccess}</span>
                </div>
              )}

              {/* Customer Info Card */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>Customer & Move Parameters</div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Client Name</span>
                  <span className={styles.detailValue}>{selectedBooking.customerName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Phone Helpline</span>
                  <span className={styles.detailValue}>{selectedBooking.customerPhone}</span>
                </div>
                {selectedBooking.customerEmail && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email Address</span>
                    <span className={styles.detailValue}>{selectedBooking.customerEmail}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Configuration</span>
                  <span className={styles.detailValue}>{selectedBooking.configurationType}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Floor / Lift</span>
                  <span className={styles.detailValue}>
                    Floor {selectedBooking.floorNumber} • {selectedBooking.liftAvailable ? 'Lift OK' : 'No Lift (Stairs)'}
                  </span>
                </div>
              </div>

              {/* Origin & Destination */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>Route Details ({selectedBooking.distanceKm} KM)</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#F7A300', fontWeight: 700, marginBottom: 4 }}>
                    📍 PICKUP ORIGIN
                  </div>
                  <div style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 1.4 }}>
                    {selectedBooking.pickupAddress}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, marginBottom: 4 }}>
                    🏁 DROP DESTINATION
                  </div>
                  <div style={{ fontSize: 13, color: '#FFFFFF', lineHeight: 1.4 }}>
                    {selectedBooking.dropAddress}
                  </div>
                </div>
              </div>

              {/* Driver & Vehicle Assignment */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>Assign Fleet Captain & Vehicle</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Select Captain
                    </label>
                    <select
                      value={vendorDraft}
                      onChange={e => setVendorDraft(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#081220',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '10px',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      <option value="">-- Choose Captain --</option>
                      {vendors.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.rating}★ • {v.totalTrips} moves)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Select Vehicle
                    </label>
                    <select
                      value={vehicleDraft}
                      onChange={e => setVehicleDraft(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#081220',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '10px',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.type} ({v.registrationNumber})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    className={styles.secondaryActionBtn}
                    onClick={handleUpdateAssignment}
                    style={{ marginTop: 6 }}
                  >
                    Update Assignment
                  </button>
                </div>
              </div>

              {/* Status Override */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>State Machine Status Transition</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <select
                    value={statusDraft}
                    onChange={e => setStatusDraft(e.target.value as any)}
                    style={{
                      width: '100%',
                      background: '#081220',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255,255,255,0.12)',
                      padding: '10px',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  >
                    <option value="REQUESTED">REQUESTED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="EN_ROUTE">EN_ROUTE (Truck on the way)</option>
                    <option value="ARRIVED">ARRIVED (At Pickup point)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Loading/Moving)</option>
                    <option value="COMPLETED">COMPLETED (Delivered & Verified)</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>

                  <button
                    type="button"
                    className={styles.primaryActionBtn}
                    onClick={handleUpdateStatus}
                  >
                    Save & Broadcast Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
