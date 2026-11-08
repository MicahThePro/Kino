import {
  DEMO_VIDEOS,
  demoChannelVideos,
  demoGetChannels,
  demoGetPlaylists,
  demoGetVideos,
  demoPlaylistItems,
  demoRelated,
  demoSearch,
} from "./demo-data";
import {
  absoluteUrl,
  digitsFromCount,
  firstThumb,
  getInnertube,
  metadataParts,
  pickPart,
  textOf,
} from "./innertube";
import type {
  ChannelItem,
  PlaylistItem,
  SearchResult,
  SearchType,
  VideoItem,
  YoutubeMode,
} from "./types";

const MAX_RESULTS = 24;

type ApiEnvelope<T> = {
  mode: YoutubeMode;
  data: T;
  error?: string;
};

type LooseItem = Record<string, unknown> & {
  type?: string;
  content_type?: string;
  id?: string;
  content_id?: string;
  title?: unknown;
  description?: unknown;
  description_snippet?: unknown;
  author?: {
    name?: string;
    id?: string;
    best_thumbnail?: { url?: string };
    thumbnails?: Array<{ url?: string }>;
  };
  thumbnails?: Array<{ url?: string }>;
  published?: unknown;
  duration?: { text?: string } | string;
  view_count?: unknown;
  short_view_count?: unknown;
  video_count?: unknown;
  subscriber_count?: unknown;
  subscribers?: unknown;
  metadata?: {
    title?: unknown;
    metadata?: { metadata_rows?: Array<{ metadata_parts?: Array<{ text?: unknown }> }> };
  };
  content_image?: {
    image?: Array<{ url?: string }>;
    primary_thumbnail?: { image?: Array<{ url?: string }> };
  };
};

function asLoose(value: unknown): LooseItem | null {
  if (!value || typeof value !== "object") return null;
  return value as LooseItem;
}

function itemId(item: LooseItem) {
  return String(item.content_id || item.id || "").trim();
}

function itemTitle(item: LooseItem) {
  return textOf(item.metadata?.title) || textOf(item.title) || "Untitled";
}

function itemThumb(item: LooseItem) {
  return (
    absoluteUrl(item.content_image?.primary_thumbnail?.image?.[0]?.url) ||
    absoluteUrl(item.content_image?.image?.[0]?.url) ||
    firstThumb(item.thumbnails) ||
    firstThumb(item.author?.thumbnails) ||
    absoluteUrl(item.author?.best_thumbnail?.url)
  );
}

function mapVideoItem(raw: unknown): VideoItem | null {
  const item = asLoose(raw);
  if (!item) return null;

  const id = itemId(item);
  if (!id) return null;

  const type = String(item.type || "");
  const contentType = String(item.content_type || "");
  const looksVideo =
    type === "Video" ||
    type === "Movie" ||
    contentType === "VIDEO" ||
    Boolean(item.duration) ||
    Boolean(item.view_count) ||
    Boolean(item.short_view_count);

  if (
    contentType === "PLAYLIST" ||
    contentType === "SHOW" ||
    type === "Playlist" ||
    type === "Channel"
  ) {
    return null;
  }

  if (!looksVideo && type === "LockupView" && contentType && contentType !== "VIDEO") {
    return null;
  }

  const parts = metadataParts(item.metadata?.metadata?.metadata_rows);
  const viewsLabel =
    textOf(item.view_count) ||
    textOf(item.short_view_count) ||
    pickPart(parts, /views?/i);
  const published =
    textOf(item.published) || pickPart(parts, /(ago|Streamed|Premiered|hour|day|week|month|year)/i);

  return {
    id,
    title: itemTitle(item),
    description:
      textOf(item.description) || textOf(item.description_snippet) || "",
    channelId: item.author?.id || "",
    channelTitle:
      item.author?.name ||
      pickPart(parts, /^@|channel/i) ||
      parts.find((part) => !/views?|ago|subscribers?/i.test(part)) ||
      "Unknown channel",
    publishedAt: published,
    thumbnail: itemThumb(item) || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    duration: textOf(item.duration) || undefined,
    viewCount: digitsFromCount(viewsLabel) || viewsLabel || undefined,
  };
}

