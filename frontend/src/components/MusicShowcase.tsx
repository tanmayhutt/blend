import { useState } from "react";
import { VideoCard } from "./VideoCard";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MusicShowcaseProps {
  musicTracks: any[];
}

export const MusicShowcase = ({ musicTracks }: MusicShowcaseProps) => {
  const [expandedMusic, setExpandedMusic] = useState(false);

  if (!musicTracks || musicTracks.length === 0) {
    return null;
  }

  // Sort by most listened (watch_count = times in playlists + likes)
  const sortedTracks = [...musicTracks].sort((a, b) => {
    const watchsA = a.watch_count || 0;
    const watchsB = b.watch_count || 0;
    return watchsB - watchsA;
  });

  const displayTracks = expandedMusic ? sortedTracks : sortedTracks.slice(0, 4);
  const hiddenCount = Math.max(0, sortedTracks.length - 4);

  return (
    <div className="space-y-6">
      <div className="content-grid">
        {displayTracks.map((track, index) => (
          <div key={index}>
            <VideoCard title={track.title} thumbnailUrl={track.thumbnail_url} videoId={track.video_id} />
          </div>
        ))}
      </div>

      {hiddenCount > 0 && (
        <Button
          onClick={() => setExpandedMusic(!expandedMusic)}
          variant="outline"
          className="w-full gap-2"
        >
          {expandedMusic ? (
            <>
              Show Less
              <ChevronDown className="w-4 h-4 transform rotate-180" />
            </>
          ) : (
            <>
              Show All {sortedTracks.length} Tracks
              <ChevronDown className="w-4 h-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};
