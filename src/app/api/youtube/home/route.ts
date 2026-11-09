import { NextResponse } from "next/server";
import { loadCachedHome } from "@/components/home-feed";

export const revalidate = 45;

export async function GET() {
  const feed = await loadCachedHome();
  return NextResponse.json(feed, {
    headers: { "Cache-Control": "public, s-maxage=45, stale-while-revalidate=120" },
  });
}