function mapChannelItem(raw: unknown): ChannelItem | null {
  const item = asLoose(raw);
  if (!item) return null;

  const id = itemId(item);
  if (!id) return null;

  const type = String(item.type || "");
  const contentType = String(item.content_type || "");
  if (
    type !== "Channel" &&
    contentType !== "CHANNEL" &&
    !(type === "LockupView" && contentType === "CHANNEL")
  ) {
    if (type !== "Channel") return null;
  }

  const parts = metadataParts(item.metadata?.metadata?.metadata_rows);
  // Channel search results mislabel fields: subscriber_count is often the @handle,
  // and video_count is often the subscriber label.
  const subscriberField = textOf(item.subscriber_count);
  const videoField = textOf(item.video_count);
  const handle =
    pickPart(parts, /^@/) ||
    (subscriberField.startsWith("@") ? subscriberField : "") ||
    undefined;
  const subs =
    textOf(item.subscribers) ||
    pickPart(parts, /subscribers?/i) ||
    (/subscribers?/i.test(videoField) ? videoField : "") ||
    (/subscribers?/i.test(subscriberField) ? subscriberField : "");
  const videos = pickPart(parts, /videos?/i) ||
    (/videos?/i.test(videoField) ? videoField : "");

  return {
    id,
    title: item.author?.name || itemTitle(item),
    description:
      textOf(item.description_snippet) || textOf(item.description) || "",
    thumbnail: itemThumb(item),
    subscriberCount: digitsFromCount(subs) || subs || undefined,
    videoCount: digitsFromCount(videos) || videos || undefined,
    customUrl: handle || undefined,
  };
}

function mapPlaylistItem(raw: unknown): PlaylistItem | null {
  const item = asLoose(raw);
  if (!item) return null;

  const id = itemId(item);
  if (!id) return null;

  const type = String(item.type || "");
  const contentType = String(item.content_type || "");
  const isPlaylist =
    type === "Playlist" ||
    contentType === "PLAYLIST" ||
    contentType === "SHOW" ||
    id.startsWith("PL") ||
    id.startsWith("UU") ||
    id.startsWith("LL") ||
    id.startsWith("OL");

  if (!isPlaylist) return null;
  if (type === "Video" || contentType === "VIDEO" || type === "Channel") return null;

  const parts = metadataParts(item.metadata?.metadata?.metadata_rows);
  const countLabel = pickPart(parts, /videos?/i);
  const channelTitle =
    item.author?.name ||
    parts.find((part) => !/videos?/i.test(part)) ||
    "Unknown channel";

  return {
    id,
    title: itemTitle(item),
    description: textOf(item.description) || "",
    channelId: item.author?.id || "",
    channelTitle,
    thumbnail: itemThumb(item),
    itemCount: countLabel
      ? Number(digitsFromCount(countLabel) || countLabel.replace(/[^\d]/g, "")) ||
        undefined
      : undefined,
    publishedAt: "",
  };
}

function mapSearchResults(rawItems: unknown[], type: SearchType): SearchResult[] {
  const results: SearchResult[] = [];

  for (const raw of rawItems) {
    const item = asLoose(raw);
    if (!item) continue;

    const kind = String(item.type || "");
    const contentType = String(item.content_type || "");

    const asChannel =
      kind === "Channel" || contentType === "CHANNEL"
        ? mapChannelItem(item)
        : null;
    const asPlaylist =
      kind === "Playlist" ||
      contentType === "PLAYLIST" ||
      contentType === "SHOW"
        ? mapPlaylistItem(item)
        : null;
    const asVideo =
      kind === "Video" || kind === "Movie" || contentType === "VIDEO"
        ? mapVideoItem(item)
        : null;

    if ((type === "all" || type === "channel") && asChannel) {
      results.push({ kind: "channel", item: asChannel });
      continue;
    }
    if ((type === "all" || type === "playlist") && asPlaylist) {
      results.push({ kind: "playlist", item: asPlaylist });
      continue;
    }
    if ((type === "all" || type === "video") && asVideo) {
      results.push({ kind: "video", item: asVideo });
      continue;
    }

    if (type === "all" || type === "video") {
      const fallbackVideo = mapVideoItem(item);
      if (fallbackVideo && !asChannel && !asPlaylist) {
        results.push({ kind: "video", item: fallbackVideo });
      }
    }
  }

  return results.slice(0, MAX_RESULTS);
}

function searchFilter(type: SearchType): "all" | "video" | "channel" | "playlist" {
  return type;
}

export function getYoutubeMode(): YoutubeMode {
  return "live";
}

export async function searchYoutube(
  query: string,
  type: SearchType = "all",
): Promise<ApiEnvelope<SearchResult[]>> {
  const q = query.trim();
  try {
    const yt = await getInnertube();
    const response = await yt.search(q || "popular videos", {
      type: searchFilter(type),
    });
    const results = mapSearchResults(response.results ?? [], type);
    if (results.length === 0 && !q) {
      return { mode: "demo", data: demoSearch("", type) };
    }
    return { mode: "live", data: results };
  } catch (error) {
    return {
      mode: "demo",
      data: demoSearch(q, type),
      error: error instanceof Error ? error.message : "Search failed",
    };
  }
}

