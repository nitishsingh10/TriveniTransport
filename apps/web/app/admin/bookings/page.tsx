'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  MapPin,
  Flag,
  User,
  Phone,
  CheckCircle2,
  X,
  Truck,
  IndianRupee,
  Calendar,
} from 'lucide-react';
import { AdminDataService, AdminBooking, AdminVendor, AdminVehicle } from '../adminData';
import styles from '../admin.module.css';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [statusDraft, setStatusDraft] = useState<AdminBooking['status']>('REQUESTED');
  const [vendorDraft, setVendorDraft] = useState<string>('');
  const [vehicleDraft, setVehicleDraft] = useState<string>('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const loadData = async () => {
    const [b, ven, veh] = await Promise.all([
      AdminDataService.listBookings({
        status: statusFilter,
        search,
      }),
      AdminDataService.listVendors(),
      AdminDataService.listVehicles(),
    ]);
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
      `Status changed to ${statusDraft} via Bookings Console`
    );
    setActionSuccess(`Status updated to ${statusDraft}`);
    loadData();
  };

  const handleUpdateAssignment = async () => {
    if (!selectedBooking || !vendorDraft) return;
    await AdminDataService.assignBooking(selectedBooking.id, vendorDraft, vehicleDraft || undefined);
    setActionSuccess(`Captain & vehicle assigned to ${selectedBooking.id}`);
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
          <h1>Relocations & Dispatch Directory</h1>
          <p>Complete lifecycle management, manual pricing overrides, and vehicle dispatching.</p>
        </div>
      </div>

      {/* ── Filter / Search Bar ──────────────────────────────────────── */}
      <div className={styles.filterBar}>
        <div className={styles.searchInputWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search booking ref, client name, phone (+91), or area..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterChips}>
          {['ALL', 'REQUESTED', 'CONFIRMED', 'ASSIGNED', 'EN_ROUTE', 'COMPLETED', 'CANCELLED'].map(
            st => (
              <button
                key={st}
                type="button"
                className={`${styles.chip} ${statusFilter === st ? styles.chipActive : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st === 'ALL' ? 'All Moves' : st.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* ── Full Bookings Data Table ─────────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Client</th>
                <th>Pickup Origin</th>
                <th>Drop Destination</th>
                <th>Scheduled Date & Slot</th>
                <th>Configuration</th>
                <th>Captain Assigned</th>
                <th>Value (₹)</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>
                    No bookings found matching &quot;{search}&quot;
                  </td>
                </tr>
              ) : (
                bookings.map(b => (
                  <tr key={b.id}>
                    <td className={styles.bookingIdCell}>{b.id}</td>
                    <td>
                      <div className={styles.customerCell}>
                        <span className={styles.customerName}>{b.customerName}</span>
                        <span className={styles.customerPhone}>{b.customerPhone}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.pickupAddress}>
                        {b.pickupAddress}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: 12.5, maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={b.dropAddress}>
                        {b.dropAddress}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#FFFFFF', fontSize: 12.5 }}>{b.scheduledDate}</div>
                      <div style={{ fontSize: 11, color: '#94A3B8' }}>{b.scheduledSlot}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#F7A300', fontWeight: 600 }}>{b.configurationType}</span>
                    </td>
                    <td>
                      {b.vendorName ? (
                        <div style={{ fontSize: 12.5, color: '#FFFFFF', fontWeight: 600 }}>{b.vendorName}</div>
                      ) : (
                        <span style={{ fontSize: 12, color: '#F87171', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>
                    <td>
                      <div className={styles.amountCell}>₹{b.finalAmount.toLocaleString('en-IN')}</div>
                    </td>
                    <td>{renderStatusPill(b.status)}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.tableActionBtn}
                        onClick={() => handleOpenDrawer(b)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
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
                  Booking Management
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

              {/* Customer & Parameters */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>Customer & Move Parameters</div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Client Name</span>
                  <span className={styles.detailValue}>{selectedBooking.customerName}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Direct Phone</span>
                  <span className={styles.detailValue}>{selectedBooking.customerPhone}</span>
                </div>
                {selectedBooking.customerEmail && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Email</span>
                    <span className={styles.detailValue}>{selectedBooking.customerEmail}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Housing Type</span>
                  <span className={styles.detailValue}>{selectedBooking.configurationType}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Origin Floor</span>
                  <span className={styles.detailValue}>Floor {selectedBooking.floorNumber}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Service Elevator</span>
                  <span className={styles.detailValue}>{selectedBooking.liftAvailable ? 'Yes' : 'No (Stairs)'}</span>
                </div>
              </div>

              {/* Fiscal Breakdown */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>Pricing & Settlement</div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Total Contract Value</span>
                  <span className={styles.detailValue}>₹{selectedBooking.finalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Advance Paid (20%)</span>
                  <span className={styles.detailValue} style={{ color: '#10B981' }}>
                    ₹{selectedBooking.advancePaid.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Delivery Balance (80%)</span>
                  <span className={styles.detailValue} style={{ color: '#F7A300' }}>
                    ₹{(selectedBooking.finalAmount - selectedBooking.advancePaid).toLocaleString('en-IN')}
                  </span>
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
                  >
                    Confirm Assignment
                  </button>
                </div>
              </div>

              {/* Status Override */}
              <div className={styles.drawerSection}>
                <div className={styles.drawerSectionTitle}>Status Transition</div>
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
                    Broadcast New Status
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
