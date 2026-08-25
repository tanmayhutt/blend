import { useRef, type PointerEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SpotlightPanelProps {
  children: ReactNode;
  className?: string;
}

export const SpotlightPanel = ({ children, className }: SpotlightPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);

  const updateSpotlight = (event: PointerEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel) return;
    const bounds = panel.getBoundingClientRect();
    panel.style.setProperty("--spotlight-x", `${event.clientX - bounds.left}px`);
    panel.style.setProperty("--spotlight-y", `${event.clientY - bounds.top}px`);
  };

  return <div ref={panelRef} onPointerMove={updateSpotlight} className={cn("spotlight-panel", className)}>{children}</div>;
};