export async function getPopularVideos(): Promise<ApiEnvelope<VideoItem[]>> {
  try {
    const yt = await getInnertube();
    const response = await yt.search("popular videos", { type: "video" });
    const videos = (response.results ?? [])
      .map(mapVideoItem)
      .filter((video): video is VideoItem => Boolean(video))
      .slice(0, MAX_RESULTS);

    if (videos.length === 0) {
      return { mode: "demo", data: DEMO_VIDEOS };
    }

    return { mode: "live", data: videos };
  } catch (error) {
    return {
      mode: "demo",
      data: DEMO_VIDEOS,
      error: error instanceof Error ? error.message : "Failed to load videos",
    };
  }
}

export async function getVideos(ids: string): Promise<ApiEnvelope<VideoItem[]>> {
  const idList = ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_RESULTS);

  if (idList.length === 0) {
    return { mode: "live", data: [] };
  }

  try {
    const yt = await getInnertube();
    const videos: VideoItem[] = [];

    for (const id of idList) {
      try {
        const info = await yt.getInfo(id);
        const title = textOf(info.primary_info?.title) || "Untitled";
        const views = textOf(info.primary_info?.view_count?.view_count) ||
          textOf(info.primary_info?.view_count?.short_view_count);
        const published =
          textOf(info.primary_info?.relative_date) ||
          textOf(info.primary_info?.published);
        const owner = info.secondary_info?.owner;
        const channelId =
          owner?.author?.id ||
          textOf(owner?.endpoint?.payload?.browseId) ||
          "";
        const channelTitle = owner?.author?.name || textOf(owner?.title) || "Unknown channel";
        const description = textOf(info.secondary_info?.description);

        videos.push({
          id,
          title,
          description,
          channelId,
          channelTitle,
          publishedAt: published,
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          viewCount: digitsFromCount(views) || views || undefined,
        });
      } catch {
        const fallback = demoGetVideos([id])[0];
        if (fallback) videos.push(fallback);
      }
    }

    return { mode: "live", data: videos };
  } catch (error) {
    return {
      mode: "demo",
      data: demoGetVideos(idList),
      error: error instanceof Error ? error.message : "Failed to load videos",
    };
  }
}

export async function getChannels(
  ids: string,
): Promise<ApiEnvelope<ChannelItem[]>> {
  const idList = ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_RESULTS);

  if (idList.length === 0) {
    return { mode: "live", data: [] };
  }

  try {
    const yt = await getInnertube();
    const channels: ChannelItem[] = [];

    for (const id of idList) {
      try {
        const channel = await yt.getChannel(id);
        const header = channel.header as {
          page_title?: string;
          content?: {
            title?: { text?: unknown };
            image?: { avatar?: { image?: Array<{ url?: string }> } };
            metadata?: {
              metadata_rows?: Array<{ metadata_parts?: Array<{ text?: unknown }> }>;
            };
            description?: { description?: unknown };
          };
        } | null;
        const meta = channel.metadata as {
          title?: string;
          description?: string;
          vanity_channel_url?: string;
          avatar?: Array<{ url?: string }>;
          external_id?: string;
        } | null;

        const parts = metadataParts(header?.content?.metadata?.metadata_rows);
        const subs = pickPart(parts, /subscribers?/i);
        const videos = pickPart(parts, /videos?/i);
        const handle =
          pickPart(parts, /^@/) ||
          meta?.vanity_channel_url?.split("/").pop() ||
          undefined;

        channels.push({
          id: meta?.external_id || id,
          title:
            meta?.title ||
            header?.page_title ||
            textOf(header?.content?.title?.text) ||
            "Untitled channel",
          description:
            meta?.description ||
            textOf(header?.content?.description?.description) ||
            "",
          thumbnail:
            firstThumb(meta?.avatar) ||
            absoluteUrl(header?.content?.image?.avatar?.image?.[0]?.url),
          subscriberCount: digitsFromCount(subs) || subs || undefined,
          videoCount: digitsFromCount(videos) || videos || undefined,
          customUrl: handle?.startsWith("@") ? handle : handle ? `@${handle}` : undefined,
        });
      } catch {
        const fallback = demoGetChannels([id])[0];
        if (fallback) channels.push(fallback);
      }
    }

    return { mode: "live", data: channels };
  } catch (error) {
    return {
      mode: "demo",
      data: demoGetChannels(idList),
      error: error instanceof Error ? error.message : "Failed to load channels",
    };
  }
}

