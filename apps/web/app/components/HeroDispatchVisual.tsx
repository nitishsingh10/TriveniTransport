'use client';

import { motion } from 'framer-motion';
import { Truck, ArrowRight, Shield, Award, Navigation2, CheckCircle2 } from 'lucide-react';
import styles from './HeroDispatchVisual.module.css';

export default function HeroDispatchVisual() {
  return (
    <div className={styles.showcaseWrap}>
      {/* Background ambient radial glow behind cards */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* ── Primary Card: Move Summary ── */}
      <motion.div
        className={styles.mainCard}
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{
          opacity: 1,
          y: [0, -8, 0],
          scale: 1,
        }}
        transition={{
          y: {
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          opacity: { duration: 0.8, delay: 0.3 },
          scale: { duration: 0.8, delay: 0.3 },
        }}
        whileHover={{
          scale: 1.025,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.5), 0 0 35px rgba(247, 163, 0, 0.25)',
        }}
      >
        {/* Card Header */}
        <div className={styles.cardHeader}>
          <div className={styles.liveBadge}>
            <CheckCircle2 size={13} strokeWidth={2.5} style={{ color: '#10B981' }} />
            <span>MOVE CONFIRMED</span>
          </div>
          <div className={styles.telemetryTag}>
            <Truck size={12} className={styles.radioIcon} />
            <span>2 BHK · Full Service</span>
          </div>
        </div>

        {/* Route Details */}
        <div className={styles.routeRow}>
          <div className={styles.node}>
            <span className={styles.nodeLabel}>PICKUP</span>
            <span className={styles.nodeName}>Thane West</span>
          </div>
          <div className={styles.routeVector}>
            <span className={styles.routeDistance}>28.4 km</span>
            <div className={styles.vectorLine}>
              <ArrowRight size={14} className={styles.vectorArrow} />
            </div>
          </div>
          <div className={styles.node} style={{ textAlign: 'right' }}>
            <span className={styles.nodeLabel}>DROP</span>
            <span className={styles.nodeName}>Bandra BKC</span>
          </div>
        </div>

        {/* Route Progress Bar (static, decorative) */}
        <div className={styles.trackerRoad}>
          <div className={styles.roadSurface} />
          <div className={styles.roadProgressFill} />
          <div className={styles.vehicleMarker}>
            <div className={styles.vehicleRadar} />
            <div className={styles.vehicleIcon}>
              <Truck size={14} strokeWidth={2.4} />
            </div>
            <div className={styles.vehicleHeadlight} />
          </div>
        </div>

        {/* Move Details Bar */}
        <div className={styles.telemetryBar}>
          <div className={styles.telemetryItem}>
            <span className={styles.telLabel}>MOVE DATE</span>
            <span className={styles.telVal}>Flexible Scheduling</span>
          </div>
          <div className={styles.telDivider} />
          <div className={styles.telemetryItem}>
            <span className={styles.telLabel}>PACKING</span>
            <span className={styles.telValAccent}>Full-Service Included</span>
          </div>
          <div className={styles.telDivider} />
          <div className={styles.telemetryItem} style={{ textAlign: 'right' }}>
            <span className={styles.telLabel}>PRICING</span>
            <span className={styles.telStatusGreen}>● Transparent · Fixed</span>
          </div>
        </div>
      </motion.div>

      {/* ── Secondary Card: Verified Captain & Transit Safety ── */}
      <motion.div
        className={styles.secondaryCard}
        initial={{ opacity: 0, x: 30 }}
        animate={{
          opacity: 1,
          x: 0,
          y: [0, -6, 0],
        }}
        transition={{
          y: {
            duration: 5.2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.8,
          },
          opacity: { duration: 0.8, delay: 0.5 },
          x: { duration: 0.8, delay: 0.5 },
        }}
        whileHover={{
          scale: 1.03,
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.45), 0 0 25px rgba(16, 185, 129, 0.2)',
        }}
      >
        <div className={styles.captainAvatarWrap}>
          <div className={styles.avatarIcon}>
            <Shield size={20} strokeWidth={2.4} />
          </div>
          <span className={styles.verifiedCheck}>✓</span>
        </div>
        <div className={styles.captainContent}>
          <div className={styles.captainTitleRow}>
            <span className={styles.captainName}>Verified Captain &amp; Safety</span>
            <span className={styles.ratingBadge}>
              <Award size={11} /> 4.9★
            </span>
          </div>
          <p className={styles.captainSub}>
            ₹0 Hidden Charges • ₹5 Lakh Transit Insurance Included
          </p>
        </div>
      </motion.div>

      {/* Floating Pill: Route Corridor */}
      <motion.div
        className={styles.corridorPill}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: 1,
          scale: 1,
          y: [0, 5, 0],
        }}
        transition={{
          y: {
            duration: 4.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1.4,
          },
          opacity: { duration: 0.6, delay: 0.7 },
        }}
      >
        <Navigation2 size={13} className={styles.corridorIcon} />
        <span>Eastern Express Highway Corridor · Clear Traffic</span>
      </motion.div>
    </div>
  );
}
