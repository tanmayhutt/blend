import { useState } from "react";
import { ChannelCard } from "./ChannelCard";
import { Button } from "@/components/ui/button";

interface FloatingChannelsProps {
  channels: any[];
  title: string;
}

const DEFAULT_VISIBLE = 15;

export const FloatingChannels = ({ channels, title }: FloatingChannelsProps) => {
  const [expanded, setExpanded] = useState(false);

  if (channels.length === 0) {
    return null;
  }

  const visibleChannels = expanded ? channels : channels.slice(0, DEFAULT_VISIBLE);
  const hiddenCount = Math.max(channels.length - visibleChannels.length, 0);

  return (
    <div className="space-y-4">
      {title ? <h3 className="text-lg font-semibold text-foreground">{title}</h3> : null}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {visibleChannels.map((channel: any, index: number) => (
          <div
            key={index}
            className="min-w-0"
          >
            <ChannelCard title={channel.title} logoUrl={channel.logo_url} channelId={channel.channel_id} />
          </div>
        ))}
      </div>
      {channels.length > DEFAULT_VISIBLE && (
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Show fewer channels" : `Show ${hiddenCount} more channels`}
        </Button>
      )}
    </div>
  );
};
