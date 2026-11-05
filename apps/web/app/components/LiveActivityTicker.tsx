'use client';

import { Truck, ShieldCheck, Star, Zap, MapPin } from 'lucide-react';
import styles from './LiveActivityTicker.module.css';

const ACTIVITIES = [
  {
    icon: Truck,
    badge: 'RECENT MOVE',
    text: '2 BHK Shifting: Hiranandani Estate, Thane → Powai',
    meta: 'Full Packing · Delivered On Time',
    color: '#10B981',
  },
  {
    icon: Zap,
    badge: 'INSTANT QUOTE',
    text: '3 BHK Move: Bandra West → BKC G-Block',
    meta: 'Transparent rate locked',
    color: '#F7A300',
  },
  {
    icon: Star,
    badge: 'DELIVERED',
    text: 'Villa Relocation to Kharadi, Pune',
    meta: '5.0/5 ⭐ by Vikram M.',
    color: '#3B82F6',
  },
  {
    icon: ShieldCheck,
    badge: 'PROTECTION',
    text: 'Transit Coverage Active',
    meta: '₹5,00,000 Safe Hands Guarantee',
    color: '#10B981',
  },
  {
    icon: MapPin,
    badge: 'SERVICE AREA',
    text: 'Covering Thane, Mumbai & Long Routes',
    meta: 'Verified Captain Assigned',
    color: '#F7A300',
  },
];

export default function LiveActivityTicker() {
  const items = [...ACTIVITIES, ...ACTIVITIES];

  return (
    <div className={styles.tickerWrap} aria-label="Moving activity highlights">
      <div className={styles.liveIndicator}>
        <span className={styles.livePulseDot} />
        <span className={styles.liveLabel}>RECENT ACTIVITY</span>
      </div>

      <div className={styles.marqueeTrack}>
        <div className={styles.marqueeContent}>
          {items.map((act, index) => {
            const Icon = act.icon;
            return (
              <div key={`${act.text}-${index}`} className={styles.tickerItem}>
                <div
                  className={styles.itemIconWrap}
                  style={{ background: `${act.color}18`, color: act.color }}
                >
                  <Icon size={13} strokeWidth={2.4} />
                </div>
                <span
                  className={styles.itemBadge}
                  style={{ color: act.color, borderColor: `${act.color}40` }}
                >
                  {act.badge}
                </span>
                <span className={styles.itemText}>{act.text}</span>
                <span className={styles.itemSep}>•</span>
                <span className={styles.itemMeta}>{act.meta}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
