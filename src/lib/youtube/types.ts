export type SearchType = "all" | "video" | "short" | "live" | "channel" | "playlist";

export type ChannelTab = "videos" | "shorts" | "live";

/** How a video should be labeled and played. */
export type Playback = "video" | "short" | "live" | "vod";

export type VideoItem = {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnail: string;
  duration?: string;
  viewCount?: string;
  playback?: Playback;
};

export type ChannelItem = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount?: string;
  videoCount?: string;
  customUrl?: string;
};

export type PlaylistItem = {
  id: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  thumbnail: string;
  itemCount?: number;
  publishedAt: string;
};

export type SearchResult =
  | { kind: "video"; item: VideoItem }
  | { kind: "channel"; item: ChannelItem }
  | { kind: "playlist"; item: PlaylistItem };

export type YoutubeMode = "live" | "demo";
