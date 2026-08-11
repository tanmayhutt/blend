import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Check,
  Eye,
  Link2,
  Loader2,
  LockKeyhole,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
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

const Avatar = ({ label, tone }: { label: string; tone: "red" | "dark" }) => (
  <div className={`flex h-16 w-16 items-center justify-center rounded-full border-4 border-white text-lg font-black text-white shadow-lg ${tone === "red" ? "bg-primary" : "bg-foreground"}`}>
    {label}
  </div>
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
    try {
      await initiateLogin();
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell min-h-screen overflow-hidden bg-background">
      <header className="site-header sticky top-0 z-50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3" aria-label="YouTube Blend home">
            <span className="logo-frame"><Logo size={30} /></span>
            <span className="font-extrabold tracking-[-0.03em]">YouTube Blend</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground sm:flex" aria-label="Main navigation">
            <a href="#how-it-works" className="hover:text-foreground">How it works</a>
            <a href="#privacy" className="hover:text-foreground">Privacy</a>
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
          </nav>
          <Button onClick={handleLogin} disabled={isLoading} size="sm" className="hidden sm:inline-flex">
            Start a blend <ArrowRight />
          </Button>
        </div>
      </header>

      <main>
        <section className="hero-glow relative">
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-28 lg:pt-24">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
              <div className="eyebrow mb-6"><Sparkles /> Built for YouTube people</div>
              <h1 className="max-w-3xl text-5xl font-black leading-[0.96] tracking-[-0.065em] text-foreground sm:text-6xl lg:text-[5.6rem]">
                Find out if your <span className="text-primary">feeds belong together.</span>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
                Compare channels, videos, music, and interests with a friend. Get one compatibility score and all the wonderfully specific things you share.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={handleLogin} disabled={isLoading} size="lg" className="h-14 px-6 text-base">
                  {isLoading ? <Loader2 className="animate-spin" /> : <GoogleMark />}
                  {isLoading ? "Connecting securely" : "Continue with Google"}
                </Button>
                <a href="#how-it-works" className="inline-flex h-14 items-center justify-center gap-2 px-5 text-sm font-bold text-foreground">
                  See how it works <ArrowRight className="h-4 w-4" />
                </a>
              </div>
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Read-only access</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Secure Google OAuth</span>
                <span className="inline-flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Free to use</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.96, rotate: 1 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} transition={{ duration: 0.65, delay: 0.12 }} className="relative mx-auto w-full max-w-xl">
              <div className="result-window">
                <div className="flex items-center justify-between border-b border-border/70 px-5 py-4">
                  <div className="flex items-center gap-2 text-sm font-bold"><span className="h-2.5 w-2.5 rounded-full bg-primary" /> Your blend result</div>
                  <span className="status-pill">Ready to share</span>
                </div>
                <div className="p-6 sm:p-9">
                  <div className="relative flex items-center justify-center py-2">
                    <Avatar label="T" tone="dark" />
                    <div className="z-10 -mx-2 flex h-12 w-12 items-center justify-center rounded-full border-4 border-card bg-primary text-white shadow-lg"><Play className="h-4 w-4 fill-current" /></div>
                    <Avatar label="A" tone="red" />
                  </div>
                  <div className="mt-5 text-center">
                    <div className="text-7xl font-black tracking-[-0.08em] text-foreground sm:text-8xl">84<span className="text-3xl text-primary">%</span></div>
                    <p className="mt-2 text-xl font-extrabold">Same side of YouTube</p>
                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Strong overlap in video essays, indie music, design, and channels you both quote too often.</p>
                  </div>
                  <div className="mt-7 grid grid-cols-3 gap-2">
                    {[['12', 'shared channels'], ['7', 'music matches'], ['5', 'common genres']].map(([value, label]) => (
                      <div key={label} className="mini-stat"><strong>{value}</strong><span>{label}</span></div>
                    ))}
                  </div>
                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    {['Video essays', 'Indie', 'Design', 'Comedy'].map((item) => <span className="taste-chip" key={item}>{item}</span>)}
                  </div>
                </div>
              </div>
              <div className="floating-note floating-note-left">You both saved it</div>
              <div className="floating-note floating-note-right">A new rabbit hole</div>
            </motion.div>
          </div>
        </section>

        <section className="border-y border-border/70 bg-foreground py-4 text-background" aria-label="Product summary">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-2 px-5 text-xs font-bold uppercase tracking-[0.18em] sm:justify-between lg:px-8">
            <span>Channels</span><span>Saved videos</span><span>Music</span><span>Genres</span><span>One score</span>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
            <div>
              <div className="eyebrow mb-5"><Link2 /> One link, two feeds</div>
              <h2 className="section-title">A tiny internet experiment for two.</h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-muted-foreground">No quizzes. No pretending you only watch documentaries. You both connect the accounts you actually use, and Blend does the comparing.</p>
            </div>
            <div className="divide-y divide-border rounded-[2rem] border border-border bg-card px-6 shadow-soft sm:px-9">
              <Step number="01" icon={Users} title="Connect your YouTube" text="Sign in through Google. Blend requests read-only access to the YouTube data needed for your profile." />
              <Step number="02" icon={Link2} title="Send one private link" text="Invite a friend with a comparison link that expires after two hours." />
              <Step number="03" icon={BarChart3} title="Open your shared result" text="See your score, overlaps, differences, and plenty of things to send back to the group chat." />
            </div>
          </div>
        </section>

        <section className="bg-soft-red border-y border-border/60">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-28">
            <div className="comparison-stack" aria-label="Example comparison cards">
              <div className="stack-card stack-card-back"><span>They watch</span><strong>Science, live music, animation</strong></div>
              <div className="stack-card stack-card-front"><span>You both love</span><strong>Video essays after midnight</strong><div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full w-[84%] rounded-full bg-primary" /></div></div>
            </div>
            <div>
              <div className="eyebrow mb-5"><Sparkles /> Made to start conversations</div>
              <h2 className="section-title">More interesting than “what do you watch?”</h2>
              <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">The score is the hook. The real fun is spotting the channel neither of you expected, the exact music overlap, and the completely opposite corner of YouTube your friend can introduce you to.</p>
              <Button onClick={handleLogin} disabled={isLoading} size="lg" className="mt-8">Make your blend <ArrowRight /></Button>
            </div>
          </div>
        </section>

        <section id="privacy" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="privacy-panel">
            <div className="max-w-2xl">
              <div className="eyebrow eyebrow-dark mb-5"><LockKeyhole /> Your account stays yours</div>
              <h2 className="text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">A comparison tool, not a data free-for-all.</h2>
              <p className="mt-5 text-lg leading-8 text-white/65">Blend uses read-only Google permissions. It cannot post, edit, or delete anything on your YouTube account. Your data is used to build your profile and comparisons, never sold for advertising.</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/privacy" className="text-link-light">Read the privacy policy <ArrowRight /></Link>
                <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer" className="text-link-light">Manage Google access <ArrowRight /></a>
              </div>
            </div>
            <ShieldCheck className="privacy-mark" aria-hidden="true" />
          </div>
        </section>

        <section className="px-5 pb-24 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-primary">Your friend is already judging your subscriptions</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.05em] sm:text-6xl">You may as well get a score for it.</h2>
            <Button onClick={handleLogin} disabled={isLoading} size="lg" className="mt-8 h-14 px-7 text-base"><GoogleMark /> Continue with Google</Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const Step = ({ number, icon: Icon, title, text }: { number: string; icon: typeof Users; title: string; text: string }) => (
  <div className="grid gap-5 py-8 sm:grid-cols-[auto_1fr_auto] sm:items-start">
    <div className="step-icon"><Icon /></div>
    <div><h3 className="text-xl font-extrabold tracking-[-0.025em]">{title}</h3><p className="mt-2 max-w-lg leading-7 text-muted-foreground">{text}</p></div>
    <span className="text-sm font-black text-primary/60">{number}</span>
  </div>
);

export default Landing;
