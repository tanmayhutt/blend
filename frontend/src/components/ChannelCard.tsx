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
      className="group cursor-pointer border-border/80 bg-card p-4 shadow-none transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-secondary/50"
      onClick={openChannel}
    >
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border bg-secondary transition-colors group-hover:border-primary/50">
          <img
            src={logoUrl || "https://via.placeholder.com/88?text=Channel"}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <p className="line-clamp-2 text-sm font-bold leading-5 text-foreground">
          {title}
        </p>
      </div>
    </Card>
  );
};