export async function getPlaylists(
  ids: string,
): Promise<ApiEnvelope<PlaylistItem[]>> {
  const idList = ids
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, MAX_RESULTS);

  if (idList.length === 0) {
    return { mode: "live", data: [] };
  }

  try {
    const yt = await getInnertube();
    const playlists: PlaylistItem[] = [];

    for (const id of idList) {
      try {
        const playlist = await yt.getPlaylist(id);
        const info = playlist.info as {
          title?: unknown;
          description?: string;
          author?: { name?: string; id?: string };
          total_items?: string | number;
          thumbnails?: Array<{ url?: string }>;
        } | null;

        const total = textOf(info?.total_items);
        playlists.push({
          id,
          title: textOf(info?.title) || "Untitled playlist",
          description: info?.description || "",
          channelId: info?.author?.id || "",
          channelTitle: info?.author?.name || "Unknown channel",
          thumbnail: firstThumb(info?.thumbnails),
          itemCount: total
            ? Number(digitsFromCount(total) || total.replace(/[^\d]/g, "")) || undefined
            : undefined,
          publishedAt: "",
        });
      } catch {
        const fallback = demoGetPlaylists([id])[0];
        if (fallback) playlists.push(fallback);
      }
    }

    return { mode: "live", data: playlists };
  } catch (error) {
    return {
      mode: "demo",
      data: demoGetPlaylists(idList),
      error: error instanceof Error ? error.message : "Failed to load playlists",
    };
  }
}

export async function getPlaylistItems(
  playlistId: string,
): Promise<ApiEnvelope<VideoItem[]>> {
  const id = playlistId.trim();
  if (!id) return { mode: "live", data: [] };

  if (id.startsWith("PLDemo")) {
    return { mode: "demo", data: demoPlaylistItems(id) };
  }

  try {
    const yt = await getInnertube();
    const playlist = await yt.getPlaylist(id);
    const items = ((playlist as { items?: unknown[] }).items ?? [])
      .map(mapVideoItem)
      .filter((video): video is VideoItem => Boolean(video))
      .slice(0, MAX_RESULTS);

    return { mode: "live", data: items };
  } catch (error) {
    return {
      mode: "demo",
      data: demoPlaylistItems(id),
      error:
        error instanceof Error ? error.message : "Failed to load playlist items",
    };
  }
}

export async function getChannelUploads(
  channelId: string,
): Promise<ApiEnvelope<VideoItem[]>> {
  const id = channelId.trim();
  if (!id) return { mode: "live", data: [] };

  try {
    const yt = await getInnertube();
    const channel = await yt.getChannel(id);
    const tab = await channel.getVideos();
    const videos = ((tab as { videos?: unknown[] }).videos ?? [])
      .map(mapVideoItem)
      .filter((video): video is VideoItem => Boolean(video))
      .slice(0, MAX_RESULTS);

    return { mode: "live", data: videos };
  } catch (error) {
    return {
      mode: "demo",
      data: demoChannelVideos(id),
      error:
        error instanceof Error ? error.message : "Failed to load channel videos",
    };
  }
}

export async function getChannelPlaylists(
  channelId: string,
): Promise<ApiEnvelope<PlaylistItem[]>> {
  const id = channelId.trim();
  if (!id) return { mode: "live", data: [] };

  try {
    const yt = await getInnertube();
    const channel = await yt.getChannel(id);
    const tab = await channel.getPlaylists();
    const playlists = ((tab as { playlists?: unknown[]; videos?: unknown[] }).playlists ??
      (tab as { videos?: unknown[] }).videos ??
      [])
      .map(mapPlaylistItem)
      .filter((playlist): playlist is PlaylistItem => Boolean(playlist))
      .slice(0, MAX_RESULTS);

    return { mode: "live", data: playlists };
  } catch (error) {
    return {
      mode: "demo",
      data: [],
      error:
        error instanceof Error
          ? error.message
          : "Failed to load channel playlists",
    };
  }
}

export async function getRelatedVideos(
  videoId: string,
): Promise<ApiEnvelope<VideoItem[]>> {
  const id = videoId.trim();
  if (!id) return { mode: "live", data: [] };

  try {
    const yt = await getInnertube();
    const info = await yt.getInfo(id);
    const related = ((info.watch_next_feed as unknown[]) ?? [])
      .map(mapVideoItem)
      .filter((video): video is VideoItem => video != null && video.id !== id)
      .slice(0, 12);

    if (related.length === 0) {
      const search = await searchYoutube(
        textOf(info.primary_info?.title).split(" ").slice(0, 4).join(" ") ||
          "videos",
        "video",
      );
      return {
        mode: search.mode,
        data: search.data
          .filter((result) => result.kind === "video")
          .map((result) => result.item)
          .filter((video) => video.id !== id)
          .slice(0, 12),
        error: search.error,
      };
    }

    return { mode: "live", data: related };
  } catch (error) {
    return {
      mode: "demo",
      data: demoRelated(id),
      error:
        error instanceof Error ? error.message : "Failed to load related videos",
    };
  }
}
