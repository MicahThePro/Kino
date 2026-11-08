import Image from "next/image";
import { notFound } from "next/navigation";
import { ChannelTabs } from "@/components/channel-tabs";
import { ModeBanner } from "@/components/mode-banner";
import { PlaylistCard } from "@/components/playlist-card";
import { SiteHeader } from "@/components/site-header";
import { VideoGrid } from "@/components/video-grid";
import {
  getChannelLive,
  getChannelPlaylists,
  getChannelShorts,
  getChannelUploads,
  getChannels,
} from "@/lib/youtube/client";
import { formatCount, formatSubscribers } from "@/lib/youtube/format";
import type { ChannelTab } from "@/lib/youtube/types";

type ChannelPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
};

function channelTab(value?: string): ChannelTab {
  if (value === "shorts" || value === "live") return value;
  return "videos";
}

export async function generateMetadata({ params }: ChannelPageProps) {
  const { id } = await params;
  const channels = await getChannels(id);
  return {
    title: channels.data[0]?.title ?? "Channel",
  };
}

export default async function ChannelPage({ params, searchParams }: ChannelPageProps) {
  const { id } = await params;
  const tab = channelTab((await searchParams).tab);
  const channelId = decodeURIComponent(id);

  const [channelResult, uploads, shorts, live, playlists] = await Promise.all([
    getChannels(channelId),
    tab === "videos" ? getChannelUploads(channelId) : Promise.resolve(null),
    tab === "shorts" ? getChannelShorts(channelId) : Promise.resolve(null),
    tab === "live" ? getChannelLive(channelId) : Promise.resolve(null),
    tab === "videos" ? getChannelPlaylists(channelId) : Promise.resolve(null),
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
          error={
            channelResult.error ||
            uploads?.error ||
            shorts?.error ||
            live?.error ||
            playlists?.error
          }
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

        <ChannelTabs channelId={channel.id} active={tab} />

        {tab === "videos" ? (
          <section className="mb-12 space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
              Videos
            </h2>
            <VideoGrid videos={uploads?.data ?? []} />
          </section>
        ) : null}

        {tab === "shorts" ? (
          <section className="mb-12 space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
              Shorts
            </h2>
            <VideoGrid
              videos={shorts?.data ?? []}
              variant="shorts"
              empty="No Shorts here yet."
            />
          </section>
        ) : null}

        {tab === "live" ? (
          <section className="mb-12 space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
              Live
            </h2>
            <VideoGrid
              videos={live?.data ?? []}
              empty="No livestreams here yet."
            />
          </section>
        ) : null}

        {playlists && playlists.data.length > 0 ? (
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
