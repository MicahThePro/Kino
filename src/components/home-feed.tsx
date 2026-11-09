import { unstable_cache } from "next/cache";
import { ModeBanner } from "@/components/mode-banner";
import { VideoGrid } from "@/components/video-grid";
import { getHomeRecommendations } from "@/lib/youtube/client";

const loadHome = unstable_cache(async () => getHomeRecommendations(), ["kino-home-feed-v1"], {
  revalidate: 45,
});

let memory: { exp: number; value: Awaited<ReturnType<typeof getHomeRecommendations>> } | null = null;
let inflight: Promise<Awaited<ReturnType<typeof getHomeRecommendations>>> | null = null;

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export async function loadFreshHome() {
  const feed = await getHomeRecommendations();
  return { ...feed, data: shuffle(feed.data), live: shuffle(feed.live) };
}

export async function loadCachedHome() {
  if (memory && memory.exp > Date.now()) return memory.value;
  if (!inflight) {
    inflight = loadHome()
      .then((value) => {
        memory = { exp: Date.now() + 45_000, value };
        return value;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

export async function HomeFeed() {
  const feed = await loadCachedHome();
  const liveIds = new Set(feed.live.map((video) => video.id));
  const recommended = feed.data.filter((video) => !liveIds.has(video.id));

  return (
    <>
      <ModeBanner mode={feed.mode} error={feed.error} />
      {feed.live.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-5 font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
            Live now
          </h2>
          <VideoGrid videos={feed.live} />
        </section>
      ) : null}
      <section>
        <h2 className="mb-5 font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
          {feed.mode === "live" ? "Recommended" : "Featured watches"}
        </h2>
        <VideoGrid videos={recommended.length > 0 ? recommended : feed.data} />
      </section>
    </>
  );
}

export function HomeFeedSkeleton() {
  return (
    <div className="space-y-8" aria-hidden>
      <div className="h-7 w-32 animate-pulse rounded bg-neutral-200" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="space-y-3">
            <div className="aspect-video animate-pulse rounded-xl bg-neutral-200" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-neutral-200" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
