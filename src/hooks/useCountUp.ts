'use client';

import { useEffect, useState } from 'react';

export function useCountUp(end: number, isActive: boolean, duration = 1200) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    // Respect reduced motion
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCount(end);
      return;
    }

    let startTime: number | null = null;
    let rafId: number;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out quart curve
      const eased = 1 - Math.pow(1 - progress, 4);
      // Preserve decimal precision for non-integer values (e.g. 4.9)
      const raw = eased * end;
      setCount(Number.isInteger(end) ? Math.round(raw) : Math.round(raw * 10) / 10);

      if (progress < 1) {
        rafId = requestAnimationFrame(step);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [end, isActive, duration]);

  return count;
}
