import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/youtube/rate-limit";
import { getShortsFeed } from "@/lib/youtube/shorts-feed";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = rateLimit(`shorts:${clientKey(request)}`);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const { searchParams } = new URL(request.url);
  const seed = Number(searchParams.get("seed"));
  const after = searchParams.get("after")?.slice(0, 32) || undefined;
  const exclude = (searchParams.get("exclude") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 80);

  const feed = await getShortsFeed({
    seed: Number.isFinite(seed) ? seed : undefined,
    after,
    exclude,
  });

  return NextResponse.json(feed, {
    headers: { "Cache-Control": "no-store" },
  });
}
