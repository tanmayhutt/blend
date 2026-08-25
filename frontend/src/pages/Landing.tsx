import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Check, Eye, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { SpotlightPanel } from "@/components/SpotlightPanel";
import { initiateLogin, isAuthenticated, saveTokens } from "@/lib/auth";

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-[18px] w-[18px]">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.62.39 3.15 1.04 4.53l3.35-2.61Z" />
    <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z" />
  </svg>
);

const BlendScene = lazy(() => import("@/components/BlendScene").then(module => ({ default: module.BlendScene })));

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
      <header className="site-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="YouTube Blend home">
            <span className="logo-frame"><Logo size={25} /></span>
            <span className="text-sm font-semibold tracking-[-0.02em]">YouTube Blend</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Main navigation">
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#preview" className="transition-colors hover:text-foreground">Preview</a>
            <Link to="/privacy" className="transition-colors hover:text-foreground">Privacy</Link>
          </nav>
          <Button onClick={handleLogin} disabled={isLoading} size="sm" className="rounded-full px-4">Create a blend</Button>
        </div>
      </header>

      <main id="main-content">
        <section className="landing-hero">
          <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:min-h-[760px] lg:grid-cols-[1fr_.92fr] lg:px-8 lg:py-20">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease: [0.22, 1, 0.36, 1] }}>
              <div className="product-label"><span /> Made for two people</div>
              <h1 className="landing-title mt-7">See where your YouTube tastes meet.</h1>
              <p className="mt-7 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">Connect your account, invite a friend, and get a private comparison of the channels, videos, music, and topics you both return to.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button onClick={handleLogin} disabled={isLoading} size="lg" className="h-12 rounded-full px-6 text-sm">
                  {isLoading ? <Loader2 className="animate-spin" /> : <GoogleMark />}
                  {isLoading ? "Connecting" : "Continue with Google"}
                </Button>
                <a href="#preview" className="inline-flex h-12 items-center justify-center gap-2 px-4 text-sm font-medium text-foreground">View an example <ArrowRight className="h-4 w-4" /></a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> Read-only access</span>
                <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" /> Google OAuth</span>
                <span className="inline-flex items-center gap-2"><Check className="h-3.5 w-3.5" /> Free</span>
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: .8, delay: .12 }} className="blend-visual">
              <Suspense fallback={<div className="absolute inset-[22%] animate-pulse rounded-full bg-secondary" />}>
                <BlendScene className="absolute inset-0" />
              </Suspense>
              <div className="blend-caption blend-caption-left"><span className="blend-dot bg-foreground" /> Your feed</div>
              <div className="blend-caption blend-caption-right"><span className="blend-dot bg-primary" /> Their feed</div>
              <div className="blend-score"><strong>82%</strong><span>example match</span></div>
            </motion.div>
          </div>
        </section>

        <section id="how" className="border-y border-border bg-card">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 py-24 lg:grid-cols-[.78fr_1.22fr] lg:px-8 lg:py-32">
            <div>
              <p className="product-label"><span /> How it works</p>
              <h2 className="editorial-title mt-6">One link does the introducing.</h2>
              <p className="mt-6 max-w-sm leading-7 text-muted-foreground">There is no taste quiz and nothing to curate. The comparison comes from the accounts you already use.</p>
            </div>
            <FeedConnection />
          </div>
        </section>

        <section id="preview" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32">
          <div className="mb-12 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="product-label"><span /> The result</p>
              <h2 className="editorial-title mt-6 max-w-3xl">A useful answer, with the receipts underneath.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted-foreground">The score is only the summary. Shared channels, videos, music, and categories explain how you got there.</p>
          </div>

          <SpotlightPanel className="result-preview">
            <div className="result-preview-head">
              <div><span className="status-dot" /> Private comparison</div>
              <span>Example result</span>
            </div>
            <div className="grid gap-10 p-6 sm:p-9 lg:grid-cols-[.78fr_1.22fr] lg:p-12">
              <div className="result-summary">
                <span className="result-score">82<small>%</small></span>
                <h3>Strong overlap</h3>
                <p>Your feeds meet around design, independent music, video essays, and a specific corner of comedy.</p>
              </div>
              <div className="result-details">
                <ResultRow value="14" label="Shared channels" width="82%" />
                <ResultRow value="8" label="Music matches" width="64%" />
                <ResultRow value="6" label="Common topics" width="52%" />
                <div className="mt-8 flex flex-wrap gap-2">
                  {["Video essays", "Design", "Indie music", "Comedy"].map(item => <span className="taste-tag" key={item}>{item}</span>)}
                </div>
              </div>
            </div>
          </SpotlightPanel>
        </section>

        <section className="border-t border-border">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
            <div className="max-w-3xl">
              <LockKeyhole className="h-5 w-5 text-primary" />
              <h2 className="mt-6 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">Your account stays yours.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">YouTube Blend requests read-only access. It cannot post, edit, or delete anything, and comparison links expire after two hours.</p>
            </div>
            <Link to="/privacy" className="inline-flex items-center gap-2 text-sm font-medium hover:text-primary">Read the privacy policy <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>

        <section className="border-t border-border bg-card px-5 py-24 text-center lg:px-8">
          <h2 className="mx-auto max-w-3xl text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">Compare the feeds you actually watch.</h2>
          <Button onClick={handleLogin} disabled={isLoading} size="lg" className="mt-8 h-12 rounded-full px-6 text-sm"><GoogleMark /> Continue with Google</Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const FeedConnection = () => (
  <div className="feed-connection">
    <svg className="connection-lines" viewBox="0 0 720 250" preserveAspectRatio="none" aria-hidden="true">
      <path className="connection-path" d="M90 125 C 230 125, 250 125, 360 125 S 520 125, 630 125" />
      <path className="connection-beam" d="M90 125 C 230 125, 250 125, 360 125 S 520 125, 630 125" />
    </svg>
    <div className="feed-node feed-node-left"><span>T</span><strong>You</strong><small>Connected</small></div>
    <div className="feed-node feed-node-center"><Logo size={30} /><strong>Blend</strong><small>Compare</small></div>
    <div className="feed-node feed-node-right"><span>A</span><strong>Friend</strong><small>Private link</small></div>
    <div className="connection-steps">
      <p><strong>01</strong> Connect with Google</p>
      <p><strong>02</strong> Share one expiring link</p>
      <p><strong>03</strong> Open the result together</p>
    </div>
  </div>
);

const ResultRow = ({ value, label, width }: { value: string; label: string; width: string }) => (
  <div className="result-row">
    <div><span>{label}</span><strong>{value}</strong></div>
    <div className="result-track"><motion.span initial={{ width: 0 }} whileInView={{ width }} viewport={{ once: true, amount: .8 }} transition={{ duration: .7, ease: [0.22, 1, 0.36, 1] }} /></div>
  </div>
);

export default Landing;
