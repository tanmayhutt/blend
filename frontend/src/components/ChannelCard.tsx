import { Card } from "@/components/ui/card";

interface ChannelCardProps {
  title: string;
  logoUrl?: string;
  channelId?: string;
}

export const ChannelCard = ({ title, logoUrl, channelId }: ChannelCardProps) => {
  const openChannel = () => {
    if (channelId) {
      window.open(`https://www.youtube.com/channel/${channelId}`, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <Card
      className="group cursor-pointer border border-white/10 bg-white/[.035] p-4 shadow-none transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[.055]"
      onClick={openChannel}
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-white/10 bg-secondary">
          <img
            src={logoUrl || "https://via.placeholder.com/88?text=Channel"}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <p className="line-clamp-2 text-sm font-medium leading-5 text-foreground">
          {title}
        </p>
      </div>
    </Card>
  );
};
