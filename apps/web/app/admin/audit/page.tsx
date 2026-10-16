'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Bell,
  Clock,
  RotateCw,
  CheckCircle2,
  AlertTriangle,
  Send,
  MessageSquare,
  Mail,
} from 'lucide-react';
import { AdminDataService, AdminAuditLog, AdminNotification } from '../adminData';
import styles from '../admin.module.css';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [l, n] = await Promise.all([
      AdminDataService.listAuditLogs(),
      AdminDataService.listNotifications(),
    ]);
    setLogs(l);
    setNotifications(n);
  };

  const handleRetry = async (id: string) => {
    setRetryingId(id);
    await AdminDataService.retryNotification(id);
    await loadData();
    setRetryingId(null);
  };

  const renderChannelIcon = (channel: AdminNotification['channel']) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare size={13} color="#25D366" />;
      case 'sms':
        return <Send size={13} color="#F7A300" />;
      case 'email':
        return <Mail size={13} color="#38BDF8" />;
      default:
        return <Bell size={13} color="#C084FC" />;
    }
  };

  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────────── */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleCol}>
          <h1>Security Audit Logs & Notification Dispatch</h1>
          <p>Immutable append-only pricing logs, booking state change records, and multi-channel notification status.</p>
        </div>
      </div>

      {/* ── Append-Only Audit Trail ─────────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Immutable System Audit Trail</div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Entity Affected</th>
                <th>Field Changed</th>
                <th>Previous State</th>
                <th>Modified Value</th>
                <th>Authorized Operator</th>
                <th>Operational Reason</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td style={{ color: '#94A3B8', fontSize: 12 }}>
                    {new Date(log.changedAt).toLocaleString('en-IN', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td>
                    <span
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: 11.5,
                        color: '#F7A300',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    >
                      {log.entityType}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: '#FFFFFF' }}>{log.fieldChanged}</td>
                  <td style={{ color: '#EF4444', textDecoration: 'line-through', fontSize: 12.5 }}>
                    {log.oldValue}
                  </td>
                  <td style={{ color: '#10B981', fontWeight: 700, fontSize: 12.5 }}>
                    {log.newValue}
                  </td>
                  <td>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>{log.adminName}</span>
                  </td>
                  <td style={{ color: '#94A3B8', fontSize: 12.5 }}>{log.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Notification Delivery Queue ─────────────────────────────── */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>Customer & Driver Automated Alerts (WhatsApp, SMS, Email)</div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Dispatched At</th>
                <th>Channel</th>
                <th>Alert Template</th>
                <th>Recipient Helpline</th>
                <th>Booking Ref</th>
                <th>Transmission Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n.id}>
                  <td style={{ color: '#94A3B8', fontSize: 12 }}>
                    {new Date(n.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, textTransform: 'capitalize', fontWeight: 600 }}>
                      {renderChannelIcon(n.channel)}
                      <span>{n.channel}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: '#F7A300' }}>
                    {n.template}
                  </td>
                  <td style={{ color: '#FFFFFF', fontWeight: 600 }}>{n.recipientPhone}</td>
                  <td>
                    <span style={{ color: '#60A5FA', fontFamily: 'monospace', fontWeight: 700 }}>
                      {n.bookingId || '—'}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        background:
                          n.status === 'sent'
                            ? 'rgba(16, 185, 129, 0.15)'
                            : n.status === 'failed'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(247, 163, 0, 0.15)',
                        color:
                          n.status === 'sent' ? '#34D399' : n.status === 'failed' ? '#F87171' : '#F7A300',
                        padding: '3px 9px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <CheckCircle2 size={11} />
                      <span>{n.status}</span>
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className={styles.tableActionBtn}
                      onClick={() => handleRetry(n.id)}
                      disabled={retryingId === n.id}
                      style={{ padding: '4px 10px', fontSize: 11 }}
                    >
                      <RotateCw size={11} className={retryingId === n.id ? styles.statusDot : ''} />
                      <span>{retryingId === n.id ? 'Sending...' : 'Re-send'}</span>
                    </button>
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
