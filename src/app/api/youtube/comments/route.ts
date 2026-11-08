import { NextResponse } from "next/server";
import { listComments } from "@/lib/youtube/comments";
import { clientKey, rateLimit } from "@/lib/youtube/rate-limit";

export async function GET(request: Request) {
  const limited = rateLimit(`comments:${clientKey(request)}`);
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } },
    );
  }

  const { searchParams } = new URL(request.url);
  const videoId = (searchParams.get("v") ?? "").slice(0, 32);
  const cursor = searchParams.get("cursor")?.slice(0, 2000);
  const replyToken = searchParams.get("replyToken")?.slice(0, 2000);

  if (!videoId && !replyToken) {
    return NextResponse.json({ error: "Missing v" }, { status: 400 });
  }

  return NextResponse.json(await listComments(videoId || "replies", replyToken || cursor || undefined));
}
