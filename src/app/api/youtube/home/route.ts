import { NextResponse } from "next/server";
import { loadCachedHome, loadFreshHome } from "@/components/home-feed";
import { getTunedHome } from "@/lib/youtube/tuned-feed";

function topicsFrom(values: string[]) {
  return values.map((topic) => topic.trim().slice(0, 40)).filter(Boolean).slice(0, 8);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topics = topicsFrom(searchParams.getAll("topics"));
  if (topics.length === 0) {
    const fresh = searchParams.get("fresh") === "1";
    const feed = fresh ? await loadFreshHome() : await loadCachedHome();
    return NextResponse.json(
      { ...feed, videos: feed.data, cursors: {} },
      { headers: { "Cache-Control": fresh ? "no-store" : "public, s-maxage=45, stale-while-revalidate=120" } },
    );
  }

  const feed = await getTunedHome({
    topics,
    only: searchParams.get("only") || undefined,
    exclude: (searchParams.get("exclude") ?? "").split(",").filter(Boolean).slice(0, 80),
  });
  return NextResponse.json(feed, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    topics?: string[];
    only?: string;
    cursors?: Record<string, string>;
    exclude?: string[];
  };
  const topics = topicsFrom(body.topics ?? []);
  if (topics.length === 0) {
    const feed = await loadCachedHome();
    return NextResponse.json({ ...feed, videos: feed.data, cursors: {} });
  }
  const feed = await getTunedHome({
    topics,
    only: body.only,
    cursors: body.cursors,
    exclude: body.exclude,
  });
  return NextResponse.json(feed, { headers: { "Cache-Control": "no-store" } });
}
