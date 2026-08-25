import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Eye, Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { initiateLogin, isAuthenticated, saveTokens } from "@/lib/auth";

const BlendScene = lazy(() => import("@/components/BlendScene").then(module => ({ default: module.BlendScene })));
const GoogleMark = () => <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.62.39 3.15 1.04 4.53l3.35-2.61Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z"/></svg>;
const fragments = [
  { className: "fragment-one", eyebrow: "shared channel", title: "Every Frame a Painting", meta: "both watched" },
  { className: "fragment-two", eyebrow: "your lane", title: "Design rabbit holes", meta: "42 saves" },
  { className: "fragment-three", eyebrow: "their lane", title: "Live sessions", meta: "on repeat" },
];

const Landing = () => {
  const navigate = useNavigate();
  const constraintsRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token"); const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) { saveTokens({ access_token: accessToken, refresh_token: refreshToken }); window.history.replaceState({}, document.title, "/"); }
    if (isAuthenticated() || (accessToken && refreshToken)) navigate("/dashboard");
  }, [navigate]);
  const handleLogin = async () => { setIsLoading(true); try { await initiateLogin(); } catch { setIsLoading(false); } };

  return <div className="app-shell landing-shell min-h-screen">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <header className="room-header">
      <Link to="/" className="brand-lockup" aria-label="YouTube Blend home"><span className="logo-frame"><Logo size={25}/></span><span>YouTube Blend</span></Link>
      <nav className="flex items-center gap-5" aria-label="Primary"><a href="#how-it-works" className="hidden text-sm text-white/60 hover:text-white sm:block">How it works</a><Link to="/privacy" className="hidden text-sm text-white/60 hover:text-white sm:block">Privacy</Link><Button onClick={handleLogin} disabled={isLoading} size="sm" className="room-button">Open your room</Button></nav>
    </header>
    <main id="main-content">
      <section className="room-hero">
        <div className="room-copy">
          <motion.p initial={{opacity:0}} animate={{opacity:1}} className="room-kicker"><span/>A private taste space for two</motion.p>
          <motion.h1 initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.7,ease:[.22,1,.36,1]}}>See where your YouTube worlds meet.</motion.h1>
          <motion.p initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.12}} className="room-intro">Bring one person. Blend quietly maps the channels, music, saves, and strange little rabbit holes that make both feeds yours.</motion.p>
          <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.22}} className="room-actions"><Button onClick={handleLogin} disabled={isLoading} size="lg" className="room-primary">{isLoading ? <Loader2 className="animate-spin"/> : <GoogleMark/>}{isLoading ? "Connecting" : "Make a Blend"}<ArrowRight className="h-4 w-4"/></Button><span>Free. Read-only. One invite.</span></motion.div>
        </div>
        <div className="room-stage" ref={constraintsRef} aria-label="Interactive preview. Drag the taste cards around the room.">
          <div className="room-glow"/><Suspense fallback={<div className="room-scene-fallback"/>}><BlendScene className="room-scene"/></Suspense>
          <div className="room-score"><span>taste signal</span><strong>82%</strong><small>same frequency</small></div>
          {fragments.map((fragment,index) => <motion.div key={fragment.title} drag={!reduceMotion} dragConstraints={constraintsRef} dragElastic={.12} dragMomentum={false} whileDrag={{scale:1.03,zIndex:20}} initial={{opacity:0,scale:.92}} animate={{opacity:1,scale:1}} transition={{delay:.25+index*.1}} className={`taste-fragment ${fragment.className}`}><span>{fragment.eyebrow}</span><strong>{fragment.title}</strong><small>{fragment.meta}</small></motion.div>)}
          <p className="drag-note">Drag the cards</p>
        </div>
      </section>
      <section id="how-it-works" className="room-process">
        <div className="process-intro"><p className="room-kicker"><span/>The whole experience</p><h2>Less dashboard.<br/>More conversation.</h2><p>No dense analytics wall. Blend turns the useful parts of your data into a small, visual story you can actually talk about.</p></div>
        <div className="process-steps"><article><span>01</span><div><h3>Connect your feed</h3><p>Google signs you in. Blend reads only what it needs and builds your private taste profile.</p></div></article><article><span>02</span><div><h3>Bring one person</h3><p>Send a short-lived link. Their feed stays theirs; the shared view appears only when they join.</p></div></article><article><span>03</span><div><h3>Explore the overlap</h3><p>Move through shared obsessions, unexpected differences, and recommendations worth sending.</p></div></article></div>
      </section>
      <section className="room-preview">
        <div className="preview-window"><div className="preview-topline"><span>Tanmay + Alex</span><span>Private room</span></div><div className="preview-center"><p>the shared signal</p><strong>Video essays<br/>after midnight</strong><div className="preview-meter"><i style={{width:"82%"}}/></div><span>14 shared channels · 6 new paths</span></div><div className="preview-float preview-float-left">You bring the deep dives</div><div className="preview-float preview-float-right">They bring the live sets</div></div>
        <div className="preview-copy"><p className="room-kicker"><span/>Designed to feel human</p><h2>Your data, translated into a shared moment.</h2><p>Scores provide orientation, not judgment. Differences are treated as doors into each other’s world, not points lost.</p><Button onClick={handleLogin} disabled={isLoading} className="room-primary mt-7">Create your room<ArrowRight className="h-4 w-4"/></Button></div>
      </section>
      <section className="room-trust"><div><p className="room-kicker"><span/>Quiet by design</p><h2>Only the two of you belong here.</h2></div><div className="trust-list"><span><Eye/>Read-only access</span><span><LockKeyhole/>Two-hour invite links</span><span><Check/>Nothing posted or changed</span></div><Link to="/privacy">Read the privacy details <ArrowRight/></Link></section>
    </main><Footer/>
  </div>;
};
export default Landing;
