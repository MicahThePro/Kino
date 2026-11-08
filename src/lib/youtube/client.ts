import {
  DEMO_VIDEOS,
  demoChannelLive,
  demoChannelShorts,
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
  Playback,
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
  video_id?: string;
  content_id?: string;
  title?: unknown;
  description?: unknown;
  description_snippet?: unknown;
  is_live?: boolean;
  author?: {
    name?: string;
    id?: string;
    best_thumbnail?: { url?: string };
    thumbnails?: Array<{ url?: string }>;
  };
  thumbnails?: Array<{ url?: string }>;
  thumbnail?: Array<{ url?: string }>;
  badges?: Array<{ label?: string; style?: string }>;
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
  thumbnail_view_model?: { image?: Array<{ url?: string }> };
  overlay_metadata?: { primary_text?: unknown; secondary_text?: unknown };
  on_tap_endpoint?: { payload?: { videoId?: string }; metadata?: { url?: string } };
  endpoint?: { payload?: { videoId?: string }; metadata?: { url?: string } };
  contents?: unknown[];
  items?: unknown[];
};

const SHELF_TYPES = new Set([
  "GridShelfView",
  "ReelShelf",
  "Shelf",
  "HorizontalShelfView",
  "RichShelf",
  "OfficialCardView",
]);

function asLoose(value: unknown): LooseItem | null {
  if (!value || typeof value !== "object") return null;
  return value as LooseItem;
}

function itemId(item: LooseItem) {
  return String(
    item.video_id ||
      item.content_id ||
      item.on_tap_endpoint?.payload?.videoId ||
      item.endpoint?.payload?.videoId ||
      item.id ||
      "",
  ).trim();
}

function itemTitle(item: LooseItem) {
  return (
    textOf(item.metadata?.title) ||
    textOf(item.title) ||
    textOf(item.overlay_metadata?.primary_text) ||
    "Untitled"
  );
}

function itemThumb(item: LooseItem) {
  return (
    absoluteUrl(item.thumbnail_view_model?.image?.[0]?.url) ||
    absoluteUrl(item.content_image?.primary_thumbnail?.image?.[0]?.url) ||
    absoluteUrl(item.content_image?.image?.[0]?.url) ||
    firstThumb(item.thumbnails) ||
    firstThumb(item.thumbnail) ||
    firstThumb(item.author?.thumbnails) ||
    absoluteUrl(item.author?.best_thumbnail?.url)
  );
}

function badgeLabels(item: LooseItem) {
  return (item.badges ?? [])
    .map((badge) => badge.label || badge.style || "")
    .filter(Boolean);
}

function playbackBlob(item: LooseItem, parts: string[]) {
  return [
    ...parts,
    textOf(item.published),
    textOf(item.overlay_metadata?.secondary_text),
    ...badgeLabels(item),
  ]
    .filter(Boolean)
    .join(" ");
}

function durationText(item: LooseItem) {
  const value = textOf(item.duration);
  return value.trim();
}

function inferPlayback(item: LooseItem, parts: string[], from?: "shorts" | "live"): Playback {
  const type = String(item.type || "");
  const contentType = String(item.content_type || "");
  const endpointUrl = `${item.on_tap_endpoint?.metadata?.url || ""} ${item.endpoint?.metadata?.url || ""}`;
  if (
    from === "shorts" ||
    type === "ShortsLockupView" ||
    type === "ReelItem" ||
    contentType === "SHORT" ||
    endpointUrl.includes("/shorts/")
  ) {
    return "short";
  }

  const blob = playbackBlob(item, parts);
  const liveBadge = badgeLabels(item).some((label) => /LIVE/i.test(label));
  if (liveBadge || /watching|started streaming/i.test(blob)) return "live";
  if (/streamed/i.test(blob)) return "vod";
  if (from === "live") return durationText(item) ? "vod" : "live";
  return "video";
}

function classifyWatchCopy(published: string, relative: string): Playback {
  const blob = `${published} ${relative}`;
  if (/started streaming|watching/i.test(blob)) return "live";
  if (/streamed/i.test(blob)) return "vod";
  return "video";
}

