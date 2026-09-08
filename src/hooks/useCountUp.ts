import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Animates a numeric value counting up from 0 (or from its previous value, on change) to
 * `target` over `duration` ms, using an eased rAF loop. Non-numeric/NaN targets are
 * returned as-is so callers can pass through strings like "—" or a rating string safely.
 * Respects `prefers-reduced-motion` — reduced-motion users get the final value instantly
 * instead of a ticking animation.
 */
export function useCountUp(target: number, duration = 900): number {
  const prefersReducedMotion = useReducedMotion();
  const [value, setValue] = useState(prefersReducedMotion ? target : 0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!Number.isFinite(target)) {
      setValue(target);
      return;
    }
    if (prefersReducedMotion) {
      setValue(target);
      return;
    }

    const from = fromRef.current;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic — quick start, gentle settle.
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = from + (target - from) * eased;
      setValue(current);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration, prefersReducedMotion]);

  return value;
}

export default useCountUp;
