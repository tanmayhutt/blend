import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface CompatibilityAvatarsProps {
  viewerProfile: any;
  otherProfile: any;
  score: number;
  className?: string;
}

export const CompatibilityAvatars = ({ viewerProfile, otherProfile, score, className }: CompatibilityAvatarsProps) => {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger animation shortly after mount
    const timer = setTimeout(() => setAnimate(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const viewerName = viewerProfile?.name || "You";
  const otherName = otherProfile?.name || "Friend";

  const getInitial = (name: string) => name ? name.charAt(0).toUpperCase() : "?";

  return (
    <div className={cn("relative flex h-36 items-center justify-center overflow-hidden", className)}>
      {/* Viewer Avatar (Slides in from Left) */}
      <div 
        className={cn(
          "absolute z-10 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[6px] border-background bg-secondary shadow-2xl transition-all duration-700 ease-out",
          animate ? "translate-x-[-40px]" : "translate-x-[-150px] opacity-0"
        )}
      >
        {viewerProfile?.picture ? (
          <img src={viewerProfile.picture} alt={viewerName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl font-black">{getInitial(viewerName)}</span>
        )}
      </div>

      {/* Score Badge (Fades in Center) */}
      <div 
        className={cn(
          "absolute z-30 flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-background bg-primary text-primary-foreground shadow-xl transition-all delay-300 duration-1000 ease-in-out",
          animate ? "opacity-100 scale-100" : "opacity-0 scale-50"
        )}
      >
        <span className="text-xl font-black">{score.toFixed(0)}%</span>
      </div>

      {/* Other Avatar (Slides in from Right) */}
      <div 
        className={cn(
          "absolute z-20 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-[6px] border-background bg-secondary shadow-2xl transition-all duration-700 ease-out",
          animate ? "translate-x-[40px]" : "translate-x-[150px] opacity-0"
        )}
      >
        {otherProfile?.picture ? (
          <img src={otherProfile.picture} alt={otherName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-3xl font-black">{getInitial(otherName)}</span>
        )}
      </div>
    </div>
  );
};
