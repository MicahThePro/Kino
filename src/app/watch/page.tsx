import Link from "next/link";
import { notFound } from "next/navigation";
import { ModeBanner } from "@/components/mode-banner";
import { PlayerEmbed } from "@/components/player-embed";
import { SiteHeader } from "@/components/site-header";
import { VideoCard } from "@/components/video-card";
import {
  getPlaylistItems,
  getRelatedVideos,
  getVideos,
} from "@/lib/youtube/client";
import {
  formatPublished,
  formatViews,
} from "@/lib/youtube/format";

type WatchPageProps = {
  searchParams: Promise<{ v?: string; list?: string }>;
};

export async function generateMetadata({ searchParams }: WatchPageProps) {
  const params = await searchParams;
  const id = params.v?.trim();
  if (!id) return { title: "Watch" };
  const videos = await getVideos(id);
  return {
    title: videos.data[0]?.title ?? "Watch",
  };
}

export default async function WatchPage({ searchParams }: WatchPageProps) {
  const params = await searchParams;
  const videoId = params.v?.trim();
  const playlistId = params.list?.trim();

  if (!videoId) notFound();

  const [videoResult, relatedResult, playlistResult] = await Promise.all([
    getVideos(videoId),
    getRelatedVideos(videoId),
    playlistId
      ? getPlaylistItems(playlistId)
      : Promise.resolve({ mode: "demo" as const, data: [], error: undefined }),
  ]);

  const video = videoResult.data[0];
  if (!video) notFound();

  const meta = [
    formatViews(video.viewCount),
    formatPublished(video.publishedAt),
  ].filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <ModeBanner
          mode={videoResult.mode}
          error={videoResult.error || relatedResult.error}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="min-w-0 space-y-4">
            <PlayerEmbed
              videoId={video.id}
              playlistId={playlistId}
              title={video.title}
            />

            <div className="animate-kino-rise space-y-3">
              <h1 className="font-[family-name:var(--font-display)] text-2xl leading-tight font-bold text-[color:var(--kino-ink)] sm:text-3xl">
                {video.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[color:var(--kino-muted)]">
                {video.channelId ? (
                  <Link
                    href={`/channel/${encodeURIComponent(video.channelId)}`}
                    className="font-semibold text-[color:var(--kino-ink)] hover:text-[color:var(--kino-accent)]"
                  >
                    {video.channelTitle}
                  </Link>
                ) : (
                  <span className="font-semibold text-[color:var(--kino-ink)]">
                    {video.channelTitle}
                  </span>
                )}
                {meta.length > 0 ? <span>{meta.join(" · ")}</span> : null}
              </div>
              {video.description ? (
                <p className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-2xl bg-white/70 p-4 text-sm leading-relaxed text-[color:var(--kino-muted)]">
                  {video.description}
                </p>
              ) : null}
            </div>
          </section>

          <aside className="space-y-6">
            {playlistId && playlistResult.data.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[color:var(--kino-ink)]">
                    Playlist
                  </h2>
                  <Link
                    href={`/playlist/${encodeURIComponent(playlistId)}`}
                    className="text-sm text-[color:var(--kino-accent)] hover:underline"
                  >
                    Open
                  </Link>
                </div>
                <div className="max-h-[28rem] space-y-4 overflow-y-auto pr-1">
                  {playlistResult.data.map((item) => (
                    <div
                      key={item.id}
                      className={
                        item.id === videoId
                          ? "rounded-2xl ring-2 ring-[color:var(--kino-accent)] ring-offset-2 ring-offset-[color:var(--kino-bg)]"
                          : undefined
                      }
                    >
                      <VideoCard video={item} playlistId={playlistId} />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[color:var(--kino-ink)]">
                Up next
              </h2>
              <div className="space-y-4">
                {relatedResult.data.map((item) => (
                  <VideoCard key={item.id} video={item} />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
