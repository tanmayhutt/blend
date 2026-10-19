import { motion, useReducedMotion } from "framer-motion";
import type { TasteData } from "@/lib/types";

interface VersusBoardProps {
  viewerName: string;
  otherName: string;
  viewer?: TasteData;
  other?: TasteData;
}

const categories = [
  { key: "subscriptions", label: "Channels followed", noun: "channels", title: "Wider orbit" },
  { key: "saved_videos", label: "Videos kept", noun: "saved videos", title: "Bigger collector" },
  { key: "music_listened", label: "Music finds", noun: "music finds", title: "Soundtrack lead" },
  { key: "playlists", label: "Playlists made", noun: "playlists", title: "Shelf builder" },
] as const;

const verdict = (left: number, right: number, leftName: string, rightName: string, noun: string) => {
  if (left === right) return left ? `Dead even on ${noun}.` : `Neither side has ${noun} yet.`;
  const [leader, lead, trail] = left > right ? [leftName, left, right] : [rightName, right, left];
  if (!trail) return `Only ${leader} brought ${noun}.`;
  const ratio = lead / trail;
  return ratio >= 2 ? `${leader} keeps ${ratio >= 10 ? Math.round(ratio) : ratio.toFixed(1)}x more ${noun}.` : `${leader} edges ahead on ${noun}.`;
};

export const VersusBoard = ({ viewerName, otherName, viewer, other }: VersusBoardProps) => {
  const reduceMotion = useReducedMotion();
  const rows = categories.map((category) => {
    const left = viewer?.[category.key].length || 0;
    const right = other?.[category.key].length || 0;
    const total = left + right;
    return { ...category, left, right, leftShare: total ? left / total : 0.5, total };
  });
  const titles = rows.filter((row) => row.left !== row.right).map((row) => ({ title: row.title, owner: row.left > row.right ? viewerName : otherName, tone: row.left > row.right ? "lime" : "violet" }));

  return (
    <div className="versus">
      <div className="versus-names" aria-hidden="true"><span className="versus-name-lime">{viewerName}</span><span className="versus-name-violet">{otherName}</span></div>
      <ul className="versus-rows">
        {rows.map((row, index) => (
          <li key={row.key} className="versus-row">
            <div className="versus-row-head"><strong>{row.left}</strong><span>{row.label}</span><strong>{row.right}</strong></div>
            <div className="versus-bar" role="img" aria-label={`${row.label}: ${viewerName} ${row.left}, ${otherName} ${row.right}`}>
              <motion.i
                className="versus-bar-lime"
                initial={reduceMotion ? false : { width: "50%" }}
                animate={{ width: `${Math.max(row.total ? 4 : 50, Math.min(row.total ? 96 : 50, row.leftShare * 100))}%` }}
                transition={{ duration: 0.8, delay: 0.1 + index * 0.08, ease: [0.22, 1, 0.36, 1] }}
              />
              <i className="versus-bar-violet" />
            </div>
            <p>{verdict(row.left, row.right, viewerName, otherName, row.noun)}</p>
          </li>
        ))}
      </ul>
      {titles.length ? (
        <div className="versus-titles" aria-label="Blend titles">
          {titles.map((item) => <span key={item.title} className={`versus-title versus-title-${item.tone}`}><small>{item.owner}</small>{item.title}</span>)}
        </div>
      ) : null}
    </div>
  );
};
