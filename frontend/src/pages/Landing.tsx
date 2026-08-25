import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowDown, ArrowRight, Check, Eye, Loader2, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { initiateLogin, isAuthenticated, saveTokens } from "@/lib/auth";

const BlendScene = lazy(() => import("@/components/BlendScene").then(module => ({ default: module.BlendScene })));

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z" /><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z" /><path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.62.39 3.15 1.04 4.53l3.35-2.61Z" /><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z" />
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

  return (
    <div className="app-shell min-h-screen overflow-hidden bg-background">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <header className="story-header">
        <Link to="/" className="flex items-center gap-2.5" aria-label="YouTube Blend home"><span className="story-logo"><Logo size={28} /></span><span>YouTube Blend</span></Link>
        <div className="flex items-center gap-3"><Link to="/privacy" className="hidden text-sm font-semibold sm:block">Privacy</Link><Button onClick={handleLogin} disabled={isLoading} size="sm" className="rounded-full bg-black px-5 text-white hover:bg-black/80">Make yours</Button></div>
      </header>

      <main id="main-content">
        <section className="story-slide story-slide-hero">
          <div className="story-hero-copy">
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="story-overline">A YouTube story for two</motion.p>
            <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55, ease: [0.22, 1, 0.36, 1] }}>Two feeds.<br />One very<br />specific story.</motion.h1>
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .12 }} className="story-intro">Invite someone. Blend turns both of your YouTube histories into a playful tour of what you share, where you disagree, and who should control the next watch.</motion.p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .22 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button onClick={handleLogin} disabled={isLoading} size="lg" className="h-14 rounded-full bg-black px-7 text-base text-white hover:bg-black/80">{isLoading ? <Loader2 className="animate-spin" /> : <GoogleMark />}{isLoading ? "Connecting" : "Start your Blend"}</Button>
              <a href="#story" className="inline-flex h-14 items-center justify-center gap-2 rounded-full border-2 border-black px-6 text-sm font-bold">See the story <ArrowDown className="h-4 w-4" /></a>
            </motion.div>
          </div>
          <div className="story-hero-art">
            <Suspense fallback={<div className="story-orb-fallback" />}><BlendScene className="absolute inset-0" /></Suspense>
            <span className="story-sticker story-sticker-one">14 shared channels</span>
            <span className="story-sticker story-sticker-two">late-night people</span>
            <div className="story-score-stamp"><strong>82%</strong><span>taste match</span></div>
          </div>
        </section>

        <section id="story" className="story-slide story-slide-purple">
          <div className="story-number">01</div>
          <div className="story-chapter-copy"><p className="story-overline">First, meet the feeds</p><h2>You brought the tutorials.<br />They brought the chaos.</h2><p>Blend reads the personality behind each account, then shows the overlap without flattening either person.</p></div>
          <div className="taste-portraits">
            <TastePortrait initial="T" label="The deep diver" items={["Design", "Video essays", "Indie music"]} tone="lime" />
            <div className="portrait-plus">+</div>
            <TastePortrait initial="A" label="The curious chaos" items={["Comedy", "Live sets", "Food rabbit holes"]} tone="pink" />
          </div>
        </section>

        <section className="story-slide story-slide-lime">
          <div className="story-number">02</div>
          <div className="shared-reveal">
            <p className="story-overline">Then, the shared obsession</p>
            <h2>Apparently, both of you live inside video essays.</h2>
            <div className="shared-stat"><strong>14</strong><span>channels appear in both feeds</span></div>
            <div className="channel-tape" aria-label="Example shared channels"><span>Every Frame a Painting</span><span>Vox</span><span>Polyphonic</span><span>Nerdwriter</span></div>
          </div>
        </section>

        <section className="story-slide story-slide-pink">
          <div className="story-number">03</div>
          <div className="difference-grid">
            <div><p className="story-overline">The plot twist</p><h2>Your feeds disagree in the best way.</h2><p>Differences become recommendations, not deductions. Blend shows what each person can introduce to the other.</p></div>
            <div className="difference-card difference-card-dark"><span>You should send them</span><strong>A 47-minute design breakdown</strong><small>They have never entered this rabbit hole</small></div>
            <div className="difference-card difference-card-yellow"><span>They should send you</span><strong>The cooking channel they quote constantly</strong><small>You are missing an entire era</small></div>
          </div>
        </section>

        <section className="story-slide story-slide-black">
          <div className="final-score-wrap">
            <p className="story-overline">The final card</p>
            <div className="final-pair"><span>T</span><span>A</span></div>
            <h2>Same frequency,<br />different rabbit holes.</h2>
            <div className="final-score">82<small>%</small></div>
            <p className="final-score-copy">Strong overlap in channels, music, and the kind of videos that somehow become a two-hour conversation.</p>
            <Button onClick={handleLogin} disabled={isLoading} size="lg" className="story-cta-button mt-8 h-14 rounded-full px-7 text-base"><Sparkles className="h-4 w-4" /> Make your story</Button>
          </div>
        </section>

        <section className="story-trust">
          <div><LockKeyhole /><h2>Fun result. Serious privacy.</h2><p>Read-only access. Nothing posted, edited, or deleted. Invite links expire after two hours.</p></div>
          <div className="story-trust-points"><span><Eye /> Read only</span><span><ShieldCheck /> Google OAuth</span><span><Check /> Free to use</span></div>
          <Link to="/privacy" className="inline-flex items-center gap-2 font-bold">How your data is handled <ArrowRight className="h-4 w-4" /></Link>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const TastePortrait = ({ initial, label, items, tone }: { initial: string; label: string; items: string[]; tone: "lime" | "pink" }) => (
  <motion.div whileHover={{ rotate: tone === "lime" ? -2 : 2, scale: 1.02 }} className={`taste-portrait taste-portrait-${tone}`}><span className="portrait-avatar">{initial}</span><p>{label}</p><div>{items.map(item => <span key={item}>{item}</span>)}</div></motion.div>
);

export default Landing;
