'use client';

import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { useHaptic } from '@/hooks/useHaptic';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const y = useMotionValue(0);
  const { haptic } = useHaptic();

  // Settings
  const pullThreshold = 80;
  const maxPull = 120;

  const handleDrag = (event: any, info: any) => {
    // Only allow pull if we are at the top of the scroll container
    if (containerRef.current && containerRef.current.scrollTop > 0) {
      return;
    }
    
    // Provide haptic feedback when crossing threshold
    if (info.offset.y > pullThreshold && y.get() <= pullThreshold) {
      haptic('light');
    }
  };

  const handleDragEnd = async (event: any, info: any) => {
    if (info.offset.y >= pullThreshold) {
      setIsRefreshing(true);
      haptic('medium');
      controls.start({ y: 50, transition: { type: 'spring', stiffness: 300, damping: 20 } });
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
      }
    } else {
      controls.start({ y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } });
    }
  };

  return (
    <div ref={containerRef} style={{ height: '100%', overflowY: 'auto', position: 'relative' }}>
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          height: 50,
          zIndex: 0,
          opacity: isRefreshing ? 1 : y.get() / pullThreshold,
        }}
      >
        <div style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: isRefreshing ? 'spin 1s linear infinite' : 'none', marginBottom: 12 }} />
      </motion.div>
      
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: isRefreshing ? 50 : maxPull }}
        dragElastic={0.4}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ y, zIndex: 1, position: 'relative', minHeight: '100%', touchAction: 'pan-y' }}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {children}
      </motion.div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
