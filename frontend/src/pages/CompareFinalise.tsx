import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CompatibilityAvatars } from "@/components/CompatibilityAvatars";
import { ScoreCard } from "@/components/ScoreCard";
import { ChannelCard } from "@/components/ChannelCard";
import { VideoCard } from "@/components/VideoCard";
import { Badge } from "@/components/ui/badge";
import { FloatingChannels } from "@/components/FloatingChannels";
import { MusicShowcase } from "@/components/MusicShowcase";
import { Youtube, TrendingUp, Music, Video, Home, Loader2, List, RefreshCw } from "lucide-react";
import { Logo } from "@/components/Logo";
import { Footer } from "@/components/Footer";
import { authClient, clearTokens, isAuthenticated } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { formatRelativeTime } from "@/lib/utils";

const DataGrid = ({
  viewerData,
  otherData,
  viewerLabel,
  otherLabel,
  renderItem,
  emptyIcon: EmptyIcon,
  emptyText
}: any) => {
  if (!viewerData?.length && !otherData?.length) {
    return (
      <Card className="border-border bg-card p-12 text-center shadow-none">
        <EmptyIcon className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-bold text-muted-foreground">{emptyText}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {viewerData?.length > 0 && (
        <div>
          <h3 className="mb-4 text-xl font-extrabold tracking-[-.025em] text-foreground">{viewerLabel} <span className="text-muted-foreground">{viewerData.length}</span></h3>
          <div className="content-grid">
            {viewerData.map(renderItem)}
          </div>
        </div>
      )}
      {otherData?.length > 0 && (
        <div>
          <h3 className="mb-4 text-xl font-extrabold tracking-[-.025em] text-foreground">{otherLabel} <span className="text-muted-foreground">{otherData.length}</span></h3>
          <div className="content-grid">
            {otherData.map(renderItem)}
          </div>
        </div>
      )}
    </div>
  );
};

