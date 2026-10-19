import { useRef } from "react";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";
import type { ChannelItem, VideoItem } from "@/lib/types";

type Item = ChannelItem | VideoItem;

interface SwipeRowProps {
  title: string;
  items: Item[];
  empty: string;
  limit?: number;
  round?: boolean;
}

const itemUrl = (item: Item) => {
  if ("channel_id" in item && item.channel_id) return `https://www.youtube.com/channel/${item.channel_id}`;
  if ("video_id" in item && item.video_id) return `https://www.youtube.com/watch?v=${item.video_id}`;
  if ("playlist_id" in item && item.playlist_id) return `https://www.youtube.com/playlist?list=${item.playlist_id}`;
  return undefined;
};
const itemImage = (item: Item) => item.thumbnail_url || ("logo_url" in item ? item.logo_url : undefined);

/** A user-controlled horizontal row of cards. Native scrolling with snap, plus buttons for pointer users. */
export const SwipeRow = ({ title, items, empty, limit = 10, round = false }: SwipeRowProps) => {
  const track = useRef<HTMLUListElement>(null);
  const visible = items.slice(0, limit);
  const nudge = (direction: number) => track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <section className="swipe-row" aria-label={title}>
      <header>
        <h2>{title}</h2>
        {visible.length > 2 ? (
          <div className="swipe-row-nav">
            <button type="button" onClick={() => nudge(-1)} aria-label={`Scroll ${title} back`}><ArrowLeft aria-hidden="true" /></button>
            <button type="button" onClick={() => nudge(1)} aria-label={`Scroll ${title} forward`}><ArrowRight aria-hidden="true" /></button>
          </div>
        ) : null}
      </header>
      {visible.length ? (
        <ul ref={track} className={`swipe-row-track ${round ? "swipe-row-round" : ""}`}>
          {visible.map((item, index) => {
            const url = itemUrl(item);
            const image = itemImage(item);
            const body = (
              <>
                <span className="swipe-card-art">{image ? <img src={image} alt="" loading="lazy" /> : <span>{item.title.slice(0, 1).toUpperCase()}</span>}</span>
                <strong>{item.title}</strong>
                {url ? <small>Open on YouTube <ArrowUpRight aria-hidden="true" /></small> : null}
              </>
            );
            return <li key={`${item.title}-${index}`} className="swipe-card">{url ? <a href={url} target="_blank" rel="noreferrer">{body}</a> : <div>{body}</div>}</li>;
          })}
        </ul>
      ) : <p className="taste-strip-empty">{empty}</p>}
    </section>
  );
};
