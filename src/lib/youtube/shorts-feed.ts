import { unstable_cache } from "next/cache";
import { demoShortsFeed } from "./demo-data";
import { getInnertube } from "./innertube";
import { searchYoutube } from "./client";
import type { VideoItem, YoutubeMode } from "./types";

export type ShortsFeed = {
  mode: YoutubeMode;
  items: VideoItem[];
  error?: string;
};

const FIRST_TTL_MS = 60_000;

let firstMemory: { exp: number; feed: ShortsFeed } | null = null;
let firstInflight: Promise<ShortsFeed> | null = null;
const moreMemory = new Map<string, { exp: number; feed: ShortsFeed }>();

function shortItem(id: string, extra?: Partial<VideoItem>): VideoItem {
  return {
    id,
    title: extra?.title && extra.title !== "Short" ? extra.title : extra?.title || "",
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

async function loadFirstUncached(): Promise<ShortsFeed> {
  const search = await searchYoutube("shorts", "short");
  const seeded = search.data.flatMap((result) =>
    result.kind === "video" && result.item.playback === "short" ? [result.item] : [],
  );
  if (seeded.length === 0) {
    return {
      mode: "demo",
      items: demoShortsFeed(),
      error: search.error || "No Shorts returned",
    };
  }
  return { mode: search.mode, items: seeded.slice(0, 8), error: search.error };
}

const loadFirstCached = unstable_cache(loadFirstUncached, ["kino-shorts-first-v2"], {
  revalidate: 60,
});

async function loadFirst(): Promise<ShortsFeed> {
  if (firstMemory && firstMemory.exp > Date.now()) return firstMemory.feed;
  if (!firstInflight) {
    firstInflight = loadFirstCached()
      .then((feed) => {
        const ttl = feed.mode === "live" ? FIRST_TTL_MS : 10_000;
        firstMemory = { exp: Date.now() + ttl, feed };
        return feed;
      })
      .finally(() => {
        firstInflight = null;
      });
  }
  return firstInflight;
}

async function reelFrom(id: string): Promise<VideoItem[]> {
  const yt = await getInnertube();
  const info = await yt.getShortsVideoInfo(id);
  const ids = (info.watch_next_feed ?? [])
    .map((endpoint) => String(endpoint.payload?.videoId || "").trim())
    .filter((videoId) => videoId && videoId !== id);
  return [...new Set(ids)].slice(0, 8).map((videoId) => shortItem(videoId));
}

export async function getShortsFeed(after?: string): Promise<ShortsFeed> {
  const cursor = after?.trim();
  try {
    if (!cursor) return await loadFirst();

    const cached = moreMemory.get(cursor);
    if (cached && cached.exp > Date.now()) return cached.feed;

    const sequence = dedupe(await reelFrom(cursor));
    const feed: ShortsFeed =
      sequence.length > 0
        ? { mode: "live", items: sequence }
        : { mode: "demo", items: demoShortsFeed(cursor) };
    moreMemory.set(cursor, {
      exp: Date.now() + (feed.mode === "live" ? 30_000 : 10_000),
      feed,
    });
    return feed;
  } catch (error) {
    return {
      mode: "demo",
      items: demoShortsFeed(cursor),
      error: error instanceof Error ? error.message : "Failed to load Shorts",
    };
  }
}
