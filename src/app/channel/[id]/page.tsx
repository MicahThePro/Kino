import Image from "next/image";
import { notFound } from "next/navigation";
import { ModeBanner } from "@/components/mode-banner";
import { PlaylistCard } from "@/components/playlist-card";
import { SiteHeader } from "@/components/site-header";
import { VideoGrid } from "@/components/video-grid";
import {
  getChannelPlaylists,
  getChannelUploads,
  getChannels,
} from "@/lib/youtube/client";
import { formatCount, formatSubscribers } from "@/lib/youtube/format";

type ChannelPageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: ChannelPageProps) {
  const { id } = await params;
  const channels = await getChannels(id);
  return {
    title: channels.data[0]?.title ?? "Channel",
  };
}

export default async function ChannelPage({ params }: ChannelPageProps) {
  const { id } = await params;
  const channelId = decodeURIComponent(id);

  const [channelResult, uploads, playlists] = await Promise.all([
    getChannels(channelId),
    getChannelUploads(channelId),
    getChannelPlaylists(channelId),
  ]);

  const channel = channelResult.data[0];
  if (!channel) notFound();

  const meta = [
    formatSubscribers(channel.subscriberCount),
    channel.videoCount ? `${formatCount(channel.videoCount)} videos` : null,
  ].filter(Boolean);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <ModeBanner
          mode={channelResult.mode}
          error={channelResult.error || uploads.error || playlists.error}
        />

        <section className="mb-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center animate-kino-in">
          <div className="relative size-24 shrink-0 overflow-hidden rounded-full bg-[color:var(--kino-wash)] ring-1 ring-[color:var(--kino-line)] sm:size-28">
            {channel.thumbnail ? (
              <Image
                src={channel.thumbnail}
                alt=""
                fill
                sizes="112px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0 space-y-2">
            <h1 className="font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-[color:var(--kino-ink)] sm:text-4xl">
              {channel.title}
            </h1>
            {channel.customUrl ? (
              <p className="text-sm text-[color:var(--kino-muted)]">
                {channel.customUrl}
              </p>
            ) : null}
            {meta.length > 0 ? (
              <p className="text-sm text-[color:var(--kino-muted)]">
                {meta.join(" · ")}
              </p>
            ) : null}
            {channel.description ? (
              <p className="max-w-3xl text-sm leading-relaxed text-[color:var(--kino-muted)] line-clamp-3">
                {channel.description}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mb-12 space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
            Videos
          </h2>
          <VideoGrid videos={uploads.data} />
        </section>

        {playlists.data.length > 0 ? (
          <section className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
              Playlists
            </h2>
            <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {playlists.data.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          </section>
        ) : null}
      </main>
    </>
  );
}
