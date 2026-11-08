import { ChannelCard } from "@/components/channel-card";
import { PlaylistCard } from "@/components/playlist-card";
import { VideoGrid } from "@/components/video-grid";
import type { SearchResult, VideoItem } from "@/lib/youtube/types";

export function SearchResults({ results }: { results: SearchResult[] }) {
  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[color:var(--kino-line)] px-6 py-20 text-center animate-kino-in">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-[color:var(--kino-ink)]">
          Nothing matched
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[color:var(--kino-muted)]">
          Try another phrase, or browse the home feed for something to watch.
        </p>
      </div>
    );
  }

  const videos = results.flatMap((result) =>
    result.kind === "video" ? [result.item] : [],
  );
  const live = videos.filter(
    (video) => video.playback === "live" || video.playback === "vod",
  );
  const shorts = videos.filter((video) => video.playback === "short");
  const regular = videos.filter(
    (video) => !video.playback || video.playback === "video",
  );
  const channels = results.filter((result) => result.kind === "channel");
  const playlists = results.filter((result) => result.kind === "playlist");

  return (
    <div className="space-y-10">
      {channels.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-[color:var(--kino-muted)] uppercase">
            Channels
          </h2>
          <div className="divide-y divide-[color:var(--kino-line)] rounded-2xl border border-[color:var(--kino-line)] bg-white/50 px-2">
            {channels.map((result) => (
              <ChannelCard key={result.item.id} channel={result.item} />
            ))}
          </div>
        </section>
      ) : null}

      {live.length > 0 ? (
        <VideoSection title="Live" videos={orderLive(live)} />
      ) : null}

      {shorts.length > 0 ? (
        <VideoSection title="Shorts" videos={shorts} variant="shorts" />
      ) : null}

      {regular.length > 0 ? (
        <VideoSection title="Videos" videos={regular} />
      ) : null}

      {playlists.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-[color:var(--kino-muted)] uppercase">
            Playlists
          </h2>
          <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((result) => (
              <PlaylistCard key={result.item.id} playlist={result.item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function orderLive(videos: VideoItem[]) {
  return [...videos].sort((a, b) => {
    if (a.playback === b.playback) return 0;
    if (a.playback === "live") return -1;
    if (b.playback === "live") return 1;
    return 0;
  });
}

function VideoSection({
  title,
  videos,
  variant = "standard",
}: {
  title: string;
  videos: VideoItem[];
  variant?: "standard" | "shorts";
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold tracking-wide text-[color:var(--kino-muted)] uppercase">
        {title}
      </h2>
      <VideoGrid videos={videos} variant={variant} />
    </section>
  );
}
