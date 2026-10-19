import { motion, useReducedMotion } from "framer-motion";
import type { ComparisonScores } from "@/lib/types";

const parts: { key: keyof ComparisonScores; label: string }[] = [
  { key: "video_genres", label: "Video categories" },
  { key: "subscription_genres", label: "Channel topics" },
  { key: "subscriptions", label: "Exact channels" },
  { key: "saved_videos", label: "Exact saved videos" },
  { key: "music_listened", label: "Exact music" },
];

/** Shows the five Blend-calculated components that average into the overall score. */
export const ScoreBreakdown = ({ scores }: { scores: ComparisonScores }) => {
  const reduceMotion = useReducedMotion();
  const rows = parts.map((part) => ({ ...part, value: Math.max(0, Math.min(100, Math.round(scores[part.key] || 0))) }));
  const strongest = [...rows].sort((a, b) => b.value - a.value)[0];

  return (
    <section className="score-breakdown" aria-labelledby="score-breakdown-heading">
      <header>
        <h2 id="score-breakdown-heading">What built the score</h2>
        <p>{strongest && strongest.value ? `${strongest.label} did most of the work.` : "No component overlapped yet."}</p>
      </header>
      <ul>
        {rows.map((row, index) => (
          <li key={row.key}>
            <span>{row.label}</span>
            <div className="score-breakdown-track" role="img" aria-label={`${row.label} ${row.value} percent`}>
              <motion.i
                initial={reduceMotion ? false : { width: 0 }}
                animate={{ width: `${row.value}%` }}
                transition={{ duration: 0.75, delay: 0.25 + index * 0.07, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <strong>{row.value}%</strong>
          </li>
        ))}
      </ul>
      <small>Each bar is a Blend-calculated overlap. The overall score is their average. None of these are YouTube or Google metrics.</small>
    </section>
  );
};
