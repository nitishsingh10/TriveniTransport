'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, Star, ShieldCheck, Zap, X } from 'lucide-react';
import styles from './LiveNotificationToast.module.css';

const NOTIFICATIONS = [
  {
    icon: Truck,
    color: '#10B981',
    title: 'Booking Confirmed',
    desc: '2 BHK Move: Thane West → Powai — Full packing included',
    time: 'Just now',
  },
  {
    icon: Star,
    color: '#F7A300',
    title: 'New 5.0 ★ Customer Review',
    desc: '“Super smooth shifting, zero breakage!” — Amit S.',
    time: '6 mins ago',
  },
  {
    icon: Zap,
    color: '#3B82F6',
    title: 'Instant Quote Ready',
    desc: '2 BHK Move: Powai → Bandra — ₹6,400 fixed rate',
    time: '11 mins ago',
  },
  {
    icon: ShieldCheck,
    color: '#10B981',
    title: 'Transit Insurance Active',
    desc: '₹5,00,000 Safe Hands coverage — included with every move',
    time: '18 mins ago',
  },
];

export default function LiveNotificationToast() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    // Show initial notification after 3.5s
    const firstTimer = setTimeout(() => {
      setVisible(true);
    }, 3500);

    // Cycle every 8 seconds
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % NOTIFICATIONS.length);
        setVisible(true);
      }, 700);
    }, 9000);

    return () => {
      clearTimeout(firstTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (dismissed) return null;
  const current = NOTIFICATIONS[index];
  const Icon = current.icon;

  return (
    <div className={styles.toastContainer}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key={index}
            className={styles.toast}
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          >
            <div
              className={styles.iconWrap}
              style={{ background: `${current.color}18`, color: current.color }}
            >
              <Icon size={16} strokeWidth={2.4} />
            </div>

            <div className={styles.textCol}>
              <div className={styles.headerRow}>
                <span className={styles.title}>{current.title}</span>
                <span className={styles.time}>{current.time}</span>
              </div>
              <p className={styles.desc}>{current.desc}</p>
            </div>

            <button
              type="button"
              className={styles.closeBtn}
              onClick={() => setDismissed(true)}
              aria-label="Dismiss notification"
            >
              <X size={12} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
