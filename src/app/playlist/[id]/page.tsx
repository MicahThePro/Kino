import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ModeBanner } from "@/components/mode-banner";
import { VideoGrid } from "@/components/video-grid";
import { getPlaylistItems, getPlaylists } from "@/lib/youtube/client";

type PlaylistPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PlaylistPageProps) {
  const { id } = await params;
  const playlists = await getPlaylists(id);
  return {
    title: playlists.data[0]?.title ?? "Playlist",
  };
}

export default async function PlaylistPage({ params }: PlaylistPageProps) {
  const { id } = await params;
  const playlistId = decodeURIComponent(id);

  const [playlistResult, items] = await Promise.all([
    getPlaylists(playlistId),
    getPlaylistItems(playlistId),
  ]);

  const playlist = playlistResult.data[0];
  if (!playlist && items.data.length === 0) notFound();

  const title = playlist?.title ?? "Playlist";
  const firstVideo = items.data[0];

  return (
    <>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <ModeBanner
          mode={playlistResult.mode}
          error={playlistResult.error || items.error}
        />

        <section className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-[280px_minmax(0,1fr)] animate-kino-in">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-[color:var(--kino-wash)] md:aspect-square">
            {(playlist?.thumbnail || firstVideo?.thumbnail) && (
              <Image
                src={playlist?.thumbnail || firstVideo!.thumbnail}
                alt=""
                fill
                sizes="280px"
                className="object-cover"
              />
            )}
          </div>
          <div className="flex flex-col justify-end space-y-3">
            <p className="text-sm font-semibold tracking-wide text-[color:var(--kino-accent)] uppercase">
              Playlist
            </p>
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[color:var(--kino-ink)] sm:text-4xl">
              {title}
            </h1>
            {playlist?.channelId ? (
              <Link
                href={`/channel/${encodeURIComponent(playlist.channelId)}`}
                className="text-sm font-medium text-[color:var(--kino-ink)] hover:text-[color:var(--kino-accent)]"
              >
                {playlist.channelTitle}
              </Link>
            ) : playlist?.channelTitle ? (
              <p className="text-sm text-[color:var(--kino-muted)]">
                {playlist.channelTitle}
              </p>
            ) : null}
            <p className="text-sm text-[color:var(--kino-muted)]">
              {items.data.length || playlist?.itemCount || 0} videos
            </p>
            {playlist?.description ? (
              <p className="max-w-2xl text-sm leading-relaxed text-[color:var(--kino-muted)] line-clamp-4">
                {playlist.description}
              </p>
            ) : null}
            {firstVideo ? (
              <div className="pt-2">
                <Link
                  href={`/watch?v=${encodeURIComponent(firstVideo.id)}&list=${encodeURIComponent(playlistId)}`}
                  className="inline-flex h-10 items-center rounded-full bg-[color:var(--kino-accent)] px-5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
                >
                  Play all
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
            Videos
          </h2>
          <VideoGrid videos={items.data} playlistId={playlistId} />
        </section>
      </main>
    </>
  );
}