function flattenResults(nodes: unknown[]): unknown[] {
  const flat: unknown[] = [];
  for (const raw of nodes) {
    const item = asLoose(raw);
    if (!item) continue;
    const type = String(item.type || "");
    const kids = item.contents ?? item.items;
    if (SHELF_TYPES.has(type) && Array.isArray(kids) && kids.length > 0) {
      flat.push(...flattenResults(kids));
      continue;
    }
    flat.push(item);
  }
  return flat;
}

function mapVideoItem(
  raw: unknown,
  from?: "shorts" | "live",
): VideoItem | null {
  const item = asLoose(raw);
  if (!item) return null;

  const id = itemId(item);
  if (!id) return null;

  const type = String(item.type || "");
  const contentType = String(item.content_type || "");
  const playbackHint = inferPlayback(item, [], from);
  const looksVideo =
    playbackHint !== "video" ||
    type === "Video" ||
    type === "Movie" ||
    type === "ShortsLockupView" ||
    type === "ReelItem" ||
    contentType === "VIDEO" ||
    contentType === "SHORT" ||
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

  if (!looksVideo && type === "LockupView" && contentType && contentType !== "VIDEO" && contentType !== "SHORT") {
    return null;
  }

  const parts = metadataParts(item.metadata?.metadata?.metadata_rows);
  const playback = inferPlayback(item, parts, from);
  const watching = parts.find((part) => /watching/i.test(part));
  const viewsLabel =
    watching ||
    textOf(item.view_count) ||
    textOf(item.short_view_count) ||
    textOf(item.overlay_metadata?.secondary_text) ||
    pickPart(parts, /views?/i);
  const published =
    textOf(item.published) ||
    pickPart(parts, /(ago|Streamed|Premiered|hour|day|week|month|year)/i);
  const duration = durationText(item);

  return {
    id,
    title: itemTitle(item),
    description:
      textOf(item.description) || textOf(item.description_snippet) || "",
    channelId: item.author?.id || "",
    channelTitle:
      item.author?.name ||
      pickPart(parts, /^@|channel/i) ||
      parts.find((part) => !/views?|ago|subscribers?|watching/i.test(part)) ||
      "",
    publishedAt: published,
    thumbnail: itemThumb(item) || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    duration: playback === "live" ? undefined : duration || undefined,
    viewCount: watching || digitsFromCount(viewsLabel) || viewsLabel || undefined,
    playback,
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

function videoMatchesSearch(video: VideoItem, type: SearchType) {
  if (type === "short") return video.playback === "short";
  if (type === "live") return video.playback === "live" || video.playback === "vod";
  if (type === "video") return video.playback !== "short";
  return true;
}

function mapSearchResults(rawItems: unknown[], type: SearchType): SearchResult[] {
  const results: SearchResult[] = [];
  const seen = new Set<string>();

  for (const raw of flattenResults(rawItems)) {
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
      kind === "Video" ||
      kind === "Movie" ||
      kind === "ShortsLockupView" ||
      kind === "ReelItem" ||
      contentType === "VIDEO" ||
      contentType === "SHORT"
        ? mapVideoItem(item, type === "short" ? "shorts" : undefined)
        : null;

    if ((type === "all" || type === "channel") && asChannel) {
      if (!seen.has(`channel:${asChannel.id}`)) {
        seen.add(`channel:${asChannel.id}`);
        results.push({ kind: "channel", item: asChannel });
      }
      continue;
    }
    if ((type === "all" || type === "playlist") && asPlaylist) {
      if (!seen.has(`playlist:${asPlaylist.id}`)) {
        seen.add(`playlist:${asPlaylist.id}`);
        results.push({ kind: "playlist", item: asPlaylist });
      }
      continue;
    }
    if ((type === "all" || type === "video" || type === "short" || type === "live") && asVideo) {
      if (videoMatchesSearch(asVideo, type) && !seen.has(`video:${asVideo.id}`)) {
        seen.add(`video:${asVideo.id}`);
        results.push({ kind: "video", item: asVideo });
      }
      continue;
    }

    if (type === "all" || type === "video" || type === "short" || type === "live") {
      const fallbackVideo = mapVideoItem(item, type === "short" ? "shorts" : undefined);
      if (
        fallbackVideo &&
        !asChannel &&
        !asPlaylist &&
        videoMatchesSearch(fallbackVideo, type) &&
        !seen.has(`video:${fallbackVideo.id}`)
      ) {
        seen.add(`video:${fallbackVideo.id}`);
        results.push({ kind: "video", item: fallbackVideo });
      }
    }
  }

  return results.slice(0, MAX_RESULTS);
}

function dedupeVideos(videos: VideoItem[]) {
  const seen = new Set<string>();
  const unique: VideoItem[] = [];
  for (const video of videos) {
    if (seen.has(video.id)) continue;
    seen.add(video.id);
    unique.push(video);
  }
  return unique;
}

export function getYoutubeMode(): YoutubeMode {
  return "live";
}

async function searchShorts(query: string): Promise<SearchResult[]> {
  const yt = await getInnertube();
  const response = await yt.search(query || "shorts", { type: "shorts" });
  return mapSearchResults(response.results ?? [], "short");
}

async function searchLive(query: string): Promise<SearchResult[]> {
  const yt = await getInnertube();
  const q = query || "live";
  const [current, archives] = await Promise.all([
    yt.search(q, { features: ["live"] }).catch(() => null),
    yt.search(query || "livestream", { type: "video" }).catch(() => null),
  ]);

  const liveNow = mapSearchResults(current?.results ?? [], "live").filter(
    (result) => result.kind === "video" && result.item.playback === "live",
  );
  const vods = mapSearchResults(archives?.results ?? [], "live").filter(
    (result) => result.kind === "video" && result.item.playback === "vod",
  );

  const videos = dedupeVideos([
    ...liveNow.map((result) => (result.kind === "video" ? result.item : null)),
    ...vods.map((result) => (result.kind === "video" ? result.item : null)),
  ].filter((video): video is VideoItem => Boolean(video)));

  return videos.slice(0, MAX_RESULTS).map((item) => ({ kind: "video" as const, item }));
}

export async function searchYoutube(
  query: string,
  type: SearchType = "all",
): Promise<ApiEnvelope<SearchResult[]>> {
  const q = query.trim();
  try {
    const yt = await getInnertube();
    if (type === "short") {
      const results = await searchShorts(q);
      if (results.length === 0 && !q) {
        return { mode: "demo", data: demoSearch("", type) };
      }
      return { mode: "live", data: results };
    }
    if (type === "live") {
      const results = await searchLive(q);
      if (results.length === 0 && !q) {
        return { mode: "demo", data: demoSearch("", type) };
      }
      return { mode: "live", data: results };
    }

    const response = await yt.search(q || "popular videos", {
      type: type === "all" ? "all" : type,
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

export async function getHomeRecommendations(): Promise<
  ApiEnvelope<VideoItem[]> & { live: VideoItem[] }
> {
  try {
    const yt = await getInnertube();
    const [popular, liveSearch] = await Promise.all([
      yt.search("popular videos", { type: "video" }),
      yt.search("live", { features: ["live"] }).catch(() => null),
    ]);
    const recommended = (popular.results ?? [])
      .map((item) => mapVideoItem(item))
      .filter((video): video is VideoItem => Boolean(video))
      .filter((video) => video.playback !== "short" && video.playback !== "live");
    const live = (liveSearch?.results ?? [])
      .map((item) => mapVideoItem(item))
      .filter((video): video is VideoItem => Boolean(video && video.playback === "live"));

    const videos = dedupeVideos([...live.slice(0, 4), ...recommended]).slice(0, MAX_RESULTS);
    if (videos.length === 0) {
      const demo = DEMO_VIDEOS.filter((video) => video.playback !== "short");
      return {
        mode: "demo",
        data: demo,
        live: demo.filter((video) => video.playback === "live"),
      };
    }
    return { mode: "live", data: videos, live: dedupeVideos(live).slice(0, 4) };
  } catch (error) {
    const demo = DEMO_VIDEOS.filter((video) => video.playback !== "short");
    return {
      mode: "demo",
      data: demo,
      live: demo.filter((video) => video.playback === "live"),
      error: error instanceof Error ? error.message : "Failed to load recommendations",
    };
  }
}

export async function getPopularVideos(): Promise<ApiEnvelope<VideoItem[]>> {
  try {
    const yt = await getInnertube();
    const response = await yt.search("popular videos", { type: "video" });
    const videos = (response.results ?? [])
      .map((item) => mapVideoItem(item))
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
        const relative = textOf(info.primary_info?.relative_date);
        const publishedDate = textOf(info.primary_info?.published);
        let playback = classifyWatchCopy(publishedDate, relative);
        const published =
          playback === "live" && publishedDate
            ? publishedDate
            : relative && relative !== "N/A"
              ? relative
              : publishedDate || relative;
        const owner = info.secondary_info?.owner;
        const channelId =
          owner?.author?.id ||
          textOf(owner?.endpoint?.payload?.browseId) ||
          "";
        const channelTitle = owner?.author?.name || textOf(owner?.title) || "Unknown channel";
        const description = textOf(info.secondary_info?.description);
        if (playback === "video") {
          try {
            const endpoint = await yt.resolveURL(`https://www.youtube.com/shorts/${id}`);
            const url = endpoint.metadata?.url ?? "";
            if (url.includes("/shorts/") || endpoint.name === "reelWatchEndpoint") {
              playback = "short";
            }
          } catch {
            // A failed shorts lookup keeps the landscape player.
          }
        }

        videos.push({
          id,
          title,
          description,
          channelId,
          channelTitle,
          publishedAt: published,
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          viewCount: digitsFromCount(views) || views || undefined,
          playback,
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
      .map((item) => mapVideoItem(item))
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
      .map((item) => mapVideoItem(item))
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

export async function getChannelShorts(
  channelId: string,
): Promise<ApiEnvelope<VideoItem[]>> {
  const id = channelId.trim();
  if (!id) return { mode: "live", data: [] };

  try {
    const yt = await getInnertube();
    const channel = await yt.getChannel(id);
    if (!channel.has_shorts) return { mode: "live", data: [] };
    const tab = await channel.getShorts();
    const videos = (tab.videos ?? [])
      .map((video) => mapVideoItem(video, "shorts"))
      .filter((video): video is VideoItem => Boolean(video))
      .slice(0, MAX_RESULTS);

    return { mode: "live", data: videos };
  } catch (error) {
    return {
      mode: "demo",
      data: demoChannelShorts(id),
      error:
        error instanceof Error ? error.message : "Failed to load channel Shorts",
    };
  }
}

export async function getChannelLive(
  channelId: string,
): Promise<ApiEnvelope<VideoItem[]>> {
  const id = channelId.trim();
  if (!id) return { mode: "live", data: [] };

  try {
    const yt = await getInnertube();
    const channel = await yt.getChannel(id);
    if (!channel.has_live_streams) return { mode: "live", data: [] };
    const tab = await channel.getLiveStreams();
    const videos = dedupeVideos(
      (tab.videos ?? [])
        .map((video) => mapVideoItem(video, "live"))
        .filter((video): video is VideoItem => Boolean(video)),
    )
      .sort((a, b) => {
        if (a.playback === b.playback) return 0;
        if (a.playback === "live") return -1;
        if (b.playback === "live") return 1;
        return 0;
      })
      .slice(0, MAX_RESULTS);

    return { mode: "live", data: videos };
  } catch (error) {
    return {
      mode: "demo",
      data: demoChannelLive(id),
      error:
        error instanceof Error
          ? error.message
          : "Failed to load channel livestreams",
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
      .map((item) => mapVideoItem(item))
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
