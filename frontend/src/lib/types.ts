export interface Profile {
  name?: string;
  email?: string;
  picture?: string;
}

export interface ChannelItem {
  title: string;
  channel_id?: string;
  logo_url?: string;
  thumbnail_url?: string;
}

export interface VideoItem {
  title: string;
  video_id?: string;
  playlist_id?: string;
  thumbnail_url?: string;
  channel_title?: string;
  watch_count?: number;
}

export interface TasteData {
  subscriptions: ChannelItem[];
  subscription_genres: string[];
  saved_videos: VideoItem[];
  music_listened: VideoItem[];
  video_genres: string[];
  playlists: VideoItem[];
}

export interface UserData extends TasteData {
  cached?: boolean;
  last_synced_at?: string;
  message?: string;
  profile?: Profile;
  user_id?: string;
  warning?: string;
}

export interface ComparisonScores {
  subscriptions?: number;
  subscription_genres?: number;
  saved_videos?: number;
  video_genres?: number;
  music_listened?: number;
  overall: number;
  [key: string]: number | undefined;
}

export interface ComparisonResults {
  common_subscriptions: ChannelItem[];
  common_subscription_genres: string[];
  common_saved_videos: VideoItem[];
  common_video_genres: string[];
  common_music_listened: VideoItem[];
  scores: ComparisonScores;
}

export interface ComparisonParticipant {
  profile?: Profile;
  data?: TasteData;
  last_synced_at?: string;
  data_source?: string;
}

export interface ComparisonResponse {
  status: "pending" | "ready" | "completed";
  role?: "host" | "guest";
  message?: string;
  invite_url?: string;
  expires_at?: string;
  participants?: {
    viewer: ComparisonParticipant;
    other: ComparisonParticipant;
  };
  results?: ComparisonResults;
  // Backwards compatibility while older serverless instances roll over.
  meta?: {
    viewer?: ComparisonParticipant;
    other?: ComparisonParticipant;
  };
}

export const emptyTasteData = (): TasteData => ({
  subscriptions: [],
  subscription_genres: [],
  saved_videos: [],
  music_listened: [],
  video_genres: [],
  playlists: [],
});
