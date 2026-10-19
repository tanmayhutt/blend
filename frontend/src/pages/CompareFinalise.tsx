import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Copy, Loader2, RefreshCw, Share2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlendHeader } from "@/components/BlendHeader";
import { PairSignal } from "@/components/PairSignal";
import { TasteStrip } from "@/components/TasteStrip";
import { TasteProfileCard } from "@/components/TasteProfileCard";
import { authClient, isAuthenticated } from "@/lib/auth";
import { emptyTasteData, type ComparisonParticipant, type ComparisonResponse, type ComparisonResults, type TasteData } from "@/lib/types";
import { toast } from "sonner";
import { cleanLabel } from "@/lib/taste";
import { CountUp } from "@/components/reveal/CountUp";
import { OverlapVenn } from "@/components/reveal/OverlapVenn";
import { ScoreBreakdown } from "@/components/reveal/ScoreBreakdown";
import { SwipeRow } from "@/components/reveal/SwipeRow";
import { ThumbWall } from "@/components/reveal/ThumbWall";
import { VersusBoard } from "@/components/reveal/VersusBoard";

// Copies text, falling back to a hidden textarea when the async Clipboard API is blocked.
const copyText = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or insecure context. Try the legacy path below.
  }
  const previousFocus = document.activeElement as HTMLElement | null;
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    previousFocus?.focus();
    return ok;
  } catch {
    previousFocus?.focus();
    return false;
  }
};

const showManualCopy = (text: string) => {
  toast("Copy this link", { description: text, duration: 12000 });
};

const chapters = ["Meet", "Versus", "Signal", "Shared", "Swap", "Shelves", "Shape", "Keep"] as const;

// Older snapshots can miss a list (for example playlists). Fill every list so no chapter reads undefined.
const withFullData = (participant?: ComparisonParticipant): ComparisonParticipant | undefined =>
  participant ? { ...participant, data: participant.data ? { ...emptyTasteData(), ...participant.data } : undefined } : undefined;

const firstName = (participant?: ComparisonParticipant, fallback = "You") => participant?.profile?.name?.split(" ")[0] || fallback;

const scoreStory = (score: number) => {
  if (score >= 72) return { title: "Same frequency", copy: "A lot of the same creators and saved finds already live on both sides." };
  if (score >= 45) return { title: "A useful overlap", copy: "You share enough common ground, with plenty left to introduce to each other." };
  if (score >= 20) return { title: "Different, with a bridge", copy: "The overlap is selective. The recommendations are where this Blend gets interesting." };
  return { title: "Two different worlds", copy: "Very little matched exactly, which gives both of you a strong list of things to trade." };
};

const normalise = (raw: ComparisonResponse): ComparisonResponse => {
  if (raw.status) return raw;
  return { ...raw, status: raw.results ? "completed" : "pending" };
};

const uniqueByTitle = <T extends { title: string }>(items: T[], excluded: T[] = []) => {
  const excludedTitles = new Set(excluded.map((item) => item.title.trim().toLowerCase()));
  const seen = new Set<string>();
  return items.filter((item) => {
    const title = item.title.trim().toLowerCase();
    if (!title || excludedTitles.has(title) || seen.has(title)) return false;
    seen.add(title);
    return true;
  });
};

