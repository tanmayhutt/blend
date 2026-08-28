import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Clock3, Loader2, LogOut, RefreshCw, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BlendHeader } from "@/components/BlendHeader";
import { Footer } from "@/components/Footer";
import { TasteProfileCard } from "@/components/TasteProfileCard";
import { TasteStrip } from "@/components/TasteStrip";
import { authClient, clearTokens, isAuthenticated } from "@/lib/auth";
import { emptyTasteData, type UserData } from "@/lib/types";

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
      setData((current) => ({ ...emptyTasteData(), ...current, ...response.data }));
    } catch (requestError: unknown) {
      const detail = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "Blend could not refresh your YouTube snapshot.");
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) { navigate("/", { replace: true }); return; }
    let active = true;
    authClient.get<UserData>("/data/me").then(async (response) => {
      if (!active) return;
      setData({ ...emptyTasteData(), ...response.data });
      if (!response.data.cached) await sync(); else setLoading(false);
    }).catch((requestError: unknown) => {
      if (!active) return;
      const detail = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "Blend could not open your account.");
      setLoading(false);
    });
    return () => { active = false; };
  }, [navigate, sync]);

  const createRoom = async () => {
    setCreating(true);
    setError(null);
    try {
      const response = await authClient.get<{ link: string; comparison_id: string }>("/compare/generate_link");
      navigate(`/compare/finalise/${response.data.comparison_id}`, { state: { inviteUrl: response.data.link } });
    } catch (requestError: unknown) {
      const detail = (requestError as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(detail || "Blend could not create an invitation.");
      setCreating(false);
    }
  };

  const signOut = () => { clearTokens(); navigate("/", { replace: true }); };

  if (loading) return <div className="app-state-page"><Loader2 className="state-spinner" aria-hidden="true" /><p className="eyebrow">Building your taste card</p><h1>Gathering the choices that make this side yours.</h1><p>This can take a moment on the first connection.</p></div>;

  const name = data?.profile?.name?.split(" ")[0] || "You";

  return (
    <div className="blend-app">
      <a href="#profile" className="skip-link">Skip to your profile</a>
      <BlendHeader actions={<><Link to="/settings" className="header-icon-link" aria-label="Account settings"><Settings aria-hidden="true" /></Link><button type="button" className="header-icon-link" onClick={signOut} aria-label="Sign out"><LogOut aria-hidden="true" /></button></>} />
      <main id="profile" className="profile-home">
        <header className="profile-home-intro">
          <div><p className="eyebrow">Your side of the story</p><h1>Meet {name} through what they keep.</h1></div>
          <div><p>Before you invite anyone, see the snapshot Blend will use. Nothing here comes from watch history.</p><Button variant="ghost" onClick={sync} disabled={syncing || creating}><RefreshCw className={syncing ? "animate-spin" : ""} />{syncing ? "Refreshing" : "Refresh snapshot"}</Button></div>
        </header>

        <section className="profile-home-grid">
          <TasteProfileCard profile={data?.profile} data={data || undefined} label="Your connected account" />
          <aside className="invite-dock">
            <span className="invite-dock-icon"><Users aria-hidden="true" /></span>
            <p className="eyebrow">Ready for a second side</p>
            <h2>Turn this profile into a shared reveal.</h2>
            <p>Blend creates a private two-hour invitation. Your friend sees exactly what will be shared before connecting.</p>
            <Button size="lg" onClick={createRoom} disabled={creating || syncing}>{creating ? <Loader2 className="animate-spin" /> : <ArrowRight />}{creating ? "Opening the room" : "Invite one person"}</Button>
            <small><Clock3 aria-hidden="true" /> Link expires after two hours and closes after one person joins.</small>
            {error ? <p className="form-error" role="alert">{error}</p> : null}
          </aside>
        </section>

        <section className="profile-library" aria-labelledby="library-heading">
          <header><div><p className="eyebrow">Inside your snapshot</p><h2 id="library-heading">The actual picks behind the profile.</h2></div><p>Open any item on YouTube. These lists stay private until both people consent to the comparison.</p></header>
          <div className="profile-library-grid">
            <article><span>Channels you follow</span><TasteStrip label="Your channels" items={data?.subscriptions || []} empty="No subscriptions were returned." limit={7} /></article>
            <article><span>Videos you kept</span><TasteStrip label="Your saved videos" items={data?.saved_videos || []} empty="No saved videos were returned." limit={7} /></article>
            <article><span>Music in the mix</span><TasteStrip label="Your music" items={data?.music_listened || []} empty="No music items were identified." limit={7} /></article>
            <article><span>Collections you made</span><TasteStrip label="Your playlists" items={data?.playlists || []} empty="No playlists were returned." limit={7} /></article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
