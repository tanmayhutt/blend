import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check, ChevronDown, Copy, Disc3, Link as LinkIcon, List, Loader2, LogOut,
  Music, RefreshCw, Settings, Users, Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VideoCard } from "@/components/VideoCard";
import { FloatingChannels } from "@/components/FloatingChannels";
import { MusicShowcase } from "@/components/MusicShowcase";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { authClient, clearTokens, isAuthenticated, saveTokens } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/lib/utils";

const Dashboard = () => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expandedGenres, setExpandedGenres] = useState(false);
  const [expandedVideos, setExpandedVideos] = useState(false);
  const [expandedPlaylists, setExpandedPlaylists] = useState(false);
  const [activeSection, setActiveSection] = useState("channels");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const syncUserData = async () => {
    setSyncing(true);
    try {
      const response = await authClient.post("/data/sync");
      setUserData({
        subscriptions: response.data.subscriptions,
        subscription_genres: response.data.subscription_genres,
        saved_videos: response.data.saved_videos,
        music_listened: response.data.music_listened,
        video_genres: response.data.video_genres,
        playlists: response.data.playlists,
        last_synced_at: response.data.last_synced_at,
      });
      toast({
        title: response.data.warning === "quotaExceeded" ? "YouTube quota reached" : "Profile refreshed",
        description: response.data.message,
        variant: response.data.warning === "quotaExceeded" ? "destructive" : "default",
      });
    } catch (error: any) {
      toast({ title: "Refresh failed", description: error.response?.data?.detail || "Could not refresh your YouTube data", variant: "destructive" });
    } finally { setSyncing(false); }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    if (accessToken && refreshToken) {
      saveTokens({ access_token: accessToken, refresh_token: refreshToken });
      window.history.replaceState({}, document.title, "/dashboard");
    }
    if (!isAuthenticated()) { navigate("/"); return; }

    const fetchData = async () => {
      try {
        const response = await authClient.get("/data/me");
        setUserProfile(response.data.profile || null);
        setUserId(response.data.user_id || null);
        if (!response.data.cached) { setLoading(false); await syncUserData(); }
        else { setUserData(response.data); setLoading(false); }
      } catch (error: any) {
        setLoading(false);
        toast({ title: "Could not load your profile", description: error.response?.data?.detail || "Try again in a moment", variant: "destructive" });
      }
    };
    fetchData();
  }, [navigate, toast]);

  useEffect(() => {
    if (!userData) return;
    const available = [
      userData.subscriptions?.length && "channels",
      userData.music_listened?.length && "music",
      userData.saved_videos?.length && "videos",
      userData.playlists?.length && "playlists",
      new Set([...(userData.subscription_genres || []), ...(userData.video_genres || [])]).size && "genres",
    ].filter(Boolean) as string[];
    if (!available.includes(activeSection)) setActiveSection(available[0] || "channels");
  }, [activeSection, userData]);

  const generateLink = async () => {
    setGeneratingLink(true);
    try {
      const response = await authClient.get("/compare/generate_link");
      setShareLink(response.data.link);
      toast({ title: "Invite ready", description: "Copy the link and send it to one friend." });
    } catch (error: any) {
      toast({ title: "Could not create invite", description: error.response?.data?.detail || "Try again in a moment", variant: "destructive" });
    } finally { setGeneratingLink(false); }
  };

  const copyLink = async () => {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const logout = () => { clearTokens(); navigate("/"); };
  const genres = new Set([...(userData?.subscription_genres || []), ...(userData?.video_genres || [])]);
  const profileName = userProfile?.name || userProfile?.email || (userId ? `User ${userId.slice(-6)}` : "Your profile");
  const profileEmail = userProfile?.name && userProfile?.email ? userProfile.email : null;
  const profileInitial = profileName.charAt(0).toUpperCase();

  const sections = [
    { key: "channels", label: "Channels", count: userData?.subscriptions?.length || 0, icon: Users },
    { key: "music", label: "Music", count: userData?.music_listened?.length || 0, icon: Music },
    { key: "videos", label: "Videos", count: userData?.saved_videos?.length || 0, icon: Video },
    { key: "playlists", label: "Playlists", count: userData?.playlists?.length || 0, icon: List },
    { key: "genres", label: "Genres", count: genres.size, icon: Disc3 },
  ].filter((item) => item.count > 0);

  if (loading) return <PageState icon={Loader2} title="Reading your feed" text="Loading your channels, videos, music, and playlists." spin />;

  return (
    <div className="app-shell min-h-screen bg-background">
      <a href="#dashboard-content" className="skip-link">Skip to dashboard</a>
      <header className="workspace-header sticky top-0 z-50">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between px-5 py-4 lg:px-10">
          <button onClick={() => navigate("/")} className="flex items-center gap-3" aria-label="YouTube Blend home">
            <span className="logo-frame"><Logo size={27} /></span>
            <span className="text-sm font-extrabold">Blend</span>
          </button>
          <div className="flex items-center gap-3">
            {userData?.last_synced_at && <span className="hidden text-xs text-muted-foreground sm:block">Updated {formatRelativeTime(userData.last_synced_at)}</span>}
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="outline" size="sm"><ProfileAvatar profile={userProfile} name={profileName} initial={profileInitial} /><span className="hidden sm:inline">{profileName}</span></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel><div className="flex items-center gap-3"><ProfileAvatar profile={userProfile} name={profileName} initial={profileInitial} large /><div className="min-w-0"><p className="truncate text-sm font-bold">{profileName}</p>{profileEmail && <p className="truncate text-xs text-muted-foreground">{profileEmail}</p>}</div></div></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem disabled><Settings className="mr-2 h-4 w-4" />Settings coming later</DropdownMenuItem>
                <DropdownMenuItem onClick={logout}><LogOut className="mr-2 h-4 w-4" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main id="dashboard-content" className="mx-auto max-w-[88rem] px-5 py-8 lg:px-10 lg:py-12">
        <section className="workspace-hero p-6 sm:p-9 lg:p-12">
          <div className="relative z-10 grid gap-12 lg:grid-cols-[.78fr_1.22fr] lg:items-center">
            <div className="workspace-panel p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4"><div><p className="section-kicker">Start a shared room</p><h1 className="mt-3 text-4xl font-medium leading-none tracking-[-.055em] sm:text-5xl">Bring one person into your feed.</h1></div><LinkIcon className="h-5 w-5 text-primary" /></div>
              <p className="mt-5 text-sm leading-6 text-muted-foreground">One private link opens a shared view of your overlap, differences, and recommendations. It expires in two hours.</p>
              {!shareLink ? <Button onClick={generateLink} disabled={generatingLink} className="mt-5 w-full">{generatingLink ? <Loader2 className="animate-spin" /> : <LinkIcon />} {generatingLink ? "Creating invite" : "Create invite link"}</Button> : <div className="mt-5"><div className="flex gap-2"><input value={shareLink} readOnly aria-label="Comparison invite link" className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 text-xs text-foreground" /><Button onClick={copyLink} size="sm">{copied ? <Check /> : <Copy />}{copied ? "Copied" : "Copy"}</Button></div><button onClick={() => setShareLink(null)} className="mt-3 text-xs font-bold text-muted-foreground hover:text-foreground">Create another link</button></div>}
            </div>
            <div>
              <p className="section-kicker">Your side of the room</p>
              <h2 className="mt-4 max-w-3xl text-5xl font-medium leading-[.95] tracking-[-.06em] sm:text-7xl">A feed shaped like you.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-foreground/55">Before anyone joins, this is the material Blend found: the creators you follow, the things you keep, and the subjects that pull you back.</p>
              <Button onClick={syncUserData} disabled={syncing} variant="ghost" className="mt-5 px-0 text-muted-foreground hover:bg-transparent hover:text-foreground">{syncing ? <Loader2 className="animate-spin" /> : <RefreshCw />} {syncing ? "Refreshing profile" : "Refresh profile"}</Button>
            </div>
          </div>
        </section>

        {userData && <section className="mt-10 grid grid-cols-2 gap-x-6 md:grid-cols-4"><Stat value={userData.subscriptions?.length || 0} label="subscriptions" /><Stat value={userData.music_listened?.length || 0} label="music tracks" /><Stat value={userData.saved_videos?.length || 0} label="saved videos" /><Stat value={userData.playlists?.length || 0} label="playlists" /></section>}

        {userData && <section className="mt-24">
          <div className="section-heading"><div><p className="section-kicker">Your collection</p><h2 className="mt-3">Browse the shape of your taste.</h2></div><span className="hidden text-xs text-muted-foreground sm:block">Choose a view</span></div>
          <div className="section-nav my-7" role="navigation" aria-label="Profile categories">{sections.map(({ key, label, count, icon: Icon }) => <Button key={key} variant={activeSection === key ? "default" : "ghost"} onClick={() => setActiveSection(key)} className="shrink-0 rounded-full"><Icon />{label}<Badge variant="secondary" className="ml-1">{count}</Badge></Button>)}</div>

          {activeSection === "channels" && <Section title="The channels that made you" subtitle="The creators doing most of the shaping" count={userData.subscriptions?.length || 0}><FloatingChannels channels={userData.subscriptions || []} title="" /></Section>}
          {activeSection === "music" && <Section title="Your repeat soundtrack" subtitle="The tracks that followed you back here" count={userData.music_listened?.length || 0}><MusicShowcase musicTracks={userData.music_listened || []} /></Section>}
          {activeSection === "videos" && <Section title="Saved for another life" subtitle="Every rabbit hole you promised to return to" count={userData.saved_videos?.length || 0}><div className="content-grid">{(userData.saved_videos || []).slice(0, expandedVideos ? undefined : 12).map((video: any, index: number) => <VideoCard key={index} title={video.title} thumbnailUrl={video.thumbnail_url} videoId={video.video_id} />)}</div>{userData.saved_videos?.length > 12 && <ExpandButton expanded={expandedVideos} onClick={() => setExpandedVideos(!expandedVideos)} label={`${userData.saved_videos.length} videos`} />}</Section>}
          {activeSection === "playlists" && <Section title="Playlists" subtitle="The collections you chose to keep" count={userData.playlists?.length || 0}><div className="content-grid">{(userData.playlists || []).slice(0, expandedPlaylists ? undefined : 12).map((playlist: any, index: number) => <VideoCard key={index} title={playlist.title} thumbnailUrl={playlist.thumbnail_url} playlistId={playlist.playlist_id} />)}</div>{userData.playlists?.length > 12 && <ExpandButton expanded={expandedPlaylists} onClick={() => setExpandedPlaylists(!expandedPlaylists)} label={`${userData.playlists.length} playlists`} />}</Section>}
          {activeSection === "genres" && <Section title="Genres" subtitle="The broad shape of your interests" count={genres.size}><div className="flex flex-wrap gap-2">{Array.from(genres).sort().slice(0, expandedGenres ? undefined : 20).map((genre: any, index) => <Badge key={index} variant="outline" className="px-4 py-2 capitalize">{String(genre).replace(/_/g, " ")}</Badge>)}</div>{genres.size > 20 && <ExpandButton expanded={expandedGenres} onClick={() => setExpandedGenres(!expandedGenres)} label={`${genres.size} genres`} />}</Section>}
        </section>}
      </main>
      <Footer />
    </div>
  );
};

const ProfileAvatar = ({ profile, name, initial, large = false }: { profile: any; name: string; initial: string; large?: boolean }) => profile?.picture ? <img src={profile.picture} alt={name} className={`${large ? "h-9 w-9" : "h-6 w-6"} rounded-full object-cover`} /> : <span className={`${large ? "h-9 w-9" : "h-6 w-6"} grid place-items-center rounded-full bg-secondary text-xs font-bold`}>{initial}</span>;
const Stat = ({ value, label }: { value: number; label: string }) => <div className="stat-tile"><strong>{value}</strong><span>{label}</span></div>;
const Section = ({ title, subtitle, count, children }: { title: string; subtitle: string; count: number; children: React.ReactNode }) => <div className="mt-10"><div className="section-heading"><div><h3>{title}</h3><p className="mt-2 text-sm text-muted-foreground">{subtitle}</p></div><span className="text-3xl font-black tracking-[-.05em] text-muted-foreground">{count}</span></div><div className="mt-6">{children}</div></div>;
const ExpandButton = ({ expanded, onClick, label }: { expanded: boolean; onClick: () => void; label: string }) => <Button onClick={onClick} variant="outline" className="mt-6 w-full">{expanded ? "Show less" : `Show all ${label}`}<ChevronDown className={expanded ? "rotate-180" : ""} /></Button>;
const PageState = ({ icon: Icon, title, text, spin = false }: { icon: typeof Loader2; title: string; text: string; spin?: boolean }) => <div className="flex min-h-screen items-center justify-center bg-background px-4"><div className="app-loading-card"><Icon className={`mx-auto h-8 w-8 text-primary ${spin ? "animate-spin" : ""}`} /><h1 className="mt-5 text-2xl font-extrabold">{title}</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p></div></div>;

export default Dashboard;
