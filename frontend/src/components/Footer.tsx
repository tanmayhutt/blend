import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-start">
          <div className="max-w-sm">
            <div className="flex items-center gap-3 font-extrabold tracking-[-0.03em]"><span className="logo-frame"><Logo size={28} /></span>YouTube Blend</div>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">A private way to compare the feeds that shape what you watch.</p>
          </div>
          <div className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm font-semibold">
            <Link to="/" className="text-muted-foreground hover:text-foreground">Home</Link>
            <Link to="/privacy" className="text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link to="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground">Terms</Link>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} YouTube Blend. YouTube is a trademark of Google LLC.</p>
          <a href="https://tanmaytiwari.me" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary">A personal project by Tanmay Tiwari <ArrowUpRight className="h-3.5 w-3.5" /></a>
        </div>
      </div>
    </footer>
  );
};
