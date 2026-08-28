import type { TasteData } from "@/lib/types";

export const cleanLabel = (value: string) => value.replaceAll("_", " ").replaceAll("%20", " ");

export const uniqueLabels = (data?: TasteData, limit = 6) => {
  if (!data) return [];
  return Array.from(new Set([...data.subscription_genres, ...data.video_genres].map(cleanLabel))).slice(0, limit);
};

export const tasteTitle = (data?: TasteData) => {
  if (!data) return "The new arrival";
  const { subscriptions, saved_videos: saved, music_listened: music, playlists } = data;
  if (music.length >= Math.max(8, saved.length * 0.45)) return "The soundtrack keeper";
  if (playlists.length >= 8) return "The collection builder";
  if (subscriptions.length >= 100) return "The wide-orbit explorer";
  if (saved.length >= 40) return "The deep-save curator";
  if (subscriptions.length >= 30) return "The curious regular";
  return "The selective browser";
};

export const tasteDescription = (data?: TasteData) => {
  if (!data) return "A connected profile waiting for its snapshot.";
  const counts = [
    { label: "channels", value: data.subscriptions.length },
    { label: "saved finds", value: data.saved_videos.length },
    { label: "music picks", value: data.music_listened.length },
    { label: "playlists", value: data.playlists.length },
  ].sort((a, b) => b.value - a.value);
  return counts[0].value
    ? `This side leans into ${counts[0].label}, with ${counts[1].label} giving it a second rhythm.`
    : "This profile is intentionally light. A future refresh may reveal more saved choices.";
};
