import { ModeBanner } from "@/components/mode-banner";
import { SiteHeader } from "@/components/site-header";
import { VideoGrid } from "@/components/video-grid";
import { getPopularVideos } from "@/lib/youtube/client";

export default async function HomePage() {
  const feed = await getPopularVideos();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <section className="mb-8 max-w-2xl animate-kino-in">
          <p className="mb-2 font-[family-name:var(--font-display)] text-sm font-semibold tracking-[0.18em] text-[color:var(--kino-accent)] uppercase">
            Kino
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl leading-none font-extrabold tracking-tight text-[color:var(--kino-ink)] sm:text-5xl">
            Search. Play. Stay awhile.
          </h1>
          <p className="mt-3 max-w-xl text-base text-[color:var(--kino-muted)] sm:text-lg">
            A YouTube-shaped watch surface with search, channels, playlists, and
            embeds — without leaving this tab.
          </p>
        </section>

        <ModeBanner mode={feed.mode} error={feed.error} />

        <section>
          <div className="mb-5 flex items-end justify-between gap-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
              {feed.mode === "live" ? "Trending now" : "Featured watches"}
            </h2>
          </div>
          <VideoGrid videos={feed.data} />
        </section>
      </main>
    </>
  );
}
