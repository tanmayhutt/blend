import { ArrowUpRight } from "lucide-react";
import type { ChannelItem, VideoItem } from "@/lib/types";

type TasteItem = ChannelItem | VideoItem;

interface TasteStripProps {
  items: TasteItem[];
  empty: string;
  label: string;
  limit?: number;
}

const itemImage = (item: TasteItem) => item.thumbnail_url || ("logo_url" in item ? item.logo_url : undefined);
const itemUrl = (item: TasteItem) => {
  if ("channel_id" in item && item.channel_id) return `https://www.youtube.com/channel/${item.channel_id}`;
  if ("video_id" in item && item.video_id) return `https://www.youtube.com/watch?v=${item.video_id}`;
  if ("playlist_id" in item && item.playlist_id) return `https://www.youtube.com/playlist?list=${item.playlist_id}`;
  return undefined;
};

export const TasteStrip = ({ items, empty, label, limit = 6 }: TasteStripProps) => {
  const visible = items.slice(0, limit);

  if (!visible.length) return <p className="taste-strip-empty">{empty}</p>;

  return (
    <div className="taste-strip" aria-label={label}>
      {visible.map((item, index) => {
        const url = itemUrl(item);
        const image = itemImage(item);
        const content = (
          <>
            <span className="taste-strip-art">
              {image ? <img src={image} alt="" loading="lazy" /> : <span>{item.title.slice(0, 1).toUpperCase()}</span>}
            </span>
            <span className="taste-strip-copy">
              <strong>{item.title}</strong>
              <small>{url ? "Open on YouTube" : "Shared find"}</small>
            </span>
            {url ? <ArrowUpRight aria-hidden="true" /> : null}
          </>
        );

        return url ? (
          <a key={`${item.title}-${index}`} href={url} target="_blank" rel="noreferrer" className="taste-strip-item">
            {content}
          </a>
        ) : (
          <div key={`${item.title}-${index}`} className="taste-strip-item">
            {content}
          </div>
        );
      })}
    </div>
  );
};
