'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUp, ArrowRight, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './FloatingActions.module.css';

export default function FloatingActions() {
  const [visible, setVisible] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollPercent(Math.min(100, Math.max(0, progress)));
      setVisible(scrollTop > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const circumference = 2 * Math.PI * 18;
  const strokeDashoffset = circumference - (scrollPercent / 100) * circumference;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.container}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        >
          {/* Quick Quote Pill */}
          <Link href="/quote" className={styles.quotePill}>
            <span className={styles.pillIconWrap}>
              <Truck size={15} strokeWidth={2.4} />
            </span>
            <span className={styles.pillText}>Quick Quote</span>
            <ArrowRight size={14} className={styles.pillArrow} strokeWidth={2.4} />
          </Link>

          {/* Scroll to Top with Circular Progress */}
          <button
            type="button"
            onClick={scrollToTop}
            className={styles.scrollTopBtn}
            aria-label="Scroll to top"
            title="Back to top"
          >
            <svg className={styles.progressRing} width="44" height="44" viewBox="0 0 44 44">
              <circle
                className={styles.progressRingBg}
                cx="22"
                cy="22"
                r="18"
              />
              <circle
                className={styles.progressRingIndicator}
                cx="22"
                cy="22"
                r="18"
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
            </svg>
            <ArrowUp size={18} strokeWidth={2.5} className={styles.arrowIcon} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
