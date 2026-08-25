import { Card } from "@/components/ui/card";
import { Play } from "lucide-react";

interface VideoCardProps {
  title: string;
  thumbnailUrl?: string;
  videoId?: string;
  playlistId?: string;
  channelId?: string;
}

export const VideoCard = ({ title, thumbnailUrl, videoId, playlistId, channelId }: VideoCardProps) => {
  const openYouTubeLink = () => {
    let url = "";
    if (videoId) {
      url = `https://www.youtube.com/watch?v=${videoId}`;
    } else if (playlistId) {
      url = `https://www.youtube.com/playlist?list=${playlistId}`;
    } else if (channelId) {
      url = `https://www.youtube.com/channel/${channelId}`;
    }
    if (url) window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <Card
      className="group cursor-pointer overflow-hidden border border-white/10 bg-white/[.035] shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-white/20"
      onClick={openYouTubeLink}
    >
      <div className="relative aspect-video overflow-hidden bg-secondary">
        <img
          src={thumbnailUrl || "https://via.placeholder.com/320x180?text=No+Thumbnail"}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          loading="lazy"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/35">
          <span className="grid h-11 w-11 scale-90 place-items-center rounded-full bg-primary text-white opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100"><Play className="h-4 w-4 fill-current" /></span>
        </div>
      </div>
      <div className="border-t border-white/10 bg-transparent p-3.5">
        <p className="line-clamp-2 text-sm font-medium leading-5 text-foreground">
          {title}
        </p>
      </div>
    </Card>
  );
};
