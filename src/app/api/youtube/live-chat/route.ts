import { NextResponse } from "next/server";
import { readLiveChat } from "@/lib/youtube/live-chat";
import { clientKey, rateLimit } from "@/lib/youtube/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(`live-chat:${clientKey(request)}`);
  if (!limited.ok) {
    return NextResponse.json(
      { messages: [], live: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }
  const videoId = new URL(request.url).searchParams.get("v")?.trim().slice(0, 32) ?? "";
  if (!videoId) return NextResponse.json({ messages: [], live: false, error: "Missing v" }, { status: 400 });
  const chat = await readLiveChat(videoId);
  return NextResponse.json(chat, { headers: { "Cache-Control": "no-store" } });
}
