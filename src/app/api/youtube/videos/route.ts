import { NextResponse } from "next/server";
import { getPopularVideos, getRelatedVideos, getVideos } from "@/lib/youtube/client";
import { clientKey, rateLimit } from "@/lib/youtube/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(`videos:${clientKey(request)}`);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfter) },
      },
    );
  }

  const { searchParams } = new URL(request.url);
  const ids = (searchParams.get("id") ?? "").slice(0, 400);
  const relatedTo = (searchParams.get("relatedTo") ?? "").slice(0, 64);
  const chart = searchParams.get("chart");

  if (relatedTo) {
    return NextResponse.json(await getRelatedVideos(relatedTo));
  }

  if (chart === "mostPopular") {
    return NextResponse.json(await getPopularVideos());
  }

  if (!ids) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  return NextResponse.json(await getVideos(ids));
}
