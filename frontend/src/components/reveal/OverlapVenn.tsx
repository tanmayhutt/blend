import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface OverlapSet {
  key: string;
  label: string;
  left: number;
  right: number;
  shared: number;
}

interface OverlapVennProps {
  viewerName: string;
  otherName: string;
  sets: OverlapSet[];
}

const W = 340;
const H = 210;
const MIN_R = 52;
const MAX_R = 96;

const layout = (left: number, right: number, shared: number) => {
  const biggest = Math.max(left, right, 1);
  const radius = (count: number) => MIN_R + (MAX_R - MIN_R) * Math.sqrt(count / biggest);
  const rL = radius(left);
  const rR = radius(right);
  const smaller = Math.max(1, Math.min(left, right));
  const overlap = Math.min(1, shared / smaller);
  // Circles always touch a little so the shared zone stays visible even at zero.
  const depth = 18 + overlap * (Math.min(rL, rR) * 1.1);
  const distance = rL + rR - depth;
  const cx = W / 2;
  return { rL, rR, xL: cx - distance / 2, xR: cx + distance / 2, cy: H / 2 };
};

export const OverlapVenn = ({ viewerName, otherName, sets }: OverlapVennProps) => {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(sets[0]?.key);
  const current = sets.find((set) => set.key === active) || sets[0];
  if (!current) return null;

  const onlyLeft = Math.max(0, current.left - current.shared);
  const onlyRight = Math.max(0, current.right - current.shared);
  const { rL, rR, xL, xR, cy } = layout(current.left, current.right, current.shared);
  const spring = { type: "spring" as const, stiffness: 120, damping: 18 };

  return (
    <section className="overlap" aria-labelledby="overlap-heading">
      <header>
        <h2 id="overlap-heading">Where your shelves overlap</h2>
        <div className="overlap-toggle" role="group" aria-label="Choose what to compare">
          {sets.map((set) => (
            <button key={set.key} type="button" aria-pressed={set.key === current.key} onClick={() => setActive(set.key)}>{set.label}</button>
          ))}
        </div>
      </header>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${current.label}: ${onlyLeft} only ${viewerName}, ${current.shared} shared, ${onlyRight} only ${otherName}`}>
        <motion.circle className="overlap-left" cy={cy} initial={false} animate={{ cx: xL, r: rL }} transition={reduceMotion ? { duration: 0 } : spring} />
        <motion.circle className="overlap-right" cy={cy} initial={false} animate={{ cx: xR, r: rR }} transition={reduceMotion ? { duration: 0 } : spring} />
        <motion.text className="overlap-num" y={cy + 8} textAnchor="middle" initial={false} animate={{ x: Math.min(((xL - rL) + (xR - rR)) / 2, xL) }} transition={reduceMotion ? { duration: 0 } : spring}>{onlyLeft}</motion.text>
        <motion.text className="overlap-num overlap-num-shared" y={cy + 8} textAnchor="middle" initial={false} animate={{ x: ((xR - rR) + (xL + rL)) / 2 }} transition={reduceMotion ? { duration: 0 } : spring}>{current.shared}</motion.text>
        <motion.text className="overlap-num" y={cy + 8} textAnchor="middle" initial={false} animate={{ x: Math.max(((xL + rL) + (xR + rR)) / 2, xR) }} transition={reduceMotion ? { duration: 0 } : spring}>{onlyRight}</motion.text>
      </svg>
      <dl className="overlap-legend">
        <div><dt><i className="overlap-dot-lime" />Only {viewerName}</dt><dd>{onlyLeft}</dd></div>
        <div><dt><i className="overlap-dot-shared" />Both of you</dt><dd>{current.shared}</dd></div>
        <div><dt><i className="overlap-dot-violet" />Only {otherName}</dt><dd>{onlyRight}</dd></div>
      </dl>
    </section>
  );
};
