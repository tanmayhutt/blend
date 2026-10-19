import { motion, useReducedMotion } from "framer-motion";
import { Play } from "lucide-react";
import type { VideoItem } from "@/lib/types";

interface ThumbWallProps {
  items: VideoItem[];
  label: string;
  empty: string;
  limit?: number;
}

const videoUrl = (item: VideoItem) => {
  if (item.video_id) return `https://www.youtube.com/watch?v=${item.video_id}`;
  if (item.playlist_id) return `https://www.youtube.com/playlist?list=${item.playlist_id}`;
  return undefined;
};

/** A grid of real video thumbnails, each linking back to YouTube. */
export const ThumbWall = ({ items, label, empty, limit = 8 }: ThumbWallProps) => {
  const reduceMotion = useReducedMotion();
  const visible = items.filter((item) => item.thumbnail_url).slice(0, limit);
  if (!visible.length) return <p className="taste-strip-empty">{empty}</p>;

  return (
    <ul className="thumb-wall" aria-label={label}>
      {visible.map((item, index) => {
        const url = videoUrl(item);
        const body = (
          <>
            <img src={item.thumbnail_url} alt="" loading="lazy" />
            <span className="thumb-wall-caption"><Play aria-hidden="true" /><span>{item.title}</span></span>
          </>
        );
        return (
          <motion.li
            key={`${item.video_id || item.playlist_id || item.title}-${index}`}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: Math.min(index, 10) * 0.04 }}
          >
            {url ? <a href={url} target="_blank" rel="noreferrer" aria-label={`${item.title}, open on YouTube`}>{body}</a> : <div>{body}</div>}
          </motion.li>
        );
      })}
    </ul>
  );
};
