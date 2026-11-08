import { NextResponse } from "next/server";
import { searchYoutube } from "@/lib/youtube/client";
import { clientKey, rateLimit } from "@/lib/youtube/rate-limit";
import type { SearchType } from "@/lib/youtube/types";

export async function GET(request: Request) {
  const limited = rateLimit(`search:${clientKey(request)}`);
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
  const q = (searchParams.get("q") ?? "").slice(0, 120);
  const typeParam = searchParams.get("type") ?? "all";
  const type: SearchType =
    typeParam === "video" || typeParam === "channel" || typeParam === "playlist"
      ? typeParam
      : "all";

  const result = await searchYoutube(q, type);
  return NextResponse.json(result);
}
