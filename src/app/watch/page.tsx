import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentsPanel } from "@/components/comments-panel";
import { LiveChat } from "@/components/live-chat";
import { ModeBanner } from "@/components/mode-banner";
import { PlaybackBadge } from "@/components/playback-badge";
import { PlayerEmbed } from "@/components/player-embed";
import { VideoCard } from "@/components/video-card";
import {
  getPlaylistItems,
  getRelatedVideos,
  getVideos,
  searchYoutube,
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

  let related = relatedResult;
  if (related.mode === "demo" || related.data.length === 0) {
    const search = await searchYoutube(
      video.title.split(/\s+/).slice(0, 5).join(" "),
      "video",
    );
    const items = search.data
      .flatMap((result) => (result.kind === "video" ? [result.item] : []))
      .filter((item) => item.id !== video.id)
      .slice(0, 12);
    if (items.length > 0) {
      related = { mode: search.mode, data: items };
    }
  }

  const meta = [
    formatViews(video.viewCount),
    formatPublished(video.publishedAt),
  ].filter(Boolean);

  return (
    <>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:py-8">
        <ModeBanner mode={videoResult.mode} error={videoResult.error} />

        <div
          className={
            video.playback === "short"
              ? "grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,440px)_minmax(0,1fr)]"
              : video.playback === "live"
                ? "grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]"
                : "grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px]"
          }
        >
          <section className="min-w-0 space-y-4">
            <PlayerEmbed
              videoId={video.id}
              playlistId={playlistId}
              title={video.title}
              playback={video.playback}
            />

            {video.playback === "live" ? (
              <div className="lg:hidden">
                <LiveChat videoId={video.id} />
              </div>
            ) : null}

            <div className="animate-kino-rise space-y-3">
              {video.playback && video.playback !== "video" ? (
                <PlaybackBadge playback={video.playback} />
              ) : null}
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

            <CommentsPanel videoId={video.id} />
          </section>

          <aside className="space-y-6">
            {video.playback === "live" ? (
              <div className="hidden lg:block">
                <LiveChat videoId={video.id} />
              </div>
            ) : null}
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
                      <VideoCard video={item} playlistId={playlistId} thumb="landscape" />
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
                {related.data.map((item) => (
                  <VideoCard key={item.id} video={item} thumb="landscape" />
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
