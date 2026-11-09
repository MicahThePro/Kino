import { demoShortsFeed } from "./demo-data";
import { getInnertube } from "./innertube";
import { searchYoutube } from "./client";
import type { VideoItem, YoutubeMode } from "./types";

export type ShortsFeed = {
  mode: YoutubeMode;
  items: VideoItem[];
  error?: string;
};

const SEEDS = [
  "funny",
  "music",
  "cooking",
  "travel",
  "animals",
  "sports",
  "science",
  "art",
  "dance",
  "diy",
  "gaming",
  "nature",
  "basketball",
  "piano",
  "space",
  "recipes",
  "comedy",
  "cats",
  "soccer",
];

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

export function dedupeShorts(items: VideoItem[]) {
  const seen = new Set<string>();
  const unique: VideoItem[] = [];
  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    unique.push(item);
  }
  return unique;
}

function shuffle<T>(items: T[], seed: number) {
  const copy = [...items];
  let state = seed >>> 0 || 1;
  for (let index = copy.length - 1; index > 0; index -= 1) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const swap = state % (index + 1);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function preferFresh(items: VideoItem[], exclude: Set<string>) {
  const fresh = items.filter((item) => !exclude.has(item.id));
  const seen = items.filter((item) => exclude.has(item.id));
  return [...fresh, ...seen];
}

function idsFromReel(info: { watch_next_feed?: Array<{ payload?: { videoId?: string } }> }) {
  const ids: string[] = [];
  for (const endpoint of info.watch_next_feed ?? []) {
    const id = String(endpoint.payload?.videoId || "").trim();
    if (id) ids.push(id);
  }
  return ids;
}

async function reelFrom(startId: string, exclude: Set<string>) {
  const yt = await getInnertube();
  const info = await yt.getShortsVideoInfo(startId);
  const ids: string[] = [];
  const take = () => {
    for (const id of idsFromReel(info)) {
      if (id === startId || exclude.has(id) || ids.includes(id)) continue;
      ids.push(id);
    }
  };
  take();
  let hops = 0;
  while (ids.length < 6 && info.wn_has_continuation && hops < 4) {
    await info.getWatchNextContinuation();
    hops += 1;
    take();
  }
  return ids.slice(0, 8).map((id) => shortItem(id));
}

async function searchSeed(seed: number, exclude: Set<string>) {
  const first = SEEDS[Math.abs(seed) % SEEDS.length];
  const second = SEEDS[Math.abs(seed * 3 + 5) % SEEDS.length];
  const [primary, extra] = await Promise.all([
    searchYoutube(first, "short"),
    first === second ? Promise.resolve(null) : searchYoutube(second, "short"),
  ]);
  const items = dedupeShorts(
    [primary, extra]
      .flatMap((result) => result?.data ?? [])
      .flatMap((result) =>
        result.kind === "video" && result.item.playback === "short" ? [result.item] : [],
      ),
  );
  const ordered = preferFresh(shuffle(items, seed), exclude);
  const mode: YoutubeMode =
    primary.mode === "demo" && (!extra || extra.mode === "demo") ? "demo" : "live";
  return {
    mode,
    items: ordered.slice(0, 10),
    error: primary.error || extra?.error,
  };
}

export async function getShortsFeed(options?: {
  seed?: number;
  exclude?: string[];
  after?: string;
}): Promise<ShortsFeed> {
  const seed = Number.isFinite(options?.seed) ? Number(options?.seed) : Date.now();
  const exclude = new Set((options?.exclude ?? []).map((id) => id.trim()).filter(Boolean));
  const after = options?.after?.trim();

  try {
    if (after) {
      const reel = await reelFrom(after, exclude);
      if (reel.length > 0) return { mode: "live", items: dedupeShorts(reel) };
      const fallback = await searchSeed(seed + exclude.size, exclude);
      const fresh = fallback.items.filter((item) => item.id !== after && !exclude.has(item.id));
      if (fresh.length > 0) return { mode: fallback.mode, items: dedupeShorts(fresh), error: fallback.error };
      return { mode: "demo", items: demoShortsFeed(after).filter((item) => !exclude.has(item.id)) };
    }

    const searched = await searchSeed(seed, exclude);
    if (searched.items.length === 0) {
      return { mode: "demo", items: demoShortsFeed(), error: searched.error || "No Shorts returned" };
    }
    return searched;
  } catch (error) {
    return {
      mode: "demo",
      items: demoShortsFeed(after),
      error: error instanceof Error ? error.message : "Failed to load Shorts",
    };
  }
}
