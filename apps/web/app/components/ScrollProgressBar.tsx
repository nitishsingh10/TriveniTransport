'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '3.5px',
        zIndex: 9999,
        pointerEvents: 'none',
        background: 'rgba(255, 255, 255, 0.04)',
      }}
      aria-hidden="true"
    >
      <motion.div
        style={{
          height: '100%',
          scaleX,
          transformOrigin: '0%',
          background: 'linear-gradient(90deg, #F7A300 0%, #FFB733 50%, #10B981 100%)',
          boxShadow: '0 0 10px rgba(247, 163, 0, 0.7), 0 0 4px rgba(247, 163, 0, 0.9)',
        }}
      />
    </div>
  );
}
