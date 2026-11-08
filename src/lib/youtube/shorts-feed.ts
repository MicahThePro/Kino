import { demoShortsFeed } from "./demo-data";
import { getInnertube } from "./innertube";
import { searchYoutube } from "./client";
import type { VideoItem, YoutubeMode } from "./types";

export type ShortsFeed = {
  mode: YoutubeMode;
  items: VideoItem[];
  error?: string;
};

function shortItem(id: string, extra?: Partial<VideoItem>): VideoItem {
  return {
    id,
    title: extra?.title || "Short",
    description: extra?.description || "",
    channelId: extra?.channelId || "",
    channelTitle: extra?.channelTitle || "",
    publishedAt: extra?.publishedAt || "",
    thumbnail: extra?.thumbnail || `https://i.ytimg.com/vi/${id}/oardefault.jpg`,
    viewCount: extra?.viewCount,
    playback: "short",
  };
}

function dedupe(items: VideoItem[]) {
  const seen = new Set<string>();
  const unique: VideoItem[] = [];
  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
}

async function reelFrom(id: string): Promise<VideoItem[]> {
  const yt = await getInnertube();
  const info = await yt.getShortsVideoInfo(id);
  const ids = (info.watch_next_feed ?? [])
    .map((endpoint) => String(endpoint.payload?.videoId || "").trim())
    .filter(Boolean);

  if (info.wn_has_continuation) {
    try {
      const next = await info.getWatchNextContinuation();
      for (const endpoint of next.watch_next_feed ?? []) {
        const videoId = String(endpoint.payload?.videoId || "").trim();
        if (videoId) ids.push(videoId);
      }
    } catch {
      // The first reel page is enough when the continuation fails.
    }
  }

  return ids.filter((videoId) => videoId !== id).map((videoId) => shortItem(videoId));
}

async function enrich(items: VideoItem[]): Promise<VideoItem[]> {
  const missing = items.filter((item) => item.title === "Short" || !item.channelTitle);
  await Promise.all(
    missing.slice(0, 8).map(async (item) => {
      try {
        const url = `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${item.id}`)}&format=json`;
        const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
        if (!response.ok) return;
        const data = (await response.json()) as {
          title?: string;
          author_name?: string;
          thumbnail_url?: string;
        };
        if (data.title) item.title = data.title;
        if (data.author_name) item.channelTitle = data.author_name;
        if (data.thumbnail_url?.includes("i.ytimg.com")) item.thumbnail = data.thumbnail_url;
      } catch {
        // Keep the placeholder title when oEmbed is unavailable.
      }
    }),
  );
  return items;
}

export async function getShortsFeed(after?: string): Promise<ShortsFeed> {
  const cursor = after?.trim();
  try {
    if (!cursor) {
      const search = await searchYoutube("shorts", "short");
      const seeded = search.data.flatMap((result) =>
        result.kind === "video" && result.item.playback === "short" ? [result.item] : [],
      );
      const seed = seeded[0]?.id;
      const sequence = seed ? await reelFrom(seed).catch(() => []) : [];
      const items = dedupe([...seeded.slice(0, 6), ...sequence]).slice(0, 12);
      if (items.length === 0) {
        return { mode: "demo", items: demoShortsFeed(), error: search.error };
      }
      return { mode: sequence.length > 0 ? "live" : search.mode, items: await enrich(items) };
    }

    const sequence = await reelFrom(cursor);
    const items = dedupe(sequence).slice(0, 12);
    if (items.length === 0) {
      return { mode: "demo", items: demoShortsFeed(cursor) };
    }
    return { mode: "live", items: await enrich(items) };
  } catch (error) {
    return {
      mode: "demo",
      items: demoShortsFeed(cursor),
      error: error instanceof Error ? error.message : "Failed to load Shorts",
    };
  }
}
