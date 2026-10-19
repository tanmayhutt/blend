import { motion, useReducedMotion } from "framer-motion";
import type { TasteData } from "@/lib/types";

const segments = [
  { key: "subscriptions", label: "Channels", tone: "ink" },
  { key: "saved_videos", label: "Other saves", tone: "lime" },
  { key: "music_listened", label: "Music", tone: "violet" },
  { key: "playlists", label: "Playlists", tone: "coral" },
] as const;

const musicLine = (data: TasteData) => {
  const saved = data.saved_videos.length;
  const music = data.music_listened.length;
  if (!saved || !music) return null;
  const share = Math.round((music / saved) * 100);
  return `About ${share}% of what you saved looks like music.`;
};

/** A stacked bar showing how a snapshot splits across channels, saves, music, and playlists without double counting. */
export const TasteMix = ({ data }: { data: TasteData }) => {
  const reduceMotion = useReducedMotion();
  // Music is detected among saved videos, so count it once and show the remaining saves separately.
  const music = data.music_listened.length;
  const rows = segments.map((segment) => ({
    ...segment,
    value: segment.key === "saved_videos" ? Math.max(0, data.saved_videos.length - music) : data[segment.key].length,
  }));
  const total = rows.reduce((sum, row) => sum + row.value, 0);
  if (!total) return null;
  const line = musicLine(data);

  return (
    <section className="taste-mix" aria-labelledby="taste-mix-heading">
      <header>
        <p className="eyebrow">Your mix</p>
        <h2 id="taste-mix-heading">How your snapshot splits.</h2>
        {line ? <p>{line}</p> : null}
      </header>
      <div className="taste-mix-bar" role="img" aria-label={rows.map((row) => `${row.label} ${row.value}`).join(", ")}>
        {rows.filter((row) => row.value).map((row, index) => (
          <motion.span
            key={row.key}
            className={`taste-mix-${row.tone}`}
            initial={reduceMotion ? false : { flexGrow: 0.001 }}
            animate={{ flexGrow: row.value }}
            transition={{ duration: 0.9, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>
      <ul className="taste-mix-legend">
        {rows.map((row) => (
          <li key={row.key}><i className={`taste-mix-${row.tone}`} /><span>{row.label}</span><strong>{Math.round((row.value / total) * 100)}%</strong></li>
        ))}
      </ul>
    </section>
  );
};