const CompareFinalise = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const inviteFromNavigation = (location.state as { inviteUrl?: string } | null)?.inviteUrl;
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chapter, setChapter] = useState(0);
  const activeChapterRef = useRef<HTMLButtonElement>(null);
  const firstChapterRender = useRef(true);

  // Start each chapter at the top and keep its tab visible in the scrolling rail on small screens.
  useEffect(() => {
    if (firstChapterRender.current) { firstChapterRender.current = false; return; }
    const behavior = reduceMotion ? "auto" : "smooth";
    window.scrollTo({ top: 0, behavior });
    const tab = activeChapterRef.current;
    const rail = tab?.parentElement;
    if (tab && rail && rail.scrollWidth > rail.clientWidth) {
      rail.scrollTo({ left: tab.offsetLeft - (rail.clientWidth - tab.offsetWidth) / 2, behavior });
    }
  }, [chapter, reduceMotion]);
  const [copied, setCopied] = useState(false);

  const loadComparison = useCallback(async (manual = false) => {
    if (!id) return;
    if (manual) setRefreshing(true);
    try {
      const response = await authClient.get<ComparisonResponse>(`/compare/run/${id}`);
      setComparison(normalise(response.data));
      setError(null);
    } catch (requestError: unknown) {
      const status = (requestError as { response?: { status?: number } }).response?.status;
      const detail = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      if (status === 401) navigate("/", { replace: true });
      else setError(detail || "Blend could not open this comparison.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true });
      return;
    }
    loadComparison();
  }, [loadComparison, navigate]);

  useEffect(() => {
    if (!comparison || comparison.status === "completed") return;
    const timer = window.setInterval(() => loadComparison(), 4000);
    return () => window.clearInterval(timer);
  }, [comparison, loadComparison]);

  const inviteUrl = comparison?.invite_url || inviteFromNavigation || (id ? `${window.location.origin}/compare/join/${id}` : "");

  const copyInvite = async () => {
    if (!inviteUrl) return;
    if (!(await copyText(inviteUrl))) {
      showManualCopy(inviteUrl);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const results = comparison?.results;
  const viewer = useMemo(() => withFullData(comparison?.participants?.viewer || comparison?.meta?.viewer), [comparison]);
  const other = useMemo(() => withFullData(comparison?.participants?.other || comparison?.meta?.other), [comparison]);
  const viewerData = viewer?.data;
  const otherData = other?.data;
  const score = results?.scores?.overall || 0;
  const story = scoreStory(score);

  const trade = useMemo(() => {
    const sharedChannels = results?.common_subscriptions || [];
    const sharedVideos = results?.common_saved_videos || [];
    return {
      channels: uniqueByTitle(otherData?.subscriptions || [], sharedChannels),
      videos: uniqueByTitle(otherData?.saved_videos || [], sharedVideos),
    };
  }, [otherData, results]);

  const allGenres = useMemo(() => {
    const shared = [...(results?.common_subscription_genres || []), ...(results?.common_video_genres || [])];
    const viewerGenres = [...(viewerData?.subscription_genres || []), ...(viewerData?.video_genres || [])];
    const otherGenres = [...(otherData?.subscription_genres || []), ...(otherData?.video_genres || [])];
    return {
      shared: Array.from(new Set(shared)),
      yours: Array.from(new Set(viewerGenres)).filter((item) => !shared.includes(item)).slice(0, 8),
      theirs: Array.from(new Set(otherGenres)).filter((item) => !shared.includes(item)).slice(0, 8),
    };
  }, [otherData, results, viewerData]);

  const shareResult = async () => {
    const shareData = { title: `Our Blend: ${story.title}`, text: `We made a ${Math.round(score)}% Blend and found our shared corner.`, url: window.location.href };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        // The user closed the share sheet on purpose, so do nothing.
        if (error instanceof DOMException && error.name === "AbortError") return;
        // Otherwise sharing is unavailable here; fall back to copying.
      }
    }
    const shareText = `${shareData.text} ${shareData.url}`;
    if (!(await copyText(shareText))) {
      showManualCopy(shareData.url);
      return;
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (loading) {
    return <div className="app-state-page"><Loader2 className="state-spinner" aria-hidden="true" /><p className="eyebrow">Opening your Blend</p><h1>Bringing both sides together.</h1></div>;
  }

  if (error || !comparison) {
    return <div className="app-state-page"><p className="eyebrow">Room unavailable</p><h1>This Blend could not be opened.</h1><p>{error}</p><Button asChild><Link to="/dashboard">Create a new room</Link></Button></div>;
  }

  if (comparison.status !== "completed" || !results) {
    return (
      <div className="waiting-page">
        <BlendHeader backTo="/dashboard" backLabel="Session maker" actions={<Link to="/settings" className="header-link">Settings</Link>} />
        <main className="waiting-layout">
          <section className="waiting-copy">
            <p className="eyebrow">Your room is live</p>
            <h1>One side is ready. Send the other.</h1>
            <p>Keep this page open. The reveal will appear automatically after the other person accepts the invitation and finishes Google authorisation.</p>
            <ol className="waiting-steps" aria-label="Comparison progress">
              <li className="complete"><span>1</span><div><strong>Your profile is ready</strong><small>The snapshot is safely attached to this room.</small></div></li>
              <li className="active"><span>2</span><div><strong>Your person connects</strong><small>They review the sharing notice and add their side.</small></div></li>
              <li><span>3</span><div><strong>The reveal unlocks</strong><small>Both of you can explore every chapter.</small></div></li>
            </ol>
            <div className="invite-field">
              <input value={inviteUrl} readOnly aria-label="Private Blend invitation link" />
              <Button onClick={copyInvite}>{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy link"}</Button>
            </div>
            <button type="button" className="text-link" onClick={() => loadComparison(true)} disabled={refreshing}>
              <RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden="true" /> Check now
            </button>
          </section>
          <section className="waiting-visual">
            <span className="live-indicator"><i /> Waiting securely</span>
            <PairSignal left={viewer?.profile} right={other?.profile} rightLabel="Invited person" />
            <div className="waiting-note"><strong>Private for two hours</strong><span>The invitation stops working after it is used or expires.</span></div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="reveal-page">
      <BlendHeader backTo="/dashboard" backLabel="Session maker" actions={<span className="reveal-count">{chapter + 1} / {chapters.length}</span>} quiet />
      <main className="reveal-shell">
        <nav className="reveal-rail" aria-label="Blend reveal chapters">
          <span className="reveal-progress" aria-hidden="true"><i style={{ width: `${((chapter + 1) / chapters.length) * 100}%` }} /></span>
          {chapters.map((label, index) => (
            <button key={label} ref={chapter === index ? activeChapterRef : undefined} type="button" onClick={() => setChapter(index)} aria-current={chapter === index ? "step" : undefined}>
              <span>{String(index + 1).padStart(2, "0")}</span>{label}
            </button>
          ))}
        </nav>

        <div className="reveal-stage" aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <motion.section
              key={chapter}
              className={`reveal-chapter reveal-chapter-${chapter + 1}`}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -18 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              {chapter === 0 ? <MeetChapter viewer={viewer} other={other} /> : null}
              {chapter === 1 ? <VersusChapter viewer={viewer} other={other} /> : null}
              {chapter === 2 ? <SignalChapter results={results} viewer={viewer?.profile} other={other?.profile} story={story} /> : null}
              {chapter === 3 ? <SharedChapter results={results} viewer={viewer} other={other} /> : null}
              {chapter === 4 ? <TradeChapter trade={trade} otherName={firstName(other, "They")} /> : null}
              {chapter === 5 ? <ShelvesChapter viewer={viewer} other={other} /> : null}
              {chapter === 6 ? <ShapeChapter results={results} genres={allGenres} /> : null}
              {chapter === 7 ? <KeepChapter results={results} story={story} score={score} viewer={viewer} other={other} onShare={shareResult} copied={copied} /> : null}
            </motion.section>
          </AnimatePresence>
        </div>

        <div className="reveal-controls">
          <Button variant="ghost" onClick={() => setChapter((current) => Math.max(0, current - 1))} disabled={chapter === 0}><ArrowLeft />Back</Button>
          {chapter < chapters.length - 1 ? <Button onClick={() => setChapter((current) => Math.min(chapters.length - 1, current + 1))}>Next chapter<ArrowRight /></Button> : <Button onClick={() => navigate("/dashboard")}>Make another Blend<ArrowRight /></Button>}
        </div>
      </main>
    </div>
  );
};

const MeetChapter = ({ viewer, other }: { viewer?: ComparisonParticipant; other?: ComparisonParticipant }) => (
  <>
    <p className="eyebrow">First, meet both sides</p>
    <h1>Two people. Two different ways of keeping YouTube.</h1>
    <p className="chapter-lead">These cards introduce each person’s authorised snapshot before Blend turns them into a score.</p>
    <div className="meet-profiles">
      <TasteProfileCard profile={viewer?.profile} data={viewer?.data} label="Your side" tone="lime" compact />
      <TasteProfileCard profile={other?.profile} data={other?.data} label="Their side" tone="violet" compact />
    </div>
  </>
);

const VersusChapter = ({ viewer, other }: { viewer?: ComparisonParticipant; other?: ComparisonParticipant }) => (
  <>
    <p className="eyebrow">Head to head</p>
    <h1>Who keeps what.</h1>
    <p className="chapter-lead">A side-by-side count from both authorised snapshots. Bigger is not better here, just different.</p>
    <VersusBoard viewerName={firstName(viewer)} otherName={firstName(other, "Them")} viewer={viewer?.data} other={other?.data} />
  </>
);

const SignalChapter = ({ results, viewer, other, story }: { results: ComparisonResults; viewer?: { name?: string; picture?: string }; other?: { name?: string; picture?: string }; story: { title: string; copy: string } }) => (
  <>
    <p className="eyebrow">The shared signal</p>
    <h1>{story.title}</h1>
    <p className="chapter-lead">{story.copy}</p>
    <PairSignal left={viewer} right={other} score={results.scores.overall} />
    <div className="signal-caption"><strong><CountUp value={results.scores.overall} suffix="%" /></strong><span>A Blend-calculated similarity based on exact overlap. This is not a YouTube or Google metric.</span></div>
    <ScoreBreakdown scores={results.scores} />
  </>
);

const SharedChapter = ({ results, viewer, other }: { results: ComparisonResults; viewer?: ComparisonParticipant; other?: ComparisonParticipant }) => {
  const sets = [
    { key: "channels", label: "Channels", left: viewer?.data?.subscriptions.length || 0, right: other?.data?.subscriptions.length || 0, shared: results.common_subscriptions.length },
    { key: "saved", label: "Saved videos", left: viewer?.data?.saved_videos.length || 0, right: other?.data?.saved_videos.length || 0, shared: results.common_saved_videos.length },
    { key: "music", label: "Music", left: viewer?.data?.music_listened.length || 0, right: other?.data?.music_listened.length || 0, shared: results.common_music_listened.length },
  ];
  return (
    <>
      <p className="eyebrow">The exact matches</p>
      <h1>The things that reached both of you.</h1>
      <OverlapVenn viewerName={firstName(viewer)} otherName={firstName(other, "Them")} sets={sets} />
      <section className="shared-wall" aria-labelledby="shared-wall-heading">
        <h2 id="shared-wall-heading">Saved by both of you</h2>
        <ThumbWall items={results.common_saved_videos} label="Videos both people saved" empty="No exact shared saved videos were found." limit={8} />
      </section>
      <div className="chapter-strips">
        <div><h2 className="strip-heading">Channels you both follow</h2><TasteStrip label="Shared channels" items={results.common_subscriptions} empty="No exact shared channels were found." limit={6} /></div>
        <div><h2 className="strip-heading">Music you both kept</h2><TasteStrip label="Shared music" items={results.common_music_listened} empty="No exact shared music was found." limit={6} /></div>
      </div>
    </>
  );
};

const TradeChapter = ({ trade, otherName }: { trade: { channels: TasteData["subscriptions"]; videos: TasteData["saved_videos"] }; otherName: string }) => (
  <>
    <p className="eyebrow">Borrow from their side</p>
    <h1>Start with what {otherName} brought.</h1>
    <p className="chapter-lead">These are not algorithmic predictions. They are real items from the other person’s authorised snapshot that did not match yours exactly. Swipe through.</p>
    <SwipeRow title="Channels to try" items={trade.channels} empty="There are no distinct channels available to recommend." round />
    <SwipeRow title="Videos to try" items={trade.videos} empty="There are no distinct saved videos available to recommend." />
  </>
);

const ShelvesChapter = ({ viewer, other }: { viewer?: ComparisonParticipant; other?: ComparisonParticipant }) => {
  const viewerName = viewer?.profile?.name?.split(" ")[0] || "You";
  const otherName = other?.profile?.name?.split(" ")[0] || "Them";
  return (
    <>
      <p className="eyebrow">Open both shelves</p>
      <h1>See what each person actually brought.</h1>
      <p className="chapter-lead">A side-by-side look at representative channels, saved videos, music, and playlists. Items link back to YouTube.</p>
      <div className="account-shelves">
        <AccountShelf name={viewerName} data={viewer?.data} tone="lime" />
        <AccountShelf name={otherName} data={other?.data} tone="violet" />
      </div>
    </>
  );
};

const AccountShelf = ({ name, data, tone }: { name: string; data?: TasteData; tone: "lime" | "violet" }) => (
  <section className={`account-shelf account-shelf-${tone}`}>
    <header><span>{name}'s shelf</span><strong>{(data?.subscriptions.length || 0) + (data?.saved_videos.length || 0) + (data?.music_listened.length || 0) + (data?.playlists.length || 0)} visible picks</strong></header>
    <div><small>Channels</small><TasteStrip label={`${name}'s channels`} items={data?.subscriptions || []} empty="No channels returned." limit={4} /></div>
    <div><small>Saved videos</small><TasteStrip label={`${name}'s saved videos`} items={data?.saved_videos || []} empty="No saved videos returned." limit={4} /></div>
    <div><small>Music and playlists</small><TasteStrip label={`${name}'s music and playlists`} items={[...(data?.music_listened || []), ...(data?.playlists || [])]} empty="No music or playlists returned." limit={4} /></div>
  </section>
);

const ShapeChapter = ({ results, genres }: { results: ComparisonResults; genres: { shared: string[]; yours: string[]; theirs: string[] } }) => (
  <>
    <p className="eyebrow">The broad shape</p>
    <h1>Same corners. Different paths in.</h1>
    <p className="chapter-lead">These labels are generated by Blend from YouTube metadata. They are descriptive hints, not identities or YouTube-provided audience categories.</p>
    <div className="genre-lines">
      <GenreLine label="Shared" items={genres.shared} tone="shared" />
      <GenreLine label="Mostly yours" items={genres.yours} tone="viewer" />
      <GenreLine label="Mostly theirs" items={genres.theirs} tone="other" />
    </div>
    <div className="score-footnotes">
      {Object.entries(results.scores).filter(([key]) => key !== "overall").map(([key, value]) => <span key={key}><strong>{Math.round(value || 0)}%</strong>{cleanLabel(key)}</span>)}
    </div>
  </>
);

const GenreLine = ({ label, items, tone }: { label: string; items: string[]; tone: string }) => (
  <div className={`genre-line genre-line-${tone}`}>
    <header><strong>{label}</strong><small>{items.length} {items.length === 1 ? "label" : "labels"}</small></header>
    <div className="genre-chips">{items.length ? items.map((item) => <span key={item}>{cleanLabel(item)}</span>) : <em>No distinct labels</em>}</div>
  </div>
);

const KeepChapter = ({ results, story, score, viewer, other, onShare, copied }: { results: ComparisonResults; story: { title: string; copy: string }; score: number; viewer?: ComparisonParticipant; other?: ComparisonParticipant; onShare: () => void; copied: boolean }) => {
  const people = [viewer, other];
  const stats = [
    { value: results.common_subscriptions.length, label: "shared channels" },
    { value: results.common_saved_videos.length, label: "shared saves" },
    { value: results.common_music_listened.length, label: "shared music" },
  ];
  return (
    <>
      <p className="eyebrow">Your final cut</p>
      <article className="keep-card">
        <header className="keep-card-top">
          <span>Blend for two</span>
          <div className="keep-faces" aria-label={`${firstName(viewer)} and ${firstName(other, "them")}`}>
            {people.map((person, index) => person?.profile?.picture
              ? <img key={index} src={person.profile.picture} alt="" referrerPolicy="no-referrer" />
              : <span key={index}>{firstName(person, index ? "T" : "Y").slice(0, 1).toUpperCase()}</span>)}
          </div>
        </header>
        <div className="keep-card-score"><strong><CountUp value={score} suffix="%" /></strong><Sparkles aria-hidden="true" /></div>
        <h2>{story.title}</h2>
        <ul className="keep-stats">
          {stats.map((stat) => <li key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></li>)}
        </ul>
        {results.common_saved_videos.some((item) => item.thumbnail_url) ? (
          <div className="keep-strip" aria-hidden="true">
            {results.common_saved_videos.filter((item) => item.thumbnail_url).slice(0, 4).map((item, index) => <img key={`${item.video_id}-${index}`} src={item.thumbnail_url} alt="" loading="lazy" />)}
          </div>
        ) : null}
        <small>Calculated by Blend from data both people authorised. Not a YouTube or Google metric.</small>
      </article>
      <div className="keep-actions"><Button size="lg" onClick={onShare}>{copied ? <Check /> : <Share2 />}{copied ? "Link copied" : "Share this Blend"}</Button><p>{story.copy}</p></div>
    </>
  );
};

export default CompareFinalise;
