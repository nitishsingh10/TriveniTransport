import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Download, ShieldCheck, Truck } from 'lucide-react';
import Navbar from '../components/Navbar';
import styles from './page.module.css';

export default function PartnersPage() {
  const pnmAndroidUrl = process.env.NEXT_PUBLIC_PNM_VENDOR_ANDROID_URL;
  const pnmIosUrl = process.env.NEXT_PUBLIC_PNM_VENDOR_IOS_URL;
  const androidUrl = process.env.NEXT_PUBLIC_DRIVER_ANDROID_URL;
  const iosUrl = process.env.NEXT_PUBLIC_DRIVER_IOS_URL;
  const hasDriverDistribution = Boolean(androidUrl || iosUrl);

  return (
    <>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.glow} aria-hidden="true" />
        <div className={styles.shell}>
          <header className={styles.hero}>
            <span className={styles.eyebrow}><ShieldCheck size={15} /> Triveni partner network</span>
            <h1>Choose the partner app for your service</h1>
            <p>Packers and movers businesses and pickup &amp; truck drivers follow separate onboarding and dispatch procedures.</p>
          </header>

          <div className={styles.cards}>
            <section className={styles.card}>
              <div className={styles.icon}><BriefcaseBusiness size={23} /></div>
              <p className={styles.cardLabel}>P&amp;M Vendor app and web portal</p>
              <h2>Packers &amp; Movers vendor</h2>
              <p className={styles.description}>For moving companies that provide packing, loading, and household relocation crews.</p>
              <ol className={styles.steps}>
                <li><CheckCircle2 size={16} /><span>Verify the business contact by OTP and enter company details.</span></li>
                <li><CheckCircle2 size={16} /><span>Upload business documents and electronically sign the current agreement.</span></li>
                <li><CheckCircle2 size={16} /><span>Submit a commercial schedule signed by both parties for operations review.</span></li>
                <li><CheckCircle2 size={16} /><span>After approval, receive business assignments; invite supervisors and require their OTP verification before assigning field orders.</span></li>
              </ol>
              {pnmAndroidUrl || pnmIosUrl ? <div className={styles.downloads}>
                {pnmAndroidUrl && <a className={styles.primaryButton} href={pnmAndroidUrl} target="_blank" rel="noreferrer"><Download size={16} /> Android app</a>}
                {pnmIosUrl && <a className={styles.primaryButton} href={pnmIosUrl} target="_blank" rel="noreferrer"><Download size={16} /> iPhone app</a>}
              </div> : <div className={styles.distributionNote}>
                <strong>Native app install links are not configured yet.</strong>
                <span>Use the web flow below today. Add signed Android and iPhone build links after app distribution is set up.</span>
              </div>}
              <Link href="/vendor/signup" className={styles.primaryButton}>Apply as a P&amp;M vendor <ArrowRight size={17} /></Link>
              <Link href="/vendor/login" className={styles.secondaryLink}>P&amp;M vendor sign in</Link>
            </section>

            <section className={styles.card}>
              <div className={styles.icon}><Truck size={23} /></div>
              <p className={styles.cardLabel}>Driver Partner mobile app</p>
              <h2>Pickup &amp; truck driver</h2>
              <p className={styles.description}>For owner-drivers providing pickup or commercial truck service. This app does not onboard packing crews or P&amp;M companies.</p>
              <ol className={styles.steps}>
                <li><CheckCircle2 size={16} /><span>Verify the driver&apos;s mobile number by OTP.</span></li>
                <li><CheckCircle2 size={16} /><span>Submit driving licence, identity, vehicle, compliance, and payout documents.</span></li>
                <li><CheckCircle2 size={16} /><span>Wait for driver and vehicle documents to be reviewed and approved.</span></li>
                <li><CheckCircle2 size={16} /><span>Only an approved, compliant driver can see eligible pickup &amp; truck requests and accept a move.</span></li>
              </ol>
              {hasDriverDistribution ? (
                <div className={styles.downloads}>
                  {androidUrl && <a className={styles.primaryButton} href={androidUrl} target="_blank" rel="noreferrer"><Download size={16} /> Android app</a>}
                  {iosUrl && <a className={styles.primaryButton} href={iosUrl} target="_blank" rel="noreferrer"><Download size={16} /> iPhone app</a>}
                </div>
              ) : (
                <div className={styles.distributionNote}>
                  <strong>Driver app distribution link is not configured here.</strong>
                  <span>Contact operations to get the currently supported app install link.</span>
                  <a href="tel:+918828647785">Call +91 88286 47785</a>
                </div>
              )}
            </section>
          </div>

          <p className={styles.footerNote}>Approval is completed by Triveni operations. Creating an account or submitting documents does not enable orders.</p>
        </div>
      </main>
    </>
  );
}
