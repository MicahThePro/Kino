import { NextResponse } from "next/server";
import { clientKey, rateLimit } from "@/lib/youtube/rate-limit";
import { getShortsFeed } from "@/lib/youtube/shorts-feed";

export async function GET(request: Request) {
  const limited = rateLimit(`shorts:${clientKey(request)}`);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const after = new URL(request.url).searchParams.get("after")?.slice(0, 32);
  return NextResponse.json(await getShortsFeed(after || undefined));
}
