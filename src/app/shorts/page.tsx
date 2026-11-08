import { ShortsFeed } from "@/components/shorts-feed";
import { getShortsFeed } from "@/lib/youtube/shorts-feed";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Shorts",
};

export default async function ShortsPage() {
  const feed = await getShortsFeed();
  return <ShortsFeed initial={feed} />;
}
