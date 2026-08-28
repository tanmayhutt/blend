import { useEffect, useId, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Eye, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlendHeader } from "@/components/BlendHeader";
import { Footer } from "@/components/Footer";
import { PairSignal } from "@/components/PairSignal";
import { initiateLogin, isAuthenticated } from "@/lib/auth";

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="google-mark">
    <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z" />
    <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.24-2.53c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.39 13.92A6.02 6.02 0 0 1 6.08 12c0-.67.11-1.32.31-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.62.39 3.15 1.04 4.53l3.35-2.61Z" />
    <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z" />
  </svg>
);

const Landing = () => {
  const navigate = useNavigate();
  const consentId = useId();
  const reduceMotion = useReducedMotion();
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) navigate("/dashboard", { replace: true });
  }, [navigate]);

  const start = async () => {
    if (!accepted) {
      setError("Please review and accept the privacy notice before connecting your account.");
      document.getElementById(consentId)?.focus();
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await initiateLogin();
    } catch {
      setLoading(false);
      setError("Google sign-in could not start. Please try again.");
    }
  };

  return (
    <div className="blend-site">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <BlendHeader
        actions={
          <>
            <a href="#how" className="header-link">How it works</a>
            <Link to="/privacy" className="header-link">Privacy</Link>
            <Button size="sm" onClick={() => document.getElementById("connect")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })}>
              Start a Blend
            </Button>
          </>
        }
      />

      <main id="main-content">
        <section className="landing-hero">
          <motion.div
            className="hero-copy"
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="eyebrow">A private story for two feeds</p>
            <h1>Find the part of YouTube you share.</h1>
            <p className="hero-lead">
              Blend compares two people’s subscriptions, liked videos, and playlists, then turns the exact overlap and useful differences into a short shared reveal.
            </p>
            <div id="connect" className="connect-panel">
              <Button size="lg" onClick={start} disabled={loading} className="connect-button">
                {loading ? <Loader2 className="animate-spin" /> : <GoogleMark />}
                {loading ? "Opening Google" : "Continue with Google"}
                {!loading ? <ArrowRight aria-hidden="true" /> : null}
              </Button>
              <label htmlFor={consentId} className="consent-row">
                <input
                  id={consentId}
                  type="checkbox"
                  checked={accepted}
                  onChange={(event) => {
                    setAccepted(event.target.checked);
                    if (event.target.checked) setError(null);
                  }}
                />
                <span>
                  I agree to the <Link to="/privacy">Privacy Policy</Link> and <Link to="/terms">Terms</Link>. I understand that Blend uses YouTube API Services with read-only access.
                </span>
              </label>
              {error ? <p className="form-error" role="alert">{error}</p> : null}
            </div>
            <p className="micro-trust"><LockKeyhole aria-hidden="true" /> Nothing is posted, liked, edited, or deleted on YouTube.</p>
          </motion.div>

          <motion.div
            className="blend-poster"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            aria-label="Example of a two-person Blend reveal"
          >
            <div className="poster-topline"><span>Example reveal</span><span>Private room</span></div>
            <div className="poster-signal"><PairSignal leftLabel="You" rightLabel="A friend" score={78} /></div>
            <div className="poster-title">
              <span>Your shared corner</span>
              <strong>Deep dives<br />after midnight</strong>
            </div>
            <div className="poster-notes">
              <span>You bring the design essays</span>
              <span>They bring the live sessions</span>
            </div>
            <p>Illustrative product preview. Your result uses only data you both authorise.</p>
          </motion.div>
        </section>

        <section className="purpose-band" aria-labelledby="purpose-heading">
          <p className="eyebrow">What this application does</p>
          <h2 id="purpose-heading">It makes a conversation, not a surveillance dashboard.</h2>
          <div className="purpose-copy">
            <p>Blend is a personal, two-person comparison tool. It does not read browsing history or watch history. It analyses only the YouTube account data granted through the requested read-only scope.</p>
            <p>The similarity score and interest labels are calculated by Blend. They are not metrics supplied or endorsed by YouTube or Google.</p>
          </div>
        </section>

        <section id="how" className="story-sequence" aria-labelledby="how-heading">
          <div className="sequence-intro">
            <p className="eyebrow">One simple arc</p>
            <h2 id="how-heading">Connect. Invite. Reveal.</h2>
            <p>No account dashboard to learn. One private room carries the whole experience.</p>
          </div>
          <ol className="sequence-steps">
            <li><span>01</span><div><h3>Connect your side</h3><p>Google asks for read-only permission. Blend prepares a private snapshot from subscriptions, liked videos, and playlists.</p></div></li>
            <li><span>02</span><div><h3>Invite one person</h3><p>A two-hour link opens a clear consent screen. Their data is added only after they agree and authorise access.</p></div></li>
            <li><span>03</span><div><h3>Move through the reveal</h3><p>See exact shared finds, distinct recommendations, and a final result that is easy to discuss and share.</p></div></li>
          </ol>
        </section>

        <section className="data-note" aria-labelledby="data-heading">
          <div>
            <p className="eyebrow">The data boundary</p>
            <h2 id="data-heading">Useful enough to feel personal. Narrow enough to stay understandable.</h2>
          </div>
          <div className="data-note-list">
            <p><Eye aria-hidden="true" /><span><strong>Reads</strong> subscriptions, liked or saved videos, playlists, account name, and profile image.</span></p>
            <p><Check aria-hidden="true" /><span><strong>Creates</strong> exact shared lists, app-generated interest labels, recommendations, and a similarity story.</span></p>
            <p><LockKeyhole aria-hidden="true" /><span><strong>Controls</strong> include disconnecting Google access and deleting the stored Blend account data.</span></p>
          </div>
        </section>

        <section className="landing-close">
          <Sparkles aria-hidden="true" />
          <p className="eyebrow">Ready when both of you are</p>
          <h2>Make something worth sending.</h2>
          <Button size="lg" onClick={() => document.getElementById("connect")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" })}>
            Start a private Blend <ArrowRight aria-hidden="true" />
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
