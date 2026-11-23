import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { router } from 'expo-router';
import { PartnerContract, clearSession, hasSession, pnmApi } from '@/lib/api';

const NAVY = '#0D1F37';
const GOLD = '#F7A300';
const DOCUMENTS = [
  { id: 'business_pan', label: 'Business PAN', required: true },
  { id: 'owner_id', label: 'Owner identity proof', required: true },
  { id: 'business_address_proof', label: 'Business address proof', required: true },
  { id: 'bank_proof', label: 'Bank proof or cancelled cheque', required: true },
  { id: 'commercial_schedule', label: 'Commercial schedule signed by both parties · needed for activation', required: false },
  { id: 'gst_certificate', label: 'GST registration certificate', required: false },
];
const ENTITY_TYPES = ['Proprietorship', 'Partnership', 'LLP', 'Private limited', 'Other'];

export default function PnmApplication() {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [contract, setContract] = useState<PartnerContract | null>(null);
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [entityType, setEntityType] = useState('Proprietorship');
  const [businessAddress, setBusinessAddress] = useState('');
  const [serviceAreas, setServiceAreas] = useState('');
  const [teamSize, setTeamSize] = useState('');
  const [uploaded, setUploaded] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState('');
  const [signerName, setSignerName] = useState('');
  const [signerRole, setSignerRole] = useState('Owner / Authorized Signatory');
  const [accepted, setAccepted] = useState(false);
  const [otp, setOtp] = useState('');
  const [destination, setDestination] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const [supervisors, setSupervisors] = useState<{ id: string; name: string; phone: string; status: 'invited' | 'active' | 'suspended'; phoneVerifiedAt?: string | null }[]>([]);
  const [selectedSupervisorByJob, setSelectedSupervisorByJob] = useState<Record<string, string | null>>({});
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorPhone, setSupervisorPhone] = useState('');
  const [opsLoading, setOpsLoading] = useState(false);
  const [scheduleStatus, setScheduleStatus] = useState('missing');

  useEffect(() => {
    let mounted = true;
    void (async () => {
      if (!await hasSession()) { router.replace('/'); return; }
      try {
        const [nextProfile, nextContract] = await Promise.all([pnmApi.getProfile(), pnmApi.getContract()]);
        if (!mounted) return;
        if (nextProfile.serviceType !== 'packers_movers') { await clearSession(); router.replace('/'); return; }
        setProfile(nextProfile);
        setContract(nextContract);
        const currentDocuments = new Map<string, any>();
        for (const document of nextProfile.documents || []) if (!currentDocuments.has(document.documentType)) currentDocuments.set(document.documentType, document);
        setUploaded(Object.fromEntries([...currentDocuments.entries()].filter(([, document]) => document.status !== 'rejected').map(([type, document]) => [type, document.fileName])));
        setScheduleStatus(currentDocuments.get('commercial_schedule')?.status || 'missing');
        setBusinessName(String(nextProfile.onboardingData?.businessName || ''));
        setOwnerName(String(nextProfile.onboardingData?.ownerName || ''));
        setEntityType(String(nextProfile.onboardingData?.legalEntityType || 'Proprietorship'));
        setBusinessAddress(String(nextProfile.onboardingData?.businessAddress || ''));
        setServiceAreas(Array.isArray(nextProfile.onboardingData?.serviceAreas) ? nextProfile.onboardingData.serviceAreas.join(', ') : '');
        setTeamSize(String(nextProfile.onboardingData?.teamSize || ''));
        if (nextProfile.status === 'active' && nextProfile.onboardingStatus === 'approved') {
          const [nextJobs, nextSupervisors] = await Promise.all([pnmApi.getJobs(), pnmApi.getSupervisors()]);
          if (!mounted) return;
          setJobs(nextJobs);
          setSupervisors(nextSupervisors);
          setSelectedSupervisorByJob(Object.fromEntries(nextJobs.map((job: any) => [job.id, job.supervisorId || null])));
        }
      } catch (cause) { if (mounted) setError(cause instanceof Error ? cause.message : 'Could not load your application.'); }
      finally { if (mounted) setReady(true); }
    })();
    return () => { mounted = false; };
  }, []);

  const isContractSigned = !!contract?.signature && contract.signature.contractHash === contract.hash;
  const requiredMissing = useMemo(() => DOCUMENTS.some((document) => document.required && !uploaded[document.id]), [uploaded]);
  const status = profile?.onboardingStatus;

  const upload = async (documentType: string) => {
    setError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setUploading(documentType);
      await pnmApi.uploadDocument(documentType, { uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size });
      setUploaded((current) => ({ ...current, [documentType]: asset.name }));
      if (documentType === 'commercial_schedule') setScheduleStatus('pending');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Secure upload failed.'); }
    finally { setUploading(''); }
  };

  const requestCode = async () => {
    setError(''); setBusy(true);
    try { const result = await pnmApi.requestSigningOtp(); setDestination(result.destination); setOtpRequested(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not send the signing code.'); }
    finally { setBusy(false); }
  };

  const sign = async () => {
    if (!contract || !accepted) return;
    const name = (signerName || ownerName).trim();
    if (name.length < 2 || signerRole.trim().length < 2 || !/^\d{6}$/.test(otp)) { setError('Enter signatory details and the six-digit code.'); return; }
    setBusy(true); setError('');
    try {
      await pnmApi.signContract({ version: contract.version, hash: contract.hash, signerName: name, signerRole: signerRole.trim(), signatureText: name, otp, acceptTerms: true });
      setContract(await pnmApi.getContract()); setOtp(''); setOtpRequested(false);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not sign the agreement.'); }
    finally { setBusy(false); }
  };

  const submit = async () => {
    const areas = serviceAreas.split(',').map((area) => area.trim()).filter(Boolean);
    if (businessName.trim().length < 2 || ownerName.trim().length < 2 || businessAddress.trim().length < 8 || !areas.length || !Number.isInteger(Number(teamSize)) || Number(teamSize) < 1 || requiredMissing || !isContractSigned) {
      setError('Complete the business profile, upload all required files, and sign the agreement before submitting.'); return;
    }
    setBusy(true); setError('');
    try {
      const result = await pnmApi.submitOnboarding({ businessName: businessName.trim(), ownerName: ownerName.trim(), legalEntityType: entityType.toLowerCase().replaceAll(' ', '_'), businessAddress: businessAddress.trim(), serviceAreas: areas, teamSize: Number(teamSize) });
      setProfile((current: any) => ({ ...current, onboardingStatus: result.onboardingStatus })); setSubmitted(true);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not submit the application.'); }
    finally { setBusy(false); }
  };

  const refreshOperations = async () => {
    setOpsLoading(true); setError('');
    try {
      const [nextJobs, nextSupervisors] = await Promise.all([pnmApi.getJobs(), pnmApi.getSupervisors()]);
      setJobs(nextJobs); setSupervisors(nextSupervisors);
      setSelectedSupervisorByJob((current) => Object.fromEntries(nextJobs.map((job: any) => [job.id, current[job.id] ?? job.supervisorId ?? null])));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not refresh your P&M operations.'); }
    finally { setOpsLoading(false); }
  };

  const addSupervisor = async () => {
    if (supervisorName.trim().length < 2 || !/^[6-9]\d{9}$/.test(supervisorPhone.replace(/\D/g, '').slice(-10))) { setError('Enter the supervisor’s name and a valid 10-digit mobile number.'); return; }
    setOpsLoading(true); setError('');
    try { await pnmApi.addSupervisor(supervisorName.trim(), supervisorPhone.replace(/\D/g, '').slice(-10)); setSupervisorName(''); setSupervisorPhone(''); await refreshOperations(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not add the supervisor.'); setOpsLoading(false); }
  };

  const assignSupervisor = async (bookingId: string) => {
    setOpsLoading(true); setError('');
    try { await pnmApi.assignSupervisor(bookingId, selectedSupervisorByJob[bookingId] || null); await refreshOperations(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not assign the supervisor.'); setOpsLoading(false); }
  };

  if (!ready) return <View style={styles.loading}><ActivityIndicator color={GOLD} /><Text style={styles.muted}>Preparing your P&amp;M application…</Text></View>;
  const applicationSent = submitted || ['submitted', 'under_review', 'approved', 'rejected'].includes(status);
  const needsComplianceUpdate = status === 'approved' && profile?.status === 'active' && (!isContractSigned || scheduleStatus !== 'approved');

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topbar}><View style={styles.brandMark}><Text style={styles.brandMarkText}>T</Text></View><View><Text style={styles.brand}>TRIVENI</Text><Text style={styles.brandSub}>P&amp;M VENDOR</Text></View><Pressable style={styles.signOut} onPress={async () => { await clearSession(); router.replace('/'); }}><Text style={styles.signOutText}>Sign out</Text></Pressable></View>
        <Text style={styles.eyebrow}>BUSINESS ONBOARDING · PACKERS &amp; MOVERS</Text>
        <Text style={styles.title}>{applicationSent ? 'Application status' : 'Set up your moving business'}</Text>
        <Text style={styles.copy}>{applicationSent ? 'Your account remains locked from orders until Triveni completes verification.' : 'Build your partner profile, upload verification files, and sign the agreement. Triveni reviews the application before enabling orders.'}</Text>

        {applicationSent ? (
          <View style={styles.card}>
            <View style={styles.statusBadge}><Text style={styles.statusText}>{submitted ? 'Submitted for review' : String(status).replaceAll('_', ' ')}</Text></View>
            <Text style={styles.cardTitle}>{submitted ? 'Your application is in the review queue' : status === 'approved' ? 'Your business is verified' : status === 'rejected' ? 'Contact partner support' : 'Verification in progress'}</Text>
            <Text style={styles.muted}>Business: {profile?.onboardingData?.businessName || businessName}</Text>
            {profile?.reviewNotes ? <Text style={styles.muted}>Review note: {profile.reviewNotes}</Text> : null}
            <Text style={styles.noticeText}>{status === 'approved' ? 'New orders require the current agreement and an approved commercial schedule. Existing assigned work remains available.' : 'No orders are available until the application and required documents are fully verified and the account is activated.'}</Text>
            {needsComplianceUpdate && <View style={styles.complianceCard}>
              <Text style={styles.cardTitle}>Partner terms update</Text>
              <Text style={styles.muted}>We need the current agreement and commercial schedule on file before assigning new P&amp;M orders. Your existing assigned work remains available.</Text>
              {!isContractSigned && <>
                <View style={styles.contractBox}><Text style={styles.contractText}>{contract?.text || 'Loading agreement…'}</Text></View>
                <Field label="Authorized signatory full name" value={signerName || ownerName} onChangeText={setSignerName} autoComplete="name" />
                <Field label="Role in the business" value={signerRole} onChangeText={setSignerRole} />
                <Pressable onPress={() => setAccepted((value) => !value)} style={styles.acceptRow}><View style={[styles.checkbox, accepted && styles.checkboxActive]}>{accepted && <Text style={styles.checkboxTick}>✓</Text>}</View><Text style={styles.acceptText}>I can bind this business, have read the current agreement and intend to sign with my typed name and one-time code.</Text></Pressable>
                {!otpRequested ? <PrimaryButton title="Send signing code" onPress={() => void requestCode()} busy={busy} disabled={!accepted} /> : <><Text style={styles.label}>Six-digit code sent to {destination}</Text><TextInput style={styles.input} value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="000000" /><PrimaryButton title="Sign current agreement" onPress={() => void sign()} busy={busy} disabled={otp.length !== 6} /></>}
              </>}
              {scheduleStatus !== 'approved' && <>
                <Text style={[styles.label, { marginTop: 13 }]}>Commercial schedule · {scheduleStatus === 'pending' ? 'awaiting review' : 'not approved'}</Text>
                <Pressable onPress={() => void upload('commercial_schedule')} disabled={!!uploading} style={styles.documentRow}><View style={[styles.documentIcon, uploaded.commercial_schedule && styles.documentDone]}><Text style={styles.documentIconText}>{uploaded.commercial_schedule ? '✓' : '↑'}</Text></View><View style={styles.documentCopy}><Text style={styles.documentTitle}>Upload the schedule signed by Triveni and your business</Text><Text style={styles.mutedSmall}>{uploading === 'commercial_schedule' ? 'Uploading securely…' : uploaded.commercial_schedule || 'PDF or clear image'}</Text></View><Text style={styles.pickText}>{uploading === 'commercial_schedule' ? '…' : 'Upload'}</Text></Pressable>
              </>}
            </View>}
            {status === 'approved' && profile?.status === 'active' && <>
              <View style={styles.opsHeader}><Text style={styles.opsTitle}>P&amp;M operations</Text><Pressable onPress={() => void refreshOperations()} disabled={opsLoading}><Text style={styles.pickText}>{opsLoading ? 'Refreshing…' : 'Refresh'}</Text></Pressable></View>
              <Text style={styles.cardTitle}>Assigned orders · {jobs.length}</Text>
              {jobs.length === 0 ? <Text style={styles.muted}>No active P&amp;M orders are assigned to your business.</Text> : jobs.map((job) => {
                const eligibleSupervisors = supervisors.filter((supervisor) => supervisor.status === 'active' && supervisor.phoneVerifiedAt);
                return <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}><Text style={styles.jobStatus}>{String(job.status).replaceAll('_', ' ')}</Text><Text style={styles.mutedSmall}>{new Date(job.scheduledDate).toLocaleDateString('en-IN')} · {job.scheduledSlot}</Text></View>
                  <Text style={styles.jobAddress}>{job.pickupAddress}</Text><Text style={styles.mutedSmall}>↓</Text><Text style={styles.jobAddress}>{job.dropAddress}</Text>
                  <Text style={styles.mutedSmall}>{job.customer?.name || 'Customer'}{job.customer?.phone ? ` · ${job.customer.phone}` : ''}</Text>
                  <Text style={[styles.label, { marginTop: 12 }]}>Assign verified supervisor</Text>
                  <View style={styles.choiceWrap}>
                    <Pressable onPress={() => setSelectedSupervisorByJob((current) => ({ ...current, [job.id]: null }))} style={[styles.choice, !selectedSupervisorByJob[job.id] && styles.choiceActive]}><Text style={[styles.choiceText, !selectedSupervisorByJob[job.id] && styles.choiceTextActive]}>Unassigned</Text></Pressable>
                    {eligibleSupervisors.map((supervisor) => <Pressable key={supervisor.id} onPress={() => setSelectedSupervisorByJob((current) => ({ ...current, [job.id]: supervisor.id }))} style={[styles.choice, selectedSupervisorByJob[job.id] === supervisor.id && styles.choiceActive]}><Text style={[styles.choiceText, selectedSupervisorByJob[job.id] === supervisor.id && styles.choiceTextActive]}>{supervisor.name}</Text></Pressable>)}
                  </View>
                  <PrimaryButton title="Save supervisor assignment" onPress={() => void assignSupervisor(job.id)} busy={opsLoading} />
                </View>;
              })}
              <Text style={[styles.cardTitle, { marginTop: 15 }]}>Supervisors</Text>
              {supervisors.map((supervisor) => <View key={supervisor.id} style={styles.supervisorRow}><View style={{ flex: 1 }}><Text style={styles.documentTitle}>{supervisor.name}</Text><Text style={styles.mutedSmall}>{supervisor.phone} · {supervisor.phoneVerifiedAt ? 'OTP verified' : supervisor.status === 'invited' ? 'Awaiting OTP verification' : 'Suspended'}</Text></View>{supervisor.status !== 'suspended' && <Pressable onPress={async () => { setOpsLoading(true); try { await pnmApi.revokeSupervisor(supervisor.id); await refreshOperations(); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Could not remove supervisor.'); setOpsLoading(false); } }}><Text style={styles.revoke}>Remove</Text></Pressable>}</View>)}
              <Text style={styles.muted}>Supervisors must verify their own mobile number by OTP before they can be assigned to orders.</Text>
              <Text selectable style={styles.inviteLink}>Share this verification link with each invited supervisor: https://www.trivenitransport.online/vendor/supervisor/login</Text>
              <Field label="Supervisor full name" value={supervisorName} onChangeText={setSupervisorName} />
              <Field label="Supervisor mobile number" value={supervisorPhone} onChangeText={(value: string) => setSupervisorPhone(value.replace(/[^\d+]/g, '').slice(0, 14))} keyboardType="phone-pad" />
              <PrimaryButton title="Add supervisor" onPress={() => void addSupervisor()} busy={opsLoading} />
            </>}
          </View>
        ) : (
          <>
            <Step number="1" title="Business profile" />
            <View style={styles.card}>
              <Field label="Registered business name" value={businessName} onChangeText={setBusinessName} autoComplete="organization" />
              <Field label="Owner or authorized representative" value={ownerName} onChangeText={setOwnerName} autoComplete="name" />
              <Text style={styles.label}>Business type</Text>
              <View style={styles.choiceWrap}>{ENTITY_TYPES.map((type) => <Pressable key={type} onPress={() => setEntityType(type)} style={[styles.choice, entityType === type && styles.choiceActive]}><Text style={[styles.choiceText, entityType === type && styles.choiceTextActive]}>{type}</Text></Pressable>)}</View>
              <Field label="Active packing and moving crew" value={teamSize} onChangeText={(value: string) => setTeamSize(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" />
              <Field label="Business address" value={businessAddress} onChangeText={setBusinessAddress} multiline />
              <Field label="Service areas (comma separated)" value={serviceAreas} onChangeText={setServiceAreas} placeholder="Thane, Mumbai, Navi Mumbai" />
            </View>

            <Step number="2" title="Verification documents" />
            <View style={styles.card}>
              <Text style={styles.muted}>PDF or clear image, up to 10 MB each. Files are uploaded to private storage.</Text>
              {DOCUMENTS.map((document) => <Pressable key={document.id} onPress={() => void upload(document.id)} disabled={!!uploading} style={styles.documentRow}>
                <View style={[styles.documentIcon, uploaded[document.id] && styles.documentDone]}><Text style={styles.documentIconText}>{uploaded[document.id] ? '✓' : '↑'}</Text></View>
                <View style={styles.documentCopy}><Text style={styles.documentTitle}>{document.label}{document.required ? ' · Required' : ' · Optional'}</Text><Text style={styles.mutedSmall}>{uploading === document.id ? 'Uploading securely…' : uploaded[document.id] || 'Tap to choose file'}</Text></View>
                <Text style={styles.pickText}>{uploading === document.id ? '…' : uploaded[document.id] ? 'Replace' : 'Upload'}</Text>
              </Pressable>)}
            </View>

            <Step number="3" title="Partner service agreement" />
            <View style={styles.card}>
              {isContractSigned ? <View style={styles.signed}><Text style={styles.signedMark}>✓</Text><Text style={styles.signedText}>Signed by {contract?.signature?.signerName} · {contract?.version}</Text></View> : <>
                <Text style={styles.muted}>Read the full terms. Signing is confirmed by a code sent to your verified contact.</Text>
                <View style={styles.contractBox}><Text style={styles.contractText}>{contract?.text || 'Loading agreement…'}</Text></View>
                <Field label="Authorized signatory full name" value={signerName || ownerName} onChangeText={setSignerName} autoComplete="name" />
                <Field label="Role in the business" value={signerRole} onChangeText={setSignerRole} />
                <Pressable onPress={() => setAccepted((value) => !value)} style={styles.acceptRow}><View style={[styles.checkbox, accepted && styles.checkboxActive]}>{accepted && <Text style={styles.checkboxTick}>✓</Text>}</View><Text style={styles.acceptText}>I can bind this business, have read version {contract?.version || ''}, and intend to sign with my typed name and one-time code.</Text></Pressable>
                {!otpRequested ? <PrimaryButton title="Send signing code" onPress={() => void requestCode()} busy={busy} disabled={!accepted || !ownerName.trim()} /> : <>
                  <Text style={styles.label}>Six-digit code sent to {destination}</Text><TextInput style={styles.input} value={otp} onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" maxLength={6} placeholder="000000" />
                  <PrimaryButton title="Sign agreement" onPress={() => void sign()} busy={busy} disabled={otp.length !== 6} />
                </>}
              </>}
            </View>

            <View style={styles.notice}><Text style={styles.noticeText}>Application submission starts a review. It does not activate your account or unlock orders.</Text></View>
            {!!error && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
            <PrimaryButton title="Submit for verification" onPress={() => void submit()} busy={busy} disabled={busy || requiredMissing || !isContractSigned} />
          </>
        )}
        {!!error && applicationSent && <Text style={styles.error} accessibilityRole="alert">{error}</Text>}
        <Text style={styles.footer}>P&amp;M businesses only · Pickup and truck partners use the separate Driver Partner app.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Step({ number, title }: { number: string; title: string }) { return <View style={styles.step}><View style={styles.stepNum}><Text style={styles.stepNumText}>{number}</Text></View><Text style={styles.stepTitle}>{title}</Text></View>; }
function Field(props: any) { return <View style={styles.field}><Text style={styles.label}>{props.label}</Text><TextInput {...props} style={[styles.input, props.multiline && styles.multiline]} placeholderTextColor="#829AB1" /></View>; }
function PrimaryButton({ title, onPress, busy, disabled }: { title: string; onPress: () => void; busy?: boolean; disabled?: boolean }) { return <Pressable onPress={onPress} disabled={disabled || busy} style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, (disabled || busy) && styles.buttonDisabled]}>{busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{title}</Text>}</Pressable>; }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' }, scroll: { paddingHorizontal: 18, paddingTop: 23, paddingBottom: 40, width: '100%', maxWidth: 680, alignSelf: 'center' }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: '#F8FAFC' },
  topbar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 29 }, brandMark: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: NAVY }, brandMarkText: { color: GOLD, fontWeight: '900', fontSize: 22 }, brand: { color: NAVY, fontSize: 14, fontWeight: '900', letterSpacing: 2 }, brandSub: { color: '#A66B00', fontSize: 8, fontWeight: '900', letterSpacing: 1.7, marginTop: 2 }, signOut: { marginLeft: 'auto', padding: 9 }, signOutText: { color: '#50627A', fontSize: 12, fontWeight: '800' },
  eyebrow: { color: '#A66B00', fontSize: 10, fontWeight: '900', letterSpacing: 1.3 }, title: { color: NAVY, fontSize: 31, fontWeight: '900', letterSpacing: -1.1, marginTop: 7 }, copy: { color: '#62748A', fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 21 }, step: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, marginBottom: 9 }, stepNum: { width: 27, height: 27, borderRadius: 14, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' }, stepNumText: { color: NAVY, fontSize: 12, fontWeight: '900' }, stepTitle: { color: NAVY, fontSize: 16, fontWeight: '900' },
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 17, padding: 16, marginBottom: 7 }, complianceCard: { backgroundColor: '#FFFDF7', borderWidth: 1, borderColor: '#F3D58C', borderRadius: 14, padding: 13, marginTop: 18 }, field: { marginBottom: 14 }, label: { color: '#33445A', fontSize: 12, fontWeight: '800', marginBottom: 6 }, input: { borderWidth: 1, borderColor: '#D9E2EC', borderRadius: 10, padding: 12, color: NAVY, backgroundColor: '#FBFCFE', fontSize: 14 }, multiline: { minHeight: 82, textAlignVertical: 'top' }, muted: { color: '#738398', fontSize: 12, lineHeight: 18, marginBottom: 8 }, mutedSmall: { color: '#8291A3', fontSize: 11, marginTop: 4 }, choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 15 }, choice: { borderWidth: 1, borderColor: '#D9E2EC', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 11 }, choiceActive: { backgroundColor: '#FFF5DB', borderColor: GOLD }, choiceText: { color: '#53657B', fontSize: 11, fontWeight: '700' }, choiceTextActive: { color: NAVY },
  documentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#EDF2F7' }, documentIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }, documentDone: { backgroundColor: '#E7F7EE' }, documentIconText: { color: NAVY, fontWeight: '900', fontSize: 15 }, documentCopy: { flex: 1 }, documentTitle: { color: '#24364D', fontSize: 12, fontWeight: '800' }, pickText: { color: '#1768A5', fontSize: 11, fontWeight: '900' }, contractBox: { maxHeight: 270, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 11, padding: 12, backgroundColor: '#FBFCFE', marginVertical: 12 }, contractText: { color: '#33445A', fontSize: 11, lineHeight: 17 }, acceptRow: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', marginVertical: 14 }, checkbox: { width: 19, height: 19, borderRadius: 5, borderWidth: 1, borderColor: '#A8B4C3', alignItems: 'center', justifyContent: 'center' }, checkboxActive: { backgroundColor: NAVY, borderColor: NAVY }, checkboxTick: { color: GOLD, fontSize: 12, fontWeight: '900' }, acceptText: { flex: 1, color: '#4D5F75', fontSize: 11, lineHeight: 17 }, signed: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 12, borderRadius: 11, backgroundColor: '#EAF7EE' }, signedMark: { color: '#13834C', fontSize: 18, fontWeight: '900' }, signedText: { color: '#17613B', fontSize: 12, fontWeight: '800', flex: 1 },
  button: { minHeight: 49, backgroundColor: NAVY, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 10 }, buttonPressed: { backgroundColor: '#1C385B' }, buttonDisabled: { opacity: 0.55 }, buttonText: { color: '#fff', fontSize: 13, fontWeight: '900' }, notice: { backgroundColor: '#FFF7E5', borderWidth: 1, borderColor: '#F3D58C', borderRadius: 12, padding: 13, marginTop: 12 }, noticeText: { color: '#805500', fontSize: 12, lineHeight: 18 }, error: { color: '#B42335', backgroundColor: '#FFF1F2', borderRadius: 10, padding: 11, marginTop: 12, fontSize: 12, lineHeight: 17 }, statusBadge: { alignSelf: 'flex-start', borderRadius: 20, backgroundColor: '#FFF3D6', paddingVertical: 6, paddingHorizontal: 10, marginBottom: 13 }, statusText: { color: '#815700', fontWeight: '900', textTransform: 'capitalize', fontSize: 11 }, cardTitle: { color: NAVY, fontSize: 19, fontWeight: '900', marginBottom: 9 }, footer: { color: '#8291A3', textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 23 },
  opsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#EDF2F7', marginTop: 18, paddingTop: 16, marginBottom: 14 }, opsTitle: { color: NAVY, fontSize: 18, fontWeight: '900' }, jobCard: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 13, padding: 13, marginTop: 10, backgroundColor: '#FBFCFE' }, jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }, jobStatus: { color: '#805500', backgroundColor: '#FFF3D6', paddingVertical: 5, paddingHorizontal: 8, borderRadius: 15, fontSize: 10, fontWeight: '900' }, jobAddress: { color: NAVY, fontSize: 13, lineHeight: 18, fontWeight: '700' }, supervisorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EDF2F7' }, revoke: { color: '#B42335', fontSize: 11, fontWeight: '800' }, inviteLink: { color: '#1768A5', fontSize: 11, lineHeight: 17, padding: 10, backgroundColor: '#F1F7FD', borderRadius: 9, marginBottom: 13 },
});
