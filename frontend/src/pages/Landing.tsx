import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Eye, Link2, Loader2, LockKeyhole, ScanSearch, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { initiateLogin, isAuthenticated, saveTokens } from "@/lib/auth";

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.62.39 3.15 1.04 4.53l3.35-2.61Z" />
    <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z" />
  </svg>
);

const Landing = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      saveTokens({ access_token: accessToken, refresh_token: refreshToken });
      window.history.replaceState({}, document.title, "/");
    }
    if (isAuthenticated() || (accessToken && refreshToken)) navigate("/dashboard");
  }, [navigate]);

  const handleLogin = async () => {
    setIsLoading(true);
    try { await initiateLogin(); } catch { setIsLoading(false); }
  };

  const tickerItems = ["Channels", "Saved videos", "Playlists", "Music", "Genres", "Compatibility"];

  return (
    <div className="app-shell min-h-screen overflow-hidden bg-background">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="site-header">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between px-5 py-4 lg:px-10">
          <Link to="/" className="flex items-center gap-3" aria-label="YouTube Blend home">
            <span className="logo-frame"><Logo size={28} /></span>
            <span className="text-sm font-extrabold tracking-[-0.025em] sm:text-base">YouTube Blend</span>
          </Link>
          <nav className="hidden items-center gap-8 text-xs font-bold text-muted-foreground md:flex" aria-label="Main navigation">
            <a href="#process" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#result" className="transition-colors hover:text-foreground">The result</a>
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          </nav>
          <Button onClick={handleLogin} disabled={isLoading} size="sm">Start a blend <ArrowRight /></Button>
        </div>
      </header>

      <main id="main-content">
        <section className="relative min-h-[calc(100vh-72px)]">
          <div className="watch-grid absolute inset-0" aria-hidden="true" />
          <div className="relative mx-auto grid max-w-[92rem] items-center gap-12 px-5 py-16 lg:grid-cols-[1.08fr_.92fr] lg:px-10 lg:py-20">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>
              <div className="signal-label mb-7">A social experiment for your feed</div>
              <h1 className="display-title max-w-4xl">Your YouTube taste, <span className="text-primary">measured together.</span></h1>
              <p className="mt-8 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">Invite one friend. Blend compares the channels, videos, music, and genres that shape both of your feeds, then turns the overlap into one clear result.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Button onClick={handleLogin} disabled={isLoading} size="lg" className="h-14 px-7 text-base">
                  {isLoading ? <Loader2 className="animate-spin" /> : <GoogleMark />}
                  {isLoading ? "Connecting" : "Continue with Google"}
                </Button>
                <a href="#process" className="inline-flex h-14 items-center justify-center gap-2 px-5 text-sm font-bold text-foreground">See the process <ArrowRight className="h-4 w-4" /></a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Read-only YouTube access</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Google OAuth</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Free to use</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: .94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .65, delay: .12 }} className="hero-orbit" aria-label="Example 82 percent compatibility result">
              <div className="orbit-glow" />
              <div className="orbit-person orbit-person-a">T</div>
              <div className="orbit-person orbit-person-b">A</div>
              <div className="orbit-tag orbit-tag-a">14 channels in common</div>
              <div className="orbit-tag orbit-tag-b">Same late-night rabbit holes</div>
              <div className="orbit-core"><div className="text-center"><strong>82<span className="text-xl text-primary">%</span></strong><p className="mt-1 text-[10px] font-extrabold uppercase tracking-[.18em] text-muted-foreground">Taste match</p></div></div>
            </motion.div>
          </div>
        </section>

        <div className="ticker" aria-hidden="true"><div className="ticker-track">{[...tickerItems, ...tickerItems].map((item, index) => <span className="ticker-item" key={`${item}-${index}`}>{item}</span>)}</div></div>

        <section id="process" className="mx-auto max-w-[92rem] px-5 py-24 lg:px-10 lg:py-36">
          <div className="grid gap-14 lg:grid-cols-[.85fr_1.15fr] lg:gap-24">
            <div>
              <p className="section-kicker">The process</p>
              <h2 className="section-title mt-5 max-w-xl">Two people. One link. No questionnaire.</h2>
              <p className="mt-6 max-w-md leading-7 text-muted-foreground">The most honest taste profile is the one you already built by watching. Blend reads it, compares it, and gets out of the way.</p>
            </div>
            <div>
              <Process index="01" icon={Users} title="Connect your feed" text="Sign in with Google and grant read-only access to the YouTube data used for your profile." />
              <Process index="02" icon={Link2} title="Invite your person" text="Send a private comparison link. It expires after two hours." />
              <Process index="03" icon={ScanSearch} title="Read the overlap" text="See one compatibility score, the content you share, and the corners of YouTube only one of you knows." />
            </div>
          </div>
        </section>

        <section id="result" className="border-y border-border bg-[#0c0c0f]">
          <div className="mx-auto grid max-w-[92rem] items-center gap-14 px-5 py-24 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:py-32">
            <div className="proof-window">
              <div className="proof-bar"><span>BLEND / T + A</span><span>PRIVATE RESULT</span></div>
              <div className="p-6 sm:p-10">
                <div className="match-line"><div className="match-avatar"><span>T</span><span className="truncate text-sm font-bold">Your feed</span></div><span className="match-pulse" /><div className="match-avatar"><span>A</span><span className="truncate text-sm font-bold">Their feed</span></div></div>
                <div className="mt-12 text-center"><div className="proof-score">82<span>%</span></div><p className="mt-4 text-xl font-extrabold">Strong signal</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Your feeds meet around video essays, independent music, design, and a surprisingly specific comedy niche.</p></div>
                <div className="mt-10 grid grid-cols-3 gap-3"><Metric value="14" label="shared channels" /><Metric value="8" label="music matches" /><Metric value="6" label="common genres" /></div>
              </div>
            </div>
            <div>
              <p className="section-kicker">More than a number</p>
              <h2 className="section-title mt-5">A result worth talking about.</h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">The score gets your attention. The useful part is everything underneath it: shared favorites, different obsessions, and the next thing each of you should watch.</p>
              <Button onClick={handleLogin} disabled={isLoading} size="lg" className="mt-8">Create your result <ArrowRight /></Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[92rem] px-5 py-24 lg:px-10 lg:py-32">
          <div className="feature-panel grid gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="relative z-10 max-w-3xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border text-primary"><LockKeyhole className="h-5 w-5" /></div>
              <p className="section-kicker mt-8">Privacy by default</p>
              <h2 className="section-title mt-4">Read your taste. Never control your account.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">YouTube Blend uses read-only permissions. It cannot post, edit, or delete anything. Your data is used to build profiles and comparisons, not sold for advertising.</p>
              <Link to="/privacy" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary">How your data is handled <ArrowRight className="h-4 w-4" /></Link>
            </div>
            <div className="relative z-10 grid grid-cols-2 gap-8"><Metric value="0" label="account changes" /><Metric value="2h" label="invite lifetime" /></div>
          </div>
        </section>

        <section className="px-5 pb-28 text-center lg:px-10">
          <p className="section-kicker">Ready when your group chat is</p>
          <h2 className="mx-auto mt-5 max-w-5xl text-4xl font-black leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">Stop guessing who gets your feed.</h2>
          <Button onClick={handleLogin} disabled={isLoading} size="lg" className="mt-9 h-14 px-7 text-base"><GoogleMark /> Continue with Google</Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const Process = ({ index, icon: Icon, title, text }: { index: string; icon: typeof Users; title: string; text: string }) => (
  <div className="process-row"><span className="process-index">{index}</span><span className="process-icon"><Icon className="h-5 w-5" /></span><div><h3 className="text-xl font-extrabold tracking-[-.025em]">{title}</h3><p className="mt-2 max-w-xl leading-7 text-muted-foreground">{text}</p></div></div>
);

const Metric = ({ value, label }: { value: string; label: string }) => <div className="metric"><strong>{value}</strong><span>{label}</span></div>;

export default Landing;
