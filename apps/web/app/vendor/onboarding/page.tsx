'use client';

import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowRight, CheckCircle2, FileCheck2, LoaderCircle, ShieldCheck, Truck, UploadCloud } from 'lucide-react';
import { ApiError, PartnerContract, vendor } from '../../lib/api';
import { useAuth } from '../../lib/useAuth';
import styles from './page.module.css';

const DOCUMENTS = [
  { id: 'business_pan', label: 'Business PAN', required: true },
  { id: 'owner_id', label: 'Owner identity proof', required: true },
  { id: 'business_address_proof', label: 'Business address proof', required: true },
  { id: 'bank_proof', label: 'Bank proof or cancelled cheque', required: true },
  { id: 'commercial_schedule', label: 'Commercial schedule signed by both parties · required for activation', required: false },
  { id: 'gst_certificate', label: 'GST registration certificate', required: false },
] as const;

export default function PnmOnboardingPage() {
  const router = useRouter();
  const { isLoggedIn, role, loading: authLoading } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [legalEntityType, setLegalEntityType] = useState('proprietorship');
  const [businessAddress, setBusinessAddress] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [documents, setDocuments] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [contract, setContract] = useState<PartnerContract | null>(null);
  const [contractLoading, setContractLoading] = useState(true);
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('Owner / Authorized Signatory');
  const [contractAccepted, setContractAccepted] = useState(false);
  const [contractOtp, setContractOtp] = useState('');
  const [otpDestination, setOtpDestination] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [signing, setSigning] = useState(false);
  const [profileStatus, setProfileStatus] = useState('');
  const [onboardingStatus, setOnboardingStatus] = useState('');
  const [scheduleStatus, setScheduleStatus] = useState('missing');

  useEffect(() => {
    if (!isLoggedIn || role !== 'vendor') return;
    let active = true;
    Promise.all([vendor.getPartnerContract(), vendor.getProfile()])
      .then(([nextContract, profile]) => {
        if (!active) return;
        setContract(nextContract);
        setProfileStatus(String(profile.status || ''));
        setOnboardingStatus(String(profile.onboardingStatus || ''));
        setBusinessName(String(profile.onboardingData?.businessName || ''));
        setOwnerName(String(profile.onboardingData?.ownerName || ''));
        setLegalEntityType(String(profile.onboardingData?.legalEntityType || 'proprietorship'));
        setBusinessAddress(String(profile.onboardingData?.businessAddress || ''));
        setServiceAreas(Array.isArray(profile.onboardingData?.serviceAreas) ? profile.onboardingData.serviceAreas.join(', ') : '');
        setTeamSize(String(profile.onboardingData?.teamSize || ''));
        const latestDocuments = new Map<string, { fileName: string; status: string }>();
        for (const document of profile.documents || []) if (!latestDocuments.has(document.documentType)) latestDocuments.set(document.documentType, document);
        setDocuments(Object.fromEntries([...latestDocuments.entries()].filter(([, document]) => document.status !== 'rejected').map(([type, document]) => [type, document.fileName])));
        setScheduleStatus(latestDocuments.get('commercial_schedule')?.status || 'missing');
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Could not load your P&M application.');
      })
      .finally(() => { if (active) setContractLoading(false); });
    return () => { active = false; };
  }, [isLoggedIn, role]);

  const missingDocuments = useMemo(
    () => DOCUMENTS.filter((document) => document.required && !documents[document.id]).map((document) => document.id),
    [documents],
  );

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(documentType);
    try {
      await vendor.uploadDocument(file, documentType);
      setDocuments((current) => ({ ...current, [documentType]: file.name }));
      if (documentType === 'commercial_schedule') setScheduleStatus('pending');
    } catch (cause) {
      setError(cause instanceof ApiError || cause instanceof Error ? cause.message : 'Could not upload this document.');
    } finally {
      setUploading(null);
      event.target.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (missingDocuments.length) {
      setError('Upload all four required business documents before submitting.');
      return;
    }
    if (!contract?.signature || contract.signature.contractHash !== contract.hash) {
      setError('Review and sign the current P&M partner agreement before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      await vendor.submitOnboarding({
        businessName: businessName.trim(),
        ownerName: ownerName.trim(),
        legalEntityType,
        businessAddress: businessAddress.trim(),
        serviceAreas: serviceAreas.split(',').map((area) => area.trim()).filter(Boolean),
        teamSize: Number(teamSize),
        serviceType: 'packers_movers',
      });
      setSubmitted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not submit your application.');
    } finally {
      setSubmitting(false);
    }
  };

  const requestSigningCode = async () => {
    setError(''); setSigning(true);
    try {
      const result = await vendor.requestPartnerContractOtp();
      setOtpDestination(result.destination);
      setOtpRequested(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not send the signing code.');
    } finally { setSigning(false); }
  };

  const signAgreement = async () => {
    if (!contract || !contractAccepted) return;
    const name = (signerName || ownerName).trim();
    if (name.length < 2 || signerRole.trim().length < 2 || !/^\d{6}$/.test(contractOtp)) {
      setError('Enter the authorised signatory details and the six-digit signing code.');
      return;
    }
    setError(''); setSigning(true);
    try {
      await vendor.signPartnerContract({ version: contract.version, hash: contract.hash, signerName: name, signerRole: signerRole.trim(), signatureText: name, otp: contractOtp, acceptTerms: true });
      const updated = await vendor.getPartnerContract();
      setContract(updated);
      setContractOtp('');
      setOtpRequested(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not sign the agreement.');
    } finally { setSigning(false); }
  };

  if (authLoading) return <main className={styles.loading}>Checking partner access…</main>;
  if (!isLoggedIn || role !== 'vendor') return <main className={styles.loading}>Sign in to continue with P&amp;M partner onboarding.</main>;

  const complianceOnly = profileStatus === 'active' && onboardingStatus === 'approved';
  if (submitted) {
    return (
      <main className={styles.page}>
        <section className={styles.successCard}>
          <div className={styles.successIcon}><CheckCircle2 size={34} /></div>
          <p className={styles.eyebrow}>P&amp;M partner application</p>
          <h1>Application sent for review</h1>
          <p>Your business profile and documents are now in Triveni’s verification queue. Orders and supervisor tools stay locked until the operations team approves the application.</p>
          <button type="button" className={styles.primaryButton} onClick={() => router.replace('/vendor/portal')}>View application status <ArrowRight size={17} /></button>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/">TRIVENI <span>PACKERS &amp; MOVERS PARTNER</span></Link>
          <div className={styles.headerIntro}>
            <div className={styles.icon}><Truck size={22} /></div>
            <p className={styles.eyebrow}>{complianceOnly ? 'Partner compliance · P&M service' : 'Business onboarding · P&M service'}</p>
            <h1>{complianceOnly ? 'Review partner terms' : 'Set up your moving business'}</h1>
            <p>{complianceOnly ? 'Keep the agreement and signed commercial schedule current for new order assignments.' : 'Share your business profile and documents. Triveni operations will review them before enabling orders.'}</p>
          </div>
        </header>

        <div className={styles.steps} aria-label="Onboarding steps">
          {complianceOnly ? <><span className={styles.stepActive}><b>1</b> Agreement</span><span><b>2</b> Commercial schedule</span></> : <><span className={styles.stepActive}><b>1</b> Business profile</span><span><b>2</b> Documents</span><span><b>3</b> Sign agreement</span><span><b>4</b> Triveni review</span></>}
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error} role="alert"><AlertCircle size={18} />{error}</div>}
          {complianceOnly ? <section className={styles.card}>
            <div className={styles.sectionHeading}><div><h2>Business status</h2><p>{businessName || 'Your P&M business'} is active and verified.</p></div><CheckCircle2 size={21} /></div>
            <p style={{ color: '#65748a', fontSize: 13, lineHeight: 1.6 }}>Existing assigned orders remain accessible. New assignments require the current agreement and an approved commercial schedule.</p>
          </section> : <section className={styles.card}>
            <div className={styles.sectionHeading}><div><h2>Business profile</h2><p>Business contact and operational coverage</p></div><ShieldCheck size={21} /></div>
            <div className={styles.grid}>
              <label>Registered business name<input value={businessName} onChange={(event) => setBusinessName(event.target.value)} minLength={2} maxLength={150} required autoComplete="organization" /></label>
              <label>Owner or authorized representative<input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} minLength={2} maxLength={150} required autoComplete="name" /></label>
              <label>Business type<select value={legalEntityType} onChange={(event) => setLegalEntityType(event.target.value)}><option value="proprietorship">Proprietorship</option><option value="partnership">Partnership</option><option value="llp">LLP</option><option value="private_limited">Private limited</option><option value="other">Other</option></select></label>
              <label>Active packing and moving crew<input value={teamSize} onChange={(event) => setTeamSize(event.target.value.replace(/\D/g, ''))} inputMode="numeric" min={1} max={5000} required /></label>
              <label className={styles.full}>Business address<textarea value={businessAddress} onChange={(event) => setBusinessAddress(event.target.value)} rows={3} maxLength={1000} required /></label>
              <label className={styles.full}>Service areas <span>Separate cities or areas with commas.</span><input value={serviceAreas} onChange={(event) => setServiceAreas(event.target.value)} placeholder="Thane, Mumbai, Navi Mumbai" required /></label>
            </div>
          </section>}

          <section className={styles.card}>
            <div className={styles.sectionHeading}><div><h2>{complianceOnly ? 'Commercial schedule' : 'Verification documents'}</h2><p>{complianceOnly ? 'Upload the schedule signed by Triveni and your business.' : 'PDF or clear photo, up to 10 MB each. Uploads are private.'}</p></div><FileCheck2 size={21} /></div>
            <div className={styles.documents}>
              {DOCUMENTS.filter((document) => !complianceOnly || document.id === 'commercial_schedule').map((document) => (
                <label key={document.id} className={styles.document}>
                  <span className={styles.documentIcon}>{documents[document.id] ? <CheckCircle2 size={19} /> : <UploadCloud size={19} />}</span>
                  <span className={styles.documentText}><strong>{document.label}{document.required && <em>Required</em>}</strong><small>{documents[document.id] || 'PDF, JPG, PNG or WebP'}</small></span>
                  {uploading === document.id ? <LoaderCircle className={styles.spinner} size={18} /> : <span className={styles.uploadLabel}>{documents[document.id] ? 'Replace' : 'Upload'}</span>}
                  <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => void handleUpload(event, document.id)} disabled={!!uploading || submitting} />
                </label>
              ))}
            </div>
            {complianceOnly && <p style={{ color: scheduleStatus === 'approved' ? '#13814b' : '#8a5a00', fontSize: 12, marginBottom: 0 }}>{scheduleStatus === 'approved' ? 'Signed commercial schedule verified.' : scheduleStatus === 'pending' ? 'Schedule uploaded and awaiting operations review.' : 'A verified signed schedule is needed before new orders can be assigned.'}</p>}
          </section>

          <section className={styles.card}>
            <div className={styles.sectionHeading}><div><h2>Partner service agreement</h2><p>Review the terms and sign electronically before submitting</p></div><FileCheck2 size={21} /></div>
            {contractLoading ? <p>Loading the current agreement…</p> : !contract ? <p role="alert">The agreement could not be loaded. Refresh this page and try again.</p> : contract.signature?.contractHash === contract.hash ? (
              <div className={styles.notice} role="status"><CheckCircle2 size={18} /><p>Signed by {contract.signature.signerName} ({contract.signature.signerRole}) on {new Date(contract.signature.signedAt).toLocaleString('en-IN')} · Version {contract.version}</p></div>
            ) : (
              <>
                <div style={{ maxHeight: 280, overflow: 'auto', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, background: '#fbfcfe', whiteSpace: 'pre-wrap', color: '#33445a', fontSize: 13, lineHeight: 1.6 }}>{contract.text}</div>
                <div className={styles.grid} style={{ marginTop: 16 }}>
                  <label>Authorised signatory full name<input value={signerName || ownerName} onChange={(event) => setSignerName(event.target.value)} minLength={2} maxLength={150} required autoComplete="name" /></label>
                  <label>Role in the business<input value={signerRole} onChange={(event) => setSignerRole(event.target.value)} minLength={2} maxLength={100} required /></label>
                </div>
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: 16, color: '#33445a', fontSize: 13, lineHeight: 1.5 }}>
                  <input type="checkbox" checked={contractAccepted} onChange={(event) => setContractAccepted(event.target.checked)} style={{ marginTop: 2 }} />
                  <span>I am authorised to bind this business. I have read agreement {contract.version} and intend to sign it using my typed name and the one-time code.</span>
                </label>
                {!otpRequested ? (
                  <button type="button" className={styles.primaryButton} disabled={signing || !contractAccepted || !ownerName.trim()} onClick={() => void requestSigningCode()} style={{ marginTop: 15 }}>{signing ? 'Sending code…' : 'Send signing code'}</button>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'end', marginTop: 15 }}>
                    <label style={{ display: 'grid', gap: 6, color: '#33445a', fontSize: 12, fontWeight: 800 }}>Six-digit code sent to {otpDestination}<input value={contractOtp} onChange={(event) => setContractOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} inputMode="numeric" autoComplete="one-time-code" maxLength={6} /></label>
                    <button type="button" className={styles.primaryButton} disabled={signing || contractOtp.length !== 6} onClick={() => void signAgreement()}>{signing ? 'Signing…' : 'Sign agreement'}</button>
                    <button type="button" className={styles.uploadLabel} onClick={() => void requestSigningCode()} disabled={signing}>Send a new code</button>
                  </div>
                )}
              </>
            )}
          </section>

          {!complianceOnly && <><div className={styles.notice}><ShieldCheck size={18} /><p>Submitting starts an operations review. Activation also requires an approved commercial schedule signed by both parties; operations can tell you how to complete this document.</p></div>
          <button type="submit" disabled={submitting || !!uploading || contractLoading || !contract?.signature || contract.signature.contractHash !== contract.hash} className={styles.primaryButton}>{submitting ? 'Submitting application…' : 'Submit for verification'} <ArrowRight size={17} /></button></>}
          {complianceOnly && <button type="button" className={styles.primaryButton} onClick={() => router.replace('/vendor/portal')}>Back to P&amp;M portal <ArrowRight size={17} /></button>}
        </form>
      </div>
    </main>
  );
}
