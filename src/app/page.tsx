import { ModeBanner } from "@/components/mode-banner";
import { VideoGrid } from "@/components/video-grid";
import { getHomeRecommendations } from "@/lib/youtube/client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const feed = await getHomeRecommendations();
  const liveIds = new Set(feed.live.map((video) => video.id));
  const recommended = feed.data.filter((video) => !liveIds.has(video.id));

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <section className="mb-8 max-w-2xl animate-kino-in">
        <p className="mb-2 font-[family-name:var(--font-display)] text-sm font-semibold tracking-[0.18em] text-[color:var(--kino-accent)] uppercase">
          Kino
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl leading-none font-extrabold tracking-tight text-[color:var(--kino-ink)] sm:text-5xl">
          Search. Play. Stay awhile.
        </h1>
        <p className="mt-3 max-w-xl text-base text-[color:var(--kino-muted)] sm:text-lg">
          Recommended long videos and livestreams, plus a Shorts feed. Nothing
          here is signed in to YouTube, so it is not your personal home page.
        </p>
      </section>

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
    </main>
  );
}
