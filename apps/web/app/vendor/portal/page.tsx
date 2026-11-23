'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, LogOut, MapPin, RefreshCw, Truck, UserRound } from 'lucide-react';
import { ApiError, vendor, VendorJob, VendorProfile, VendorVehicle, VendorSupervisor } from '../../lib/api';
import { useAuth } from '../../lib/useAuth';
import styles from './page.module.css';

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function VendorPortalPage() {
  const router = useRouter();
  const { isLoggedIn, role, user, loading: authLoading, logout } = useAuth();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [vehicles, setVehicles] = useState<VendorVehicle[]>([]);
  const [jobs, setJobs] = useState<VendorJob[]>([]);
  const [supervisors, setSupervisors] = useState<VendorSupervisor[]>([]);
  const [supervisorName, setSupervisorName] = useState('');
  const [supervisorPhone, setSupervisorPhone] = useState('');
  const [supervisorError, setSupervisorError] = useState('');
  const [supervisorBusy, setSupervisorBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPortal = useCallback(() => Promise.all([
        vendor.getProfile(),
        vendor.getVehicles(),
        vendor.getJobs(),
      ]), []);

  const loadPortal = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [nextProfile, nextVehicles, nextJobs] = await fetchPortal();
      setProfile(nextProfile);
      setVehicles(nextVehicles);
      setJobs(nextJobs);
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : 'We could not load your partner details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fetchPortal]);

  useEffect(() => {
    if (authLoading) return;
    if (!isLoggedIn || role !== 'vendor') {
      router.replace('/vendor/login?next=%2Fvendor%2Fportal');
      return;
    }
    let active = true;
    fetchPortal()
      .then(([nextProfile, nextVehicles, nextJobs]) => {
        if (!active) return;
        setProfile(nextProfile);
        setVehicles(nextVehicles);
        setJobs(nextJobs);
      })
      .catch((cause) => {
        if (!active) return;
        setError(cause instanceof ApiError ? cause.message : 'We could not load your partner details. Please try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [authLoading, fetchPortal, isLoggedIn, role, router]);

  useEffect(() => {
    if (profile?.serviceType !== 'packers_movers' || profile.status !== 'active' || profile.onboardingStatus !== 'approved') {
      return;
    }
    vendor.getSupervisors().then(setSupervisors).catch((cause) => {
      setSupervisorError(cause instanceof Error ? cause.message : 'Could not load supervisors.');
    });
  }, [profile]);

  const handleAddSupervisor = async (event: FormEvent) => {
    event.preventDefault();
    setSupervisorBusy(true); setSupervisorError('');
    try {
      await vendor.addSupervisor({ name: supervisorName.trim(), phone: supervisorPhone.replace(/\D/g, '') });
      setSupervisorName(''); setSupervisorPhone('');
      setSupervisors(await vendor.getSupervisors());
    } catch (cause) {
      setSupervisorError(cause instanceof ApiError ? cause.message : 'Could not invite this supervisor.');
    } finally { setSupervisorBusy(false); }
  };

  const handleSupervisorAssignment = async (bookingId: string, supervisorId: string) => {
    setSupervisorError('');
    try {
      await vendor.assignSupervisor(bookingId, supervisorId || null);
      await loadPortal();
    } catch (cause) {
      setSupervisorError(cause instanceof ApiError ? cause.message : 'Could not assign this supervisor.');
    }
  };

  const handleRevokeSupervisor = async (person: VendorSupervisor) => {
    if (!window.confirm(`Revoke ${person.name}'s supervisor access and clear their open order assignments?`)) return;
    setSupervisorError('');
    try {
      await vendor.revokeSupervisor(person.id);
      setSupervisors(await vendor.getSupervisors());
      await loadPortal();
    } catch (cause) {
      setSupervisorError(cause instanceof ApiError ? cause.message : 'Could not revoke this supervisor.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/vendor/login');
  };

  if (authLoading || !isLoggedIn || role !== 'vendor') {
    return <main className={styles.statusPage} role="status" aria-live="polite">Checking partner access…</main>;
  }

  const displayName = profile?.name || user?.name || 'Partner';

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <div className={styles.content}>
        <header className={styles.header}>
          <div>
            <Link href="/" className={styles.brand}>TRIVENI <span>P&amp;M PARTNER</span></Link>
            <p className={styles.eyebrow}>Fleet operations</p>
            <h1>Welcome, {displayName}</h1>
            <p className={styles.lede}>Manage your moving business, assigned orders, and field supervisors.</p>
          </div>
          <div className={styles.headerActions}>
            <button type="button" className={styles.secondaryButton} onClick={() => void loadPortal()} disabled={loading}>
              <RefreshCw size={16} className={loading ? styles.spinning : undefined} />
              Refresh
            </button>
            <button type="button" className={styles.secondaryButton} onClick={handleLogout}>
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </header>

        {profile?.onboardingStatus !== 'approved' || profile.status !== 'active' ? (
          <section className={styles.panel} style={{ marginBottom: 18, borderColor: '#efd08e', background: '#fffaf0' }}>
            <p className={styles.eyebrow}>Partner verification</p>
            <h2 style={{ margin: '0 0 8px', color: '#0d1f37' }}>{profile?.onboardingStatus === 'submitted' || profile?.onboardingStatus === 'under_review' ? 'Application under review' : profile?.onboardingStatus === 'needs_changes' ? 'Changes requested' : 'Complete your business onboarding'}</h2>
            <p className={styles.empty} style={{ marginTop: 0 }}>{profile?.reviewNotes || 'Your business documents must be reviewed and approved before orders or supervisor management become available.'}</p>
            <Link href="/vendor/onboarding" className={styles.secondaryButton} style={{ textDecoration: 'none' }}>{profile?.onboardingStatus === 'submitted' ? 'Review application details' : 'Continue onboarding'} →</Link>
          </section>
        ) : null}

        {profile?.onboardingStatus === 'approved' && profile.status === 'active' && profile.serviceType === 'packers_movers' && (
          <section className={styles.panel} style={{ marginBottom: 18, borderColor: '#efd08e', background: '#fffaf0' }}>
            <p className={styles.eyebrow}>Partner terms</p>
            <p className={styles.empty} style={{ margin: '0 0 10px' }}>Review the current agreement and upload the commercial schedule signed by both parties. New assignments require an approved schedule.</p>
            <Link href="/vendor/onboarding" className={styles.secondaryButton} style={{ textDecoration: 'none' }}>Review agreement and schedule →</Link>
          </section>
        )}

        <section className={styles.summaryGrid} aria-label="Partner account summary">
          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}><UserRound size={18} /></span>
            <div><span className={styles.summaryLabel}>Account</span><strong>{profile?.status || 'Active partner'}</strong></div>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}><Truck size={18} /></span>
            <div><span className={styles.summaryLabel}>Active vehicles</span><strong>{vehicles.length}</strong></div>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}><CalendarDays size={18} /></span>
            <div><span className={styles.summaryLabel}>Moves in your queue</span><strong>{jobs.length}</strong></div>
          </article>
        </section>

        {error && (
          <div className={styles.error} role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => void loadPortal()}>Try again</button>
          </div>
        )}

        <div className={styles.columns}>
          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div><p className={styles.eyebrow}>Orders</p><h2>Orders assigned to your business</h2></div>
              <span className={styles.count}>{jobs.length}</span>
            </div>
            {loading && jobs.length === 0 ? (
              <p className={styles.empty}>Loading your assignments…</p>
            ) : jobs.length === 0 ? (
              <p className={styles.empty}>There are no moves in your queue right now. New assignments will appear here.</p>
            ) : (
              <div className={styles.jobList}>
                  {jobs.map((job) => (
                  <article className={styles.jobCard} key={job.id}>
                    <div className={styles.jobTop}>
                      <span className={styles.jobRef}>Move {job.id.slice(0, 8).toUpperCase()}</span>
                      <span className={styles.status}>{job.status.replaceAll('_', ' ')}</span>
                    </div>
                    <p className={styles.jobDate}><CalendarDays size={15} /> {formatDate(job.scheduledDate)} · {job.scheduledSlot}</p>
                    <div className={styles.route}>
                      <div><span className={styles.routeDot} /><p>{job.pickupAddress}</p></div>
                      <div><span className={`${styles.routeDot} ${styles.routeEnd}`} /><p>{job.dropAddress}</p></div>
                    </div>
                    {(job.customer?.name || job.vehicle) && (
                      <div className={styles.jobFooter}>
                        <span>{job.customer?.name || 'Customer'}</span>
                        {job.vehicle && <span>{job.vehicle.type} · {job.vehicle.registrationNumber}</span>}
                      </div>
                    )}
                    {profile?.serviceType === 'packers_movers' && profile.onboardingStatus === 'approved' && (
                      <label style={{ display: 'grid', gap: 6, marginTop: 12, color: '#627288', fontSize: 12, fontWeight: 700 }}>
                        Field supervisor
                        <select value={job.supervisorId || ''} onChange={(event) => void handleSupervisorAssignment(job.id, event.target.value)} style={{ minHeight: 40, border: '1px solid #dce3eb', borderRadius: 10, padding: '0 10px', background: '#fff', color: '#172a42' }}>
                          <option value="">Assign later</option>
                          {supervisors.filter((person) => person.status === 'active' && person.phoneVerifiedAt).map((person) => <option key={person.id} value={person.id}>{person.name} · {person.phone}</option>)}
                        </select>
                      </label>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>

          <aside className={styles.sideColumn}>
            {profile?.serviceType === 'packers_movers' && profile.status === 'active' && profile.onboardingStatus === 'approved' && (
              <section className={styles.panel}>
                <div className={styles.panelHeader}><div><p className={styles.eyebrow}>Field team</p><h2>Supervisors</h2></div><UserRound size={18} color="#a66b00" /></div>
                <p className={styles.empty}>Invite a supervisor by mobile number. They must verify the invitation with OTP before you can assign them to an order.</p>
                {supervisorError && <p role="alert" style={{ color: '#b42332', fontSize: 12 }}>{supervisorError}</p>}
                <form onSubmit={handleAddSupervisor} style={{ display: 'grid', gap: 9 }}>
                  <input value={supervisorName} onChange={(event) => setSupervisorName(event.target.value)} placeholder="Supervisor full name" required minLength={2} maxLength={150} style={{ minHeight: 40, padding: '0 11px', borderRadius: 10, border: '1px solid #dce3eb' }} />
                  <input value={supervisorPhone} onChange={(event) => setSupervisorPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" inputMode="numeric" pattern="[6-9][0-9]{9}" required style={{ minHeight: 40, padding: '0 11px', borderRadius: 10, border: '1px solid #dce3eb' }} />
                  <button type="submit" className={styles.secondaryButton} disabled={supervisorBusy}>{supervisorBusy ? 'Adding…' : 'Add supervisor'}</button>
                </form>
                <div style={{ display: 'grid', gap: 8, marginTop: 15 }}>
                  {supervisors.map((person) => <div key={person.id} style={{ padding: 10, borderRadius: 11, background: '#f7f9fc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, fontSize: 12 }}><span><strong>{person.name}</strong><br /><span style={{ color: '#77869a' }}>{person.phone}</span></span><span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><strong style={{ color: person.status === 'suspended' ? '#b42332' : person.phoneVerifiedAt ? '#13824b' : '#a66b00', textTransform: 'capitalize' }}>{person.status === 'suspended' ? 'Access revoked' : person.phoneVerifiedAt ? 'OTP verified' : 'Awaiting OTP'}</strong>{person.status !== 'suspended' && <button type="button" onClick={() => void handleRevokeSupervisor(person)} style={{ border: '1px solid #e4bdc1', borderRadius: 8, padding: '5px 8px', background: '#fff', color: '#a12c39', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Revoke</button>}</span></div>)}
                </div>
                <Link href="/vendor/supervisor/login" style={{ display: 'inline-block', marginTop: 13, color: '#1768a5', fontSize: 12 }}>Supervisor sign-in link</Link>
              </section>
            )}
            <section className={styles.panel}>
              <div className={styles.panelHeader}><div><p className={styles.eyebrow}>Your fleet</p><h2>Vehicles</h2></div></div>
              {loading && vehicles.length === 0 ? (
                <p className={styles.empty}>Loading vehicles…</p>
              ) : vehicles.length === 0 ? (
                <p className={styles.empty}>No active vehicles are linked to this partner account yet.</p>
              ) : (
                <div className={styles.vehicleList}>
                  {vehicles.map((vehicle) => (
                    <article className={styles.vehicleCard} key={vehicle.id}>
                      <span className={styles.vehicleIcon}><Truck size={19} /></span>
                      <div><strong>{vehicle.registrationNumber}</strong><span>{vehicle.type} · {vehicle.capacityCft} CFT</span></div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <p className={styles.eyebrow}>Account details</p>
              <h2>{displayName}</h2>
              <p className={styles.contact}>{profile?.phone || user?.phone || 'Phone number not available'}</p>
              {profile?.email && <p className={styles.contact}>{profile.email}</p>}
              <p className={styles.accountNote}><MapPin size={15} /> Your job details are visible only to your signed-in partner account.</p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
