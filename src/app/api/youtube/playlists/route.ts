import { NextResponse } from "next/server";
import { getPlaylistItems, getPlaylists } from "@/lib/youtube/client";
import { clientKey, rateLimit } from "@/lib/youtube/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(`playlists:${clientKey(request)}`);
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
  const itemsFor = (searchParams.get("items") ?? "").slice(0, 64);

  if (itemsFor) {
    return NextResponse.json(await getPlaylistItems(itemsFor));
  }

  if (!ids) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  return NextResponse.json(await getPlaylists(ids));
}