const CompareFinalise = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [comparisonMeta, setComparisonMeta] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [comparisonStatus, setComparisonStatus] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const comparisonLink = id ? `${window.location.origin}/compare/join/${id}` : "";

  const runComparison = async (forceRefresh = false) => {
    if (!id) return;
    if (!forceRefresh) {
      setLoading(true);
    }

    try {
      const url = forceRefresh ? `/compare/run/${id}?refresh=1` : `/compare/run/${id}`;
      const response = await authClient.get(url);
      if (response.data?.results) {
        setComparisonData(response.data.results);
        setComparisonStatus("completed");
        setStatusMessage(null);
        
      } else if (response.data?.status) {
        setComparisonData(null);
        setComparisonStatus(response.data.status);
        setStatusMessage(response.data.message || null);
      }
      setComparisonMeta(response.data.meta);
      setError(null);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (detail && detail.includes("Comparison is not ready")) {
        setComparisonData(null);
        setComparisonStatus("pending");
        setStatusMessage(detail);
        setError(null);
      } else {
        setError(detail || "Failed to load comparison results");
        setComparisonStatus("error");
        toast({
          title: "Error",
          description: "Could not load comparison results",
          variant: "destructive",
        });
      }
    } finally {
      if (!forceRefresh) {
        setLoading(false);
      }
    }
  };

  const handleRefreshMyData = async () => {
    setRefreshing(true);
    try {
      await authClient.post("/data/sync");
      await runComparison(true);
      toast({
        title: "Data refreshed",
        description: "Your comparison results are updated.",
      });
    } catch (err: any) {
      toast({
        title: "Refresh failed",
        description: err.response?.data?.detail || "Could not refresh your data",
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyLink = () => {
    if (!comparisonLink) return;
    navigator.clipboard.writeText(comparisonLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  useEffect(() => {
    // Check authentication first
    if (!isAuthenticated()) {
      setError("Please log in to view comparison results");
      setLoading(false);
      toast({
        title: "Authentication Required",
        description: "Please log in to continue",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    if (id) {
      runComparison();
    }
  }, [id, navigate, toast]);

  const getMatchMessage = (score: number) => {
    if (score >= 80) return {
      text: "Same frequency",
      desc: "Your feeds overlap strongly across channels, saved videos, music, and recurring interests."
    };
    if (score >= 60) return {
      text: "Strong signal",
      desc: "You share meaningful common ground across several parts of your YouTube taste."
    };
    if (score >= 40) return {
      text: "Interesting overlap",
      desc: "Your feeds are distinct, but they meet in enough places to create a real shared lane."
    };
    if (score >= 20) return {
      text: "Different lanes",
      desc: "Your feeds mostly travel in different directions, with a few useful points of connection."
    };
    return {
      text: "Opposite feeds",
      desc: "You have very different viewing habits, which makes this a good map for trading recommendations."
    };
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleNewComparison = () => {
    clearTokens();
    navigate("/");
  };

  if (loading) {
    return <PageState icon={Loader2} title="Comparing both feeds" text="Reading channels, saved videos, music, and interests." spin />;
  }

  if (comparisonStatus === "pending" && !comparisonData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="app-loading-card space-y-4">
          <Youtube className="mx-auto h-9 w-9 text-primary" />
          <h1 className="text-2xl font-bold">Waiting for the other user</h1>
          <p className="text-muted-foreground">{statusMessage || "They need to finish Google login for this link."}</p>
          <div className="space-y-3">
            <div className="flex gap-2">
              <input aria-label="Comparison invite link"
                type="text"
                value={comparisonLink}
                readOnly
                className="min-w-0 flex-1 rounded-xl border border-input bg-background px-3 py-2 text-xs"
              />
              <Button onClick={handleCopyLink} variant="outline" size="sm">
                {copiedLink ? "Copied" : "Copy"}
              </Button>
            </div>
            <Button onClick={() => runComparison()} size="sm">
              Check again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !comparisonData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="app-loading-card space-y-4">
          <Youtube className="mx-auto h-9 w-9 text-destructive" />
          <h1 className="text-2xl font-bold">Something Went Wrong</h1>
          <p className="text-muted-foreground">{error || "Could not load comparison"}</p>
          <Button onClick={() => navigate("/")} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const matchMessage = comparisonData.scores?.overall
    ? getMatchMessage(comparisonData.scores.overall)
    : null;

  return (
    <div className="app-shell min-h-screen bg-background">
      <a href="#comparison-content" className="skip-link">Skip to comparison</a>
      <header className="workspace-header sticky top-0 z-50">
        <div className="mx-auto flex max-w-[92rem] items-center justify-between px-5 py-4 lg:px-10">
            <button onClick={handleBackToDashboard} className="flex items-center gap-3" aria-label="Back to dashboard">
              <span className="logo-frame"><Logo size={27} /></span>
              <span className="hidden text-sm font-extrabold sm:block">Comparison</span>
            </button>
            
            <div className="flex items-center gap-4">
              {comparisonMeta && (
                <div className="hidden items-center gap-3 text-xs text-muted-foreground md:flex">
                  <div className="flex items-center gap-1.5">
                    <span className="opacity-60">You:</span>
                    <span className="font-medium text-foreground/80">{formatRelativeTime(comparisonMeta.viewer?.last_synced_at)}</span>
                  </div>
                  <div className="h-3 w-px bg-border"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="opacity-60">Them:</span>
                    <span className="font-medium text-foreground/80">{formatRelativeTime(comparisonMeta.other?.last_synced_at)}</span>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBackToDashboard} className="hidden gap-2 text-sm sm:inline-flex">
                  <Home className="w-4 h-4" />
                  Dashboard
                </Button>
                <Button onClick={handleNewComparison} className="gap-2 text-sm">
                  New blend
                </Button>
              </div>
            </div>
        </div>
      </header>

      <main id="comparison-content" className="mx-auto max-w-[92rem] px-5 py-10 lg:px-10 lg:py-14">
        <div>
          {comparisonMeta && (
            <Card className="mb-7 flex flex-col gap-4 border-border bg-card p-5 shadow-none md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">Snapshot freshness</h3>
                <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
                  Results use the latest saved profile for each person. Refresh yours if your feed changed recently.
                </p>
              </div>
              <Button onClick={handleRefreshMyData} disabled={refreshing} variant="default" className="gap-2 whitespace-nowrap">
                {refreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                {refreshing ? "Refreshing" : "Refresh mine"}
              </Button>
            </Card>
          )}
          {/* Match Score Card */}
          {matchMessage && (
            <section className="workspace-hero mb-12 px-6 py-10 text-center sm:px-10 sm:py-12">
              <div className="relative z-10 space-y-7">
                <CompatibilityAvatars
                  viewerProfile={comparisonMeta?.viewer?.profile}
                  otherProfile={comparisonMeta?.other?.profile}
                  score={comparisonData.scores.overall}
                />
                <div>
                  <p className="section-kicker">Your YouTube story</p>
                  <h1 className="mx-auto mt-4 max-w-4xl text-4xl font-black leading-[.95] tracking-[-.055em] text-foreground sm:text-6xl">
                    {matchMessage.text}
                  </h1>
                  <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                    {matchMessage.desc}
                  </p>
                </div>
              </div>
            </section>
          )}

          <section className="comparison-story-cards" aria-label="Comparison highlights">
            <div className="comparison-story-card story-card-lime">
              <span>Shared obsession</span>
              <strong>{comparisonData.common_subscriptions?.length || 0}</strong>
              <p>channels found their way into both feeds</p>
            </div>
            <div className="comparison-story-card story-card-pink">
              <span>Same soundtrack</span>
              <strong>{comparisonData.common_music_listened?.length || 0}</strong>
              <p>music picks survived both algorithms</p>
            </div>
            <div className="comparison-story-card story-card-yellow">
              <span>Saved by both</span>
              <strong>{comparisonData.common_saved_videos?.length || 0}</strong>
              <p>videos earned a place on both lists</p>
            </div>
          </section>

          {/* Detailed Results Tabs */}
          <Tabs defaultValue="scores" className="w-full">
            <TabsList className="mb-8 grid w-full grid-cols-3 overflow-x-auto md:grid-cols-6">
              <TabsTrigger value="scores" className="flex items-center gap-1 text-xs md:text-sm">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Scores</span>
              </TabsTrigger>
              <TabsTrigger value="common" className="flex items-center gap-1 text-xs md:text-sm">
                <Music className="w-4 h-4" />
                <span className="hidden sm:inline">Common</span>
              </TabsTrigger>
              <TabsTrigger value="subscriptions" className="flex items-center gap-1 text-xs md:text-sm">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Channels</span>
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-1 text-xs md:text-sm">
                <Video className="w-4 h-4" />
                <span className="hidden sm:inline">Videos</span>
              </TabsTrigger>
              <TabsTrigger value="music" className="flex items-center gap-1 text-xs md:text-sm">
                <Music className="w-4 h-4" />
                <span className="hidden sm:inline">Music</span>
              </TabsTrigger>
              <TabsTrigger value="genres" className="flex items-center gap-1 text-xs md:text-sm">
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Genres</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scores" className="space-y-6">
              <div>
                <h2 className="mb-2 text-4xl font-black tracking-[-.06em] text-foreground">How the story adds up</h2>
                <p className="mb-4 text-sm text-muted-foreground">The overall score, unpacked without making it feel like homework.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(comparisonData.scores).map(([key, value]: [string, any]) => (
                  <ScoreCard key={key} label={key} score={value} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="common" className="space-y-8">
              <div className="mb-6">
                <h2 className="mb-2 text-4xl font-black tracking-[-.06em] text-foreground">The shared obsession</h2>
                <p className="text-muted-foreground">The exact part of YouTube where both of your universes keep meeting.</p>
              </div>

              {(comparisonData.common_subscriptions?.length > 0 ||
                comparisonData.common_saved_videos?.length > 0 ||
                comparisonData.common_music_listened?.length > 0) ? (
                <div className="space-y-8">
                  {/* Emphasize Common Music */}
                  {comparisonData.common_music_listened && comparisonData.common_music_listened.length > 0 && (
                    <MusicShowcase musicTracks={comparisonData.common_music_listened} />
                  )}

                  {/* Common Floating Channels */}
                  {comparisonData.common_subscriptions && comparisonData.common_subscriptions.length > 0 && (
                    <FloatingChannels channels={comparisonData.common_subscriptions} title="Common Favorite Channels" />
                  )}

                  {/* Common Videos */}
                  {comparisonData.common_saved_videos && comparisonData.common_saved_videos.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Videos You Both Saved</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {comparisonData.common_saved_videos.map((video: any, index: number) => (
                          <VideoCard key={index} title={video.title} thumbnailUrl={video.thumbnail_url} videoId={video.video_id} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-2xl font-bold mb-2">No Common Content Yet</p>
                  <p className="text-muted-foreground text-sm">
                    This is your chance to introduce each other to amazing new content
                  </p>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="subscriptions" className="space-y-6">
              <div>
                <h2 className="mb-2 text-3xl font-extrabold tracking-[-.04em] text-foreground">Both channel lists</h2>
                <p className="mb-4 text-sm text-muted-foreground">See the creators shaping each feed.</p>
              </div>
              <DataGrid
                viewerData={comparisonData.subscriptions}
                otherData={comparisonData.user_2_subscriptions}
                viewerLabel="Your Subscriptions"
                otherLabel="Their Subscriptions"
                emptyIcon={TrendingUp}
                emptyText="No subscription data available"
                renderItem={(sub: any, index: number) => <ChannelCard key={index} title={sub.title} logoUrl={sub.logo_url} channelId={sub.channel_id} />}
              />
            </TabsContent>

            <TabsContent value="videos" className="space-y-6">
              <div>
                <h2 className="mb-2 text-3xl font-extrabold tracking-[-.04em] text-foreground">Both saved lists</h2>
                <p className="mb-4 text-sm text-muted-foreground">The videos each of you chose to keep.</p>
              </div>
              <DataGrid
                viewerData={comparisonData.saved_videos}
                otherData={comparisonData.user_2_saved_videos}
                viewerLabel="Your Saved Videos"
                otherLabel="Their Saved Videos"
                emptyIcon={Video}
                emptyText="No saved videos available"
                renderItem={(video: any, index: number) => <VideoCard key={index} title={video.title} thumbnailUrl={video.thumbnail_url} videoId={video.video_id} />}
              />
            </TabsContent>

            <TabsContent value="music" className="space-y-6">
              <div>
                <h2 className="mb-2 text-3xl font-extrabold tracking-[-.04em] text-foreground">Both music profiles</h2>
                <p className="mb-4 text-sm text-muted-foreground">The tracks on each side of the comparison.</p>
              </div>
              <DataGrid
                viewerData={comparisonData.music_listened}
                otherData={comparisonData.user_2_music_listened}
                viewerLabel="Your Music"
                otherLabel="Their Music"
                emptyIcon={Music}
                emptyText="No music data available"
                renderItem={(music: any, index: number) => <VideoCard key={index} title={music.title} thumbnailUrl={music.thumbnail_url} videoId={music.video_id} />}
              />
            </TabsContent>

            <TabsContent value="genres" className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Your Interests</h2>
                <p className="text-sm text-muted-foreground mb-4">The genres and categories that define your YouTube personality and taste.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {comparisonData.subscription_genres?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Channel Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(comparisonData.subscription_genres)).map((genre: string, index: number) => (
                        <Badge key={index} variant="secondary" className="capitalize">
                          {genre.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {comparisonData.user_2_subscription_genres?.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Their Channel Interests</h3>
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(comparisonData.user_2_subscription_genres)).map((genre: string, index: number) => (
                        <Badge key={index} variant="outline" className="capitalize">
                          {genre.replace(/_/g, " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {(comparisonData.video_genres?.length > 0 || comparisonData.user_2_video_genres?.length > 0) && (
                <div className="mt-6 pt-6 border-t">
                  <h2 className="text-xl font-bold text-foreground mb-6">Video Content Interests</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {comparisonData.video_genres?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Your Video Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(comparisonData.video_genres)).map((genre: string, index: number) => (
                            <Badge key={index} variant="secondary" className="capitalize">
                              {genre.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {comparisonData.user_2_video_genres?.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Their Video Interests</h3>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(comparisonData.user_2_video_genres)).map((genre: string, index: number) => (
                            <Badge key={index} variant="outline" className="capitalize">
                              {genre.replace(/_/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
};

const PageState = ({ icon: Icon, title, text, spin = false }: { icon: typeof Loader2; title: string; text: string; spin?: boolean }) => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="app-loading-card">
      <Icon className={`mx-auto h-8 w-8 text-primary ${spin ? "animate-spin" : ""}`} />
      <h1 className="mt-5 text-2xl font-extrabold">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  </div>
);

export default CompareFinalise;
