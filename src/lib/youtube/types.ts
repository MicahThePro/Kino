export type SearchType = "all" | "video" | "channel" | "playlist";

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
