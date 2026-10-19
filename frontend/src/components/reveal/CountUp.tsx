import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface CountUpProps {
  value: number;
  duration?: number;
  suffix?: string;
}

/** Counts from zero to the value once on mount. Shows the final value immediately for reduced motion. */
export const CountUp = ({ value, duration = 900, suffix = "" }: CountUpProps) => {
  const reduceMotion = useReducedMotion();
  const target = Math.round(value);
  const [shown, setShown] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (reduceMotion) {
      setShown(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration, reduceMotion]);

  return <span className="count-up" aria-label={`${target}${suffix}`}>{shown}{suffix}</span>;
};
