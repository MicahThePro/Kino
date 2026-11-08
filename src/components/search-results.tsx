import { ChannelCard } from "@/components/channel-card";
import { PlaylistCard } from "@/components/playlist-card";
import { VideoCard } from "@/components/video-card";
import type { SearchResult } from "@/lib/youtube/types";

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

  const videos = results.filter((result) => result.kind === "video");
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

      {videos.length > 0 ? (
        <section className="space-y-4">
          <h2 className="text-sm font-semibold tracking-wide text-[color:var(--kino-muted)] uppercase">
            Videos
          </h2>
          <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {videos.map((result) => (
              <VideoCard key={result.item.id} video={result.item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
