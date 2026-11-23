'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import { AdminDataNotice } from './AdminDataNotice';

export default function AdminOverviewPage() {
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    totalRevenue: 0,
    activeRevenue: 0,
  });

  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [statusDraft, setStatusDraft] = useState<AdminBooking['status']>('REQUESTED');
  const [vendorDraft, setVendorDraft] = useState<string>('');
  const [vehicleDraft, setVehicleDraft] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceType, setServiceType] = useState<'packers_movers' | 'transport'>('packers_movers');
  const moveDate = selectedBooking?.scheduledDate || '';
  const vehicleIsEligible = (vehicle: AdminVehicle, partnerId: string) => vehicle.vendorId === partnerId
    && vehicle.active && vehicle.verificationStatus === 'approved'
    && vehicle.permitExpiry >= moveDate && vehicle.fitnessExpiry >= moveDate && vehicle.insuranceExpiry >= moveDate
    && vehicle.capacityCft >= (selectedBooking?.totalCft || 0);
  const eligibleVendors = vendors.filter((vendor) => vendor.status === 'active' && vendor.onboardingStatus === 'approved'
    && (serviceType === 'packers_movers' || Boolean(vendor.driverLicenseExpiry && vendor.driverLicenseExpiry >= moveDate
      && vehicles.some((vehicle) => vehicleIsEligible(vehicle, vendor.id)))));

  const requestDashboardData = useCallback(() => Promise.all([
    AdminDataService.getMetrics(serviceType),
    AdminDataService.listBookings({ serviceType }),
    AdminDataService.listVendors(serviceType),
    AdminDataService.listVehicles(serviceType),
  ]), [serviceType]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [m, b, ven, veh] = await requestDashboardData();
      setLoadError(null);
      setMetrics(m);
      setBookings(b);
      setVendors(ven);
      setVehicles(veh);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Could not load live dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [requestDashboardData]);

  useEffect(() => {
    let active = true;
    requestDashboardData()
      .then(([m, b, ven, veh]) => {
        if (!active) return;
        setLoadError(null);
        setMetrics(m);
        setBookings(b);
        setVendors(ven);
        setVehicles(veh);
      })
      .catch((error) => { if (active) setLoadError(error instanceof Error ? error.message : 'Could not load live dashboard data.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestDashboardData]);

  const handleOpenDrawer = (b: AdminBooking) => {
    setSelectedBooking(b);
    setStatusDraft(b.status);
    setVendorDraft(b.vendorId || '');
    setVehicleDraft(b.vehicleId || '');
    setActionSuccess(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedBooking) return;
    setActionError(null);
    try {
      await AdminDataService.updateBookingStatus(selectedBooking.id, statusDraft, `Status updated to ${statusDraft} via Executive Overview`);
      setActionSuccess(`Booking ${selectedBooking.id} updated to ${statusDraft}`);
      await loadData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not update booking status.');
    }
  };

  const handleUpdateAssignment = async () => {
    if (!selectedBooking || !vendorDraft) return;
    setActionError(null);
    try {
      await AdminDataService.assignBooking(selectedBooking.id, vendorDraft, vehicleDraft || undefined);
      setActionSuccess(`Partner assignment updated for ${selectedBooking.id}`);
      await loadData();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Could not assign driver and vehicle.');
    }
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
          <p>Bookings, dispatch, fleet availability and completed revenue at a glance.</p>
        </div>

        <div className={styles.headerActions}>
          <Link href="/admin/bookings" className={styles.tableActionBtn} style={{ padding: '9px 16px', background: '#F7A300', color: '#111111', borderColor: '#F7A300' }}>
            <span>Manage All Bookings</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
      <AdminDataNotice loading={loading} error={loadError} onRetry={loadData} />
      <div className={styles.filterChips} role="tablist" aria-label="Service dashboard" style={{ marginBottom: 18 }}>
        {([
          ['packers_movers', 'Packers & Movers'],
          ['transport', 'Pickup & Truck'],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={serviceType === value}
            className={`${styles.chip} ${serviceType === value ? styles.chipActive : ''}`}
            onClick={() => setServiceType(value)}>
            {label}
          </button>
        ))}
      </div>
      {actionError && <div className={styles.sectionCard} role="alert">{actionError}</div>}

      {/* ── 4-Up KPI Cards ──────────────────────────────────────────── */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>{serviceType === 'packers_movers' ? 'P&M Orders' : 'Pickup & Truck Orders'}</span>
            <div className={styles.kpiIconWrapper}>
              <Package size={20} />
            </div>
          </div>
          <div className={styles.kpiValue}>{metrics.totalBookings}</div>
          <div className={styles.kpiSubtext}>
            <span>{metrics.completedBookings.toLocaleString('en-IN')} completed bookings</span>
          </div>
        </div>

        <div className={styles.kpiCard}>
          <div className={styles.kpiTopRow}>
            <span className={styles.kpiLabel}>Active Bookings</span>
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
            <span>{vehicles.filter(v => v.active).reduce((total, vehicle) => total + vehicle.capacityCft, 0).toLocaleString('en-IN')} CFT available</span>
          </div>
        </div>
      </div>

      {/* ── Active Moves Stream Table ─────────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>{serviceType === 'packers_movers' ? 'Recent P&M Orders' : 'Recent Pickup & Truck Orders'}</div>
          <Link href="/admin/bookings" className={styles.tableActionBtn}>
            <span>View Full Log</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Customer Info</th>
                <th>Route (Pickup ➔ Drop)</th>
                <th>Scheduled Slot</th>
                <th>Assigned partner / vehicle</th>
                <th>Total Value</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.slice(0, 5).map(b => (
                <tr key={b.id}>
                  <td className={styles.bookingIdCell} title={b.id}>{b.id.slice(0, 8).toUpperCase()}</td>
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
                          {b.vehicleNumber || 'Vehicle not assigned'}
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
              {!loading && !loadError && bookings.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: '36px 20px', textAlign: 'center', color: '#9AA8BA' }}>
                    No bookings in the system yet.
                  </td>
                </tr>
              )}
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
                <div className={styles.drawerSectionTitle}>{serviceType === 'packers_movers' ? 'Assign P&M partner' : 'Assign driver partner & truck'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      {serviceType === 'packers_movers' ? 'Select P&M partner' : 'Select driver partner'}
                    </label>
                    <select
                      value={vendorDraft}
                      onChange={e => { setVendorDraft(e.target.value); setVehicleDraft(''); }}
                      style={{
                        width: '100%',
                        background: '#08090B',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '10px',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      <option value="">-- Choose approved partner --</option>
                      {eligibleVendors.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.totalTrips} orders)
                        </option>
                      ))}
                    </select>
                  </div>

                  {serviceType === 'transport' && <div>
                    <label style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Select Vehicle
                    </label>
                    <select
                      value={vehicleDraft}
                      onChange={e => setVehicleDraft(e.target.value)}
                      style={{
                        width: '100%',
                        background: '#08090B',
                        color: '#FFFFFF',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '10px',
                        borderRadius: 8,
                        fontSize: 13,
                      }}
                    >
                      <option value="">-- Choose Vehicle --</option>
                      {vehicles.filter(v => vehicleIsEligible(v, vendorDraft)).map(v => (
                        <option key={v.id} value={v.id}>
                          {v.type} ({v.registrationNumber})
                        </option>
                      ))}
                    </select>
                  </div>}

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
                    onChange={e => setStatusDraft(e.target.value as AdminBooking['status'])}
                    style={{
                      width: '100%',
                      background: '#08090B',
                      color: '#FFFFFF',
                      border: '1px solid rgba(255,255,255,0.12)',
                      padding: '10px',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  >
                    <option value="REQUESTED">REQUESTED</option>
                    <option value="QUOTED">QUOTED</option>
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="ASSIGNED">ASSIGNED</option>
                    <option value="EN_ROUTE">EN_ROUTE (Truck on the way)</option>
                    <option value="ARRIVED">ARRIVED (At Pickup point)</option>
                    <option value="IN_PROGRESS">IN_PROGRESS (Loading/Moving)</option>
                    <option value="REVISION_PENDING">REVISION_PENDING</option>
                    <option value="COMPLETED">COMPLETED (Delivered & Verified)</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="DISPUTED">DISPUTED</option>
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
