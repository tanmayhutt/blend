import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, CircleCheck, Loader2, LogOut, RefreshCw, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlendHeader } from "@/components/BlendHeader";
import { PairSignal } from "@/components/PairSignal";
import { Footer } from "@/components/Footer";
import { authClient, clearTokens, isAuthenticated } from "@/lib/auth";
import type { UserData } from "@/lib/types";

const emptyUserData: UserData = {
  subscriptions: [],
  subscription_genres: [],
  saved_videos: [],
  music_listened: [],
  video_genres: [],
  playlists: [],
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sync = useCallback(async () => {
    setSyncing(true);
    setError(null);
    try {
      const response = await authClient.post<UserData>("/data/sync");
      setData((current) => ({ ...emptyUserData, ...current, ...response.data }));
    } catch (requestError: unknown) {
      const detail = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "Blend could not refresh your YouTube snapshot.");
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/", { replace: true });
      return;
    }

    let active = true;
    const load = async () => {
      try {
        const response = await authClient.get<UserData>("/data/me");
        if (!active) return;
        setData({ ...emptyUserData, ...response.data });
        if (!response.data.cached) await sync();
        else setLoading(false);
      } catch (requestError: unknown) {
        if (!active) return;
        const detail = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
        setError(detail || "Blend could not open your account.");
        setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [navigate, sync]);

  const representativeItems = useMemo(() => {
    if (!data) return [];
    return [
      ...data.subscriptions.slice(0, 2).map((item) => ({ title: item.title, type: "Channel" })),
      ...data.saved_videos.slice(0, 2).map((item) => ({ title: item.title, type: "Saved video" })),
      ...data.playlists.slice(0, 1).map((item) => ({ title: item.title, type: "Playlist" })),
    ].slice(0, 5);
  }, [data]);

  const createRoom = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await authClient.get<{ link: string; comparison_id: string }>("/compare/generate_link");
      navigate(`/compare/finalise/${response.data.comparison_id}`, {
        state: { inviteUrl: response.data.link },
      });
    } catch (requestError: unknown) {
      const detail = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "Blend could not create an invitation.");
      setCreating(false);
    }
  };

  const signOut = () => {
    clearTokens();
    navigate("/", { replace: true });
  };

  if (loading) {
    return (
      <div className="app-state-page">
        <Loader2 className="state-spinner" aria-hidden="true" />
        <p className="eyebrow">Preparing your side</p>
        <h1>Reading the things you chose to keep.</h1>
        <p>This can take a moment on the first connection.</p>
      </div>
    );
  }

  const name = data?.profile?.name?.split(" ")[0] || "You";

  return (
    <div className="blend-app">
      <a href="#studio" className="skip-link">Skip to session maker</a>
      <BlendHeader
        actions={
          <>
            <Link to="/settings" className="header-icon-link" aria-label="Account settings"><Settings aria-hidden="true" /></Link>
            <button type="button" className="header-icon-link" onClick={signOut} aria-label="Sign out"><LogOut aria-hidden="true" /></button>
          </>
        }
      />

      <main id="studio" className="session-studio">
        <section className="session-intro">
          <p className="eyebrow">Your side is connected</p>
          <h1>{name}, bring one person.</h1>
          <p>Blend has enough to create a private two-person reveal. The next screen becomes your waiting room.</p>
          <div className="session-actions">
            <Button size="lg" onClick={createRoom} disabled={creating || syncing}>
              {creating ? <Loader2 className="animate-spin" /> : null}
              {creating ? "Creating the room" : "Create a private room"}
              {!creating ? <ArrowRight aria-hidden="true" /> : null}
            </Button>
            <Button variant="ghost" onClick={sync} disabled={syncing || creating}>
              <RefreshCw className={syncing ? "animate-spin" : ""} aria-hidden="true" />
              {syncing ? "Refreshing" : "Refresh my snapshot"}
            </Button>
          </div>
          {error ? <p className="form-error session-error" role="alert">{error}</p> : null}
        </section>

        <section className="session-canvas" aria-label="Your Blend session is ready for another person">
          <div className="session-canvas-label"><CircleCheck aria-hidden="true" /> Ready to invite</div>
          <PairSignal left={data?.profile} rightLabel="Waiting" />
          <div className="snapshot-ribbon">
            <div>
              <span>Your private snapshot</span>
              <strong>Prepared from data you authorised</strong>
            </div>
            <ul>
              {representativeItems.length ? representativeItems.map((item, index) => (
                <li key={`${item.title}-${index}`}><span>{item.type}</span>{item.title}</li>
              )) : <li><span>Snapshot</span>No saved items were returned yet</li>}
            </ul>
            <p>These examples remain private until another person joins and you both open the shared reveal.</p>
          </div>
        </section>
      </main>

      <section className="session-footnote">
        <span>Invite links expire after two hours.</span>
        <Link to="/privacy">How data sharing works <ArrowRight aria-hidden="true" /></Link>
      </section>
      <Footer />
    </div>
  );
};

export default Dashboard;
