import { NextResponse } from "next/server";
import {
  getChannelPlaylists,
  getChannelUploads,
  getChannels,
} from "@/lib/youtube/client";
import { clientKey, rateLimit } from "@/lib/youtube/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(`channels:${clientKey(request)}`);
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
  const uploadsFor = (searchParams.get("uploads") ?? "").slice(0, 64);
  const playlistsFor = (searchParams.get("playlists") ?? "").slice(0, 64);

  if (uploadsFor) {
    return NextResponse.json(await getChannelUploads(uploadsFor));
  }

  if (playlistsFor) {
    return NextResponse.json(await getChannelPlaylists(playlistsFor));
  }

  if (!ids) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  return NextResponse.json(await getChannels(ids));
}
