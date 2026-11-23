'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, FileCheck2, RefreshCw, ShieldAlert, UserRoundCheck } from 'lucide-react';
import { AdminDataService, AdminVendor } from '../adminData';
import { AdminDataNotice } from '../AdminDataNotice';
import styles from '../admin.module.css';

type ReviewDocument = {
  id: string; documentType: string; fileName: string; mimeType: string; status: string;
  reviewNotes?: string | null; uploadedAt: string; reviewedAt?: string | null; url: string;
};
type ContractRecord = {
  currentVersion: string;
  currentHash: string;
  signature: {
    contractVersion: string;
    contractHash: string;
    signerName: string;
    signerRole: string;
    signedAt: string;
    otpChallengeId: string;
    ipAddress?: string | null;
    userAgent?: string | null;
    contractText: string;
  } | null;
};

const labelForDocument = (value: string) => value === 'vehicle_insurance' ? 'Partner vehicle road-use document' : value === 'commercial_schedule' ? 'Signed commercial schedule' : value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AdminPartnersPage() {
  const [serviceType, setServiceType] = useState<'packers_movers' | 'transport'>('packers_movers');
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [selected, setSelected] = useState<AdminVendor | null>(null);
  const [documents, setDocuments] = useState<ReviewDocument[]>([]);
  const [contractRecord, setContractRecord] = useState<ContractRecord | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState('');

  const loadVendors = useCallback(async () => {
    try {
      const next = await AdminDataService.listVendors(serviceType);
      setVendors(next);
      if (selected) setSelected(next.find((vendor) => vendor.id === selected.id) || null);
      setError(null);
      return next;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load partner applications.');
      return undefined;
    } finally { setLoading(false); }
  }, [selected, serviceType]);

  useEffect(() => {
    let active = true;
    AdminDataService.listVendors(serviceType)
      .then((next) => { if (active) setVendors(next); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Could not load partner applications.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [serviceType]);

  const openVendor = async (vendor: AdminVendor) => {
    setSelected(vendor);
    setNotes(vendor.reviewNotes || '');
    setSuccess('');
    setDocuments([]);
    setContractRecord(null);
    try {
      setDocuments(await AdminDataService.getVendorDocuments(vendor.id));
      if (vendor.serviceType === 'packers_movers') setContractRecord(await AdminDataService.getVendorContract(vendor.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open verification documents.');
    }
  };

  const runReview = async (status: 'under_review' | 'needs_changes' | 'approved' | 'rejected') => {
    if (!selected) return;
    setBusy(true); setError(null); setSuccess('');
    try {
      await AdminDataService.reviewVendor(selected.id, status, notes);
      setSuccess(`Partner application marked ${status.replaceAll('_', ' ')}.`);
      const refreshedVendors = await loadVendors();
      const refreshed = refreshedVendors?.find((vendor) => vendor.id === selected.id) || { ...selected, onboardingStatus: status };
      setSelected({ ...refreshed, onboardingStatus: status, reviewNotes: notes });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not update this application.');
    } finally { setBusy(false); }
  };

  const reviewDocument = async (documentId: string, status: 'approved' | 'rejected') => {
    setBusy(true); setError(null); setSuccess('');
    try {
      await AdminDataService.reviewVendorDocument(documentId, status, notes);
      setSuccess(`Document ${status}.`);
      if (selected) setDocuments(await AdminDataService.getVendorDocuments(selected.id));
      await loadVendors();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not review this document.');
    } finally { setBusy(false); }
  };

  const data = selected?.onboardingData || {};
  const canEnterReview = selected?.onboardingStatus === 'submitted' || selected?.onboardingStatus === 'needs_changes';
  const canDecideApplication = canEnterReview || selected?.onboardingStatus === 'under_review';
  const latestCommercialSchedule = [...documents].filter((document) => document.documentType === 'commercial_schedule').sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
  const hasCurrentSignature = !!contractRecord?.signature
    && contractRecord.signature.contractVersion === contractRecord.currentVersion
    && contractRecord.signature.contractHash === contractRecord.currentHash;
  const canApproveApplication = serviceType !== 'packers_movers' || (hasCurrentSignature && latestCommercialSchedule?.status === 'approved');
  const driver = (data.driver || {}) as Record<string, string>;
  const vehicle = (data.vehicle || {}) as Record<string, string>;
  const displayRows = serviceType === 'packers_movers'
    ? [
        ['Business', data.businessName], ['Owner', data.ownerName], ['Entity type', data.legalEntityType],
        ['Address', data.businessAddress], ['Service areas', Array.isArray(data.serviceAreas) ? data.serviceAreas.join(', ') : ''], ['Crew size', data.teamSize],
      ]
    : [
        ['Driver', driver.fullName], ['Phone', driver.phone], ['DL number', driver.dlNumber], ['Operating base', driver.city],
        ['Vehicle', `${vehicle.type || ''} ${vehicle.registrationNumber || ''}`], ['Permit expiry', vehicle.permitExpiry],
        ['Fitness expiry', vehicle.fitnessCertExpiry], ['Payout account holder', (data.bank || {}).accountHolderName],
      ];

  return (
    <div>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleCol}>
          <h1>Partner verification</h1>
          <p>Review service-specific applications and documents before granting dispatch access.</p>
        </div>
        <button type="button" className={styles.tableActionBtn} onClick={() => void loadVendors()} disabled={loading}><RefreshCw size={15} /> Refresh</button>
      </div>

      <AdminDataNotice loading={loading} error={error} onRetry={loadVendors} />
      {success && <div className={styles.sectionCard} role="status" style={{ color: '#34D399', marginBottom: 14 }}>{success}</div>}
      <div className={styles.filterChips} role="tablist" aria-label="Partner service" style={{ marginBottom: 18 }}>
        {([
          ['packers_movers', 'P&M vendors'], ['transport', 'Pickup & truck drivers'],
        ] as const).map(([value, label]) => (
          <button key={value} type="button" role="tab" aria-selected={serviceType === value}
            className={`${styles.chip} ${serviceType === value ? styles.chipActive : ''}`}
            onClick={() => { setServiceType(value); setSelected(null); setDocuments([]); }}>{label}</button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, .85fr) minmax(0, 1.4fr)', gap: 16, alignItems: 'start' }}>
        <section className={styles.sectionCard}>
          <div className={styles.sectionHeader}><div className={styles.sectionTitle}>Applications ({vendors.length})</div></div>
          {vendors.length === 0 && !loading ? <p style={{ color: '#94A3B8' }}>No partners in this service group yet.</p> : vendors.map((vendor) => (
            <button key={vendor.id} type="button" onClick={() => void openVendor(vendor)} style={{ width: '100%', textAlign: 'left', border: '1px solid rgba(255,255,255,.08)', background: selected?.id === vendor.id ? 'rgba(247,163,0,.1)' : 'rgba(255,255,255,.025)', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 9, cursor: 'pointer' }}>
              <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}><strong>{vendor.name}</strong><small style={{ color: vendor.onboardingStatus === 'approved' ? '#34D399' : '#F7A300' }}>{vendor.onboardingStatus.replaceAll('_', ' ')}</small></span>
              <span style={{ display: 'block', color: '#94A3B8', fontSize: 12, marginTop: 6 }}>{vendor.phone} · {vendor.email || 'No email'}</span>
              <span style={{ display: 'block', color: '#64748B', fontSize: 11, marginTop: 6 }}>{vendor.documents?.filter((document) => document.status === 'pending').length || 0} documents pending review</span>
            </button>
          ))}
        </section>

        <section className={styles.sectionCard}>
          {!selected ? <div style={{ padding: 24, textAlign: 'center', color: '#94A3B8' }}><UserRoundCheck size={26} /><p>Select a partner application to review its profile and documents.</p></div> : <>
            <div className={styles.sectionHeader}><div><div className={styles.sectionTitle}>{selected.name}</div><small style={{ color: '#94A3B8' }}>{selected.phone} · {selected.onboardingStatus.replaceAll('_', ' ')}</small></div><span className={styles.statusPill}>{selected.status}</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10, marginBottom: 18 }}>
              {displayRows.filter(([, value]) => value !== undefined && value !== null && value !== '').map(([label, value]) => (
                <div key={String(label)} style={{ padding: 12, background: 'rgba(255,255,255,.035)', borderRadius: 10 }}><small style={{ color: '#94A3B8', display: 'block', marginBottom: 5 }}>{label}</small><strong style={{ fontSize: 13, wordBreak: 'break-word' }}>{String(value)}</strong></div>
              ))}
            </div>

            {serviceType === 'packers_movers' && (
              <section style={{ marginBottom: 20, padding: 14, border: '1px solid rgba(247,163,0,.28)', borderRadius: 12, background: 'rgba(247,163,0,.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: 13 }}>Partner agreement</strong>
                    {contractRecord?.signature ? <small style={{ color: '#94A3B8' }}>Signed by {contractRecord.signature.signerName} ({contractRecord.signature.signerRole}) · {new Date(contractRecord.signature.signedAt).toLocaleString('en-IN')} · {contractRecord.signature.contractVersion}{!hasCurrentSignature ? ' · refresh required' : ''}</small> : <small style={{ color: '#FCA5A5' }}>Not signed — application cannot be approved</small>}
                  </div>
                  {contractRecord?.signature && <span className={styles.statusPill}>{hasCurrentSignature ? 'Current' : 'Outdated'}</span>}
                </div>
                {contractRecord?.signature && <details style={{ marginTop: 12 }}>
                  <summary style={{ cursor: 'pointer', color: '#F7A300', fontSize: 12, fontWeight: 800 }}>View agreement and audit record</summary>
                  <p style={{ color: '#94A3B8', fontSize: 11, overflowWrap: 'anywhere' }}>SHA-256: {contractRecord.signature.contractHash}<br />OTP challenge: {contractRecord.signature.otpChallengeId}<br />IP: {contractRecord.signature.ipAddress || 'Not available'} · User agent: {contractRecord.signature.userAgent || 'Not available'}</p>
                  <pre style={{ maxHeight: 280, overflow: 'auto', whiteSpace: 'pre-wrap', color: '#CBD5E1', fontSize: 11, lineHeight: 1.5, padding: 12, background: '#08090B', borderRadius: 9 }}>{contractRecord.signature.contractText}</pre>
                </details>}
              </section>
            )}

            <div className={styles.sectionHeader}><div className={styles.sectionTitle}>Verification documents</div><FileCheck2 size={17} color="#F7A300" /></div>
            {documents.length === 0 ? <p style={{ color: '#94A3B8' }}>No uploaded documents.</p> : documents.map((document) => (
              <div key={document.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,.07)', padding: '12px 0' }}>
                <div><strong style={{ display: 'block', fontSize: 13 }}>{labelForDocument(document.documentType)}</strong><small style={{ color: '#94A3B8' }}>{document.fileName} · {document.status}</small>{document.reviewNotes && <small style={{ display: 'block', color: '#F7A300', marginTop: 3 }}>{document.reviewNotes}</small>}</div>
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}><a href={document.url} target="_blank" rel="noreferrer" className={styles.tableActionBtn}>View secure file</a>{document.status !== 'approved' && <button disabled={busy} className={styles.tableActionBtn} type="button" onClick={() => void reviewDocument(document.id, 'approved')}><CheckCircle2 size={14} /> Approve</button>}{document.status !== 'rejected' && <button disabled={busy} className={styles.tableActionBtn} type="button" onClick={() => void reviewDocument(document.id, 'rejected')}><ShieldAlert size={14} /> Reject</button>}</div>
              </div>
            ))}

            <label style={{ display: 'block', color: '#CBD5E1', fontSize: 12, fontWeight: 700, marginTop: 17 }}>Review note<textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} style={{ boxSizing: 'border-box', display: 'block', width: '100%', marginTop: 7, padding: 11, borderRadius: 9, border: '1px solid rgba(255,255,255,.12)', background: '#08090B', color: '#fff', font: 'inherit' }} /></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
              <button disabled={busy || !canEnterReview} type="button" className={styles.tableActionBtn} onClick={() => void runReview('under_review')}>Start review</button>
              <button disabled={busy || !canDecideApplication} type="button" className={styles.tableActionBtn} onClick={() => void runReview('needs_changes')}>Request changes</button>
              <button disabled={busy || !canDecideApplication} type="button" className={styles.tableActionBtn} onClick={() => void runReview('rejected')}>Reject application</button>
              <button disabled={busy || !canDecideApplication || !canApproveApplication} type="button" className={styles.tableActionBtn} style={{ background: '#10B981', color: '#06130D' }} onClick={() => void runReview('approved')}>Approve &amp; activate</button>
            </div>
          </>}
        </section>
      </div>
    </div>
  );
}
