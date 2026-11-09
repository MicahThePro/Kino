import { searchFeedPage } from "./client";
import type { VideoItem, YoutubeMode } from "./types";

export type TunedHome = {
  mode: YoutubeMode;
  live: VideoItem[];
  videos: VideoItem[];
  cursors: Record<string, string>;
  error?: string;
};

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

function mixTopics(lists: VideoItem[][], general: VideoItem[]) {
  const mixed: VideoItem[] = [];
  const longest = Math.max(0, ...lists.map((list) => list.length));
  let generalIndex = 0;
  for (let index = 0; index < longest; index += 1) {
    for (const list of lists) {
      if (list[index]) mixed.push(list[index]);
    }
    if (index % 4 === 3 && general[generalIndex]) {
      mixed.push(general[generalIndex]);
      generalIndex += 1;
    }
  }
  while (generalIndex < general.length && mixed.length < 24) {
    mixed.push(general[generalIndex]);
    generalIndex += 1;
  }
  const unique = dedupe(mixed).slice(0, 24);
  for (let index = unique.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [unique[index], unique[swap]] = [unique[swap], unique[index]];
  }
  return unique;
}

function cleanTopics(topics: string[]) {
  const seen = new Set<string>();
  const clean: string[] = [];
  for (const topic of topics) {
    const value = topic.trim().slice(0, 40);
    const key = value.toLowerCase();
    if (!value || seen.has(key)) continue;
    seen.add(key);
    clean.push(value);
  }
  return clean.slice(0, 8);
}

export async function getTunedHome(options: {
  topics?: string[];
  only?: string;
  cursors?: Record<string, string>;
  exclude?: string[];
}): Promise<TunedHome> {
  const topics = cleanTopics(options.topics ?? []);
  const only = options.only?.trim();
  const selected = only && topics.some((topic) => topic.toLowerCase() === only.toLowerCase())
    ? topics.filter((topic) => topic.toLowerCase() === only.toLowerCase())
    : topics;
  const exclude = new Set((options.exclude ?? []).map((id) => id.trim()).filter(Boolean));
  const cursors = options.cursors ?? {};
  const nextCursors: Record<string, string> = {};

  if (selected.length === 0) {
    return { mode: "live", live: [], videos: [], cursors: {} };
  }

  try {
    const videoJobs = selected.map(async (topic) => {
      const page = await searchFeedPage(topic, "video", cursors[topic]);
      if (page.cursor) nextCursors[topic] = page.cursor;
      return page;
    });
    const liveJobs = selected.map(async (topic) => {
      const key = `live:${topic}`;
      const page = await searchFeedPage(topic, "live", cursors[key]);
      if (page.cursor) nextCursors[key] = page.cursor;
      return page;
    });
    const generalJob = searchFeedPage("popular videos", "video", cursors.trending);
    const [videoPages, livePages, general] = await Promise.all([
      Promise.all(videoJobs),
      Promise.all(liveJobs),
      generalJob,
    ]);
    if (general.cursor) nextCursors.trending = general.cursor;

    const videos = mixTopics(
      videoPages.map((page) => page.items.filter((item) => !exclude.has(item.id))),
      only ? general.items.filter((item) => !exclude.has(item.id)).slice(0, 4) : general.items.filter((item) => !exclude.has(item.id)).slice(0, 8),
    );
    const live = dedupe(
      livePages
        .flatMap((page) => page.items)
        .filter((item) => !exclude.has(item.id) && (item.playback === "live" || item.playback === "vod")),
    )
      .sort((a, b) => Number(b.playback === "live") - Number(a.playback === "live"))
      .slice(0, 12);

    const mode: YoutubeMode = videos.length === 0 && live.length === 0 ? "demo" : "live";
    return { mode, live, videos, cursors: nextCursors };
  } catch (error) {
    return {
      mode: "demo",
      live: [],
      videos: [],
      cursors: {},
      error: error instanceof Error ? error.message : "Failed to tune the feed",
    };
  }
}
