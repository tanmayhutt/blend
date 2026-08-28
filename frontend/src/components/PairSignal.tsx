import { motion, useReducedMotion } from "framer-motion";
import type { Profile } from "@/lib/types";

interface PairSignalProps {
  left?: Profile;
  right?: Profile;
  leftLabel?: string;
  rightLabel?: string;
  score?: number;
  compact?: boolean;
}

const displayName = (profile: Profile | undefined, fallback: string) => profile?.name?.trim() || fallback;

const ProfileDisc = ({ profile, fallback, tone }: { profile?: Profile; fallback: string; tone: "lime" | "violet" }) => {
  const name = displayName(profile, fallback);

  return (
    <div className={`profile-disc profile-disc-${tone}`}>
      {profile?.picture ? (
        <img src={profile.picture} alt={`${name}'s profile`} referrerPolicy="no-referrer" />
      ) : (
        <span aria-hidden="true">{name.slice(0, 1).toUpperCase()}</span>
      )}
      <small>{name}</small>
    </div>
  );
};

export const PairSignal = ({
  left,
  right,
  leftLabel = "You",
  rightLabel = "A friend",
  score,
  compact = false,
}: PairSignalProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className={`pair-signal ${compact ? "pair-signal-compact" : ""}`}>
      <ProfileDisc profile={left} fallback={leftLabel} tone="lime" />
      <div className="pair-signal-center" aria-label={typeof score === "number" ? `Blend score ${Math.round(score)} percent` : "Two profiles connecting"}>
        <svg viewBox="0 0 180 54" aria-hidden="true">
          <motion.path
            d="M2 13C48 13 51 41 90 41C129 41 132 13 178 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.15, ease: [0.22, 1, 0.36, 1] }}
          />
          <motion.path
            d="M2 41C48 41 51 13 90 13C129 13 132 41 178 41"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.15, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>
        {typeof score === "number" ? <strong>{Math.round(score)}%</strong> : <i />}
      </div>
      <ProfileDisc profile={right} fallback={rightLabel} tone="violet" />
    </div>
  );
};
