import { PlaybackBadge } from "@/components/playback-badge";
import type { Playback } from "@/lib/youtube/types";

type PlayerEmbedProps = {
  videoId: string;
  playlistId?: string;
  title: string;
  playback?: Playback;
};

export function PlayerEmbed({ videoId, playlistId, title, playback }: PlayerEmbedProps) {
  const params = new URLSearchParams({
    autoplay: "1",
    rel: "0",
    modestbranding: "1",
  });

  // Demo playlist ids are local-only and are not valid on youtube.com embeds.
  const embedList =
    playlistId && !playlistId.startsWith("PLDemo") ? playlistId : undefined;

  const watchSrc = embedList
    ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?list=${encodeURIComponent(embedList)}&${params}`
    : `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params}`;

  const vertical = playback === "short";
  const frameTitle =
    playback === "live" ? `${title} (live)` : playback === "short" ? `${title} (Short)` : title;

  return (
    <div className={vertical ? "mx-auto w-[min(100%,calc(78dvh*9/16))] animate-kino-in" : "animate-kino-in"}>
      {playback === "live" ? (
        <div className="mb-2">
          <PlaybackBadge playback="live" />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl bg-black shadow-[0_24px_60px_-28px_rgba(20,16,12,0.55)]">
        <div className={vertical ? "relative aspect-[9/16] w-full" : "relative aspect-video w-full"}>
          <iframe
            key={`${videoId}-${playlistId ?? ""}-${playback ?? "video"}`}
            src={watchSrc}
            title={frameTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
