import Image from "next/image";
import Link from "next/link";
import { PlaybackBadge } from "@/components/playback-badge";
import { formatDuration, formatPublished, formatViews } from "@/lib/youtube/format";
import type { VideoItem } from "@/lib/youtube/types";

export function VideoCard({
  video,
  playlistId,
  thumb = "auto",
}: {
  video: VideoItem;
  playlistId?: string;
  thumb?: "auto" | "landscape";
}) {
  const href = playlistId
    ? `/watch?v=${encodeURIComponent(video.id)}&list=${encodeURIComponent(playlistId)}`
    : `/watch?v=${encodeURIComponent(video.id)}`;

  const meta = [
    formatViews(video.viewCount),
    formatPublished(video.publishedAt),
  ].filter(Boolean);
  const vertical = thumb === "auto" && video.playback === "short";

  return (
    <Link
      href={href}
      className="group block animate-kino-rise outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--kino-accent)]"
    >
      <div
        className={
          vertical
            ? "relative aspect-[9/16] overflow-hidden rounded-2xl bg-[color:var(--kino-wash)]"
            : "relative aspect-video overflow-hidden rounded-2xl bg-[color:var(--kino-wash)]"
        }
      >
        {video.thumbnail ? (
          <Image
            src={video.thumbnail}
            alt=""
            fill
            sizes={
              vertical
                ? "(max-width: 640px) 50vw, 20vw"
                : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            }
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : null}
        {video.playback !== "live" ? (
          <PlaybackBadge playback={video.playback} className="absolute top-2 left-2" />
        ) : null}
        {video.duration && video.playback !== "live" ? (
          <span className="absolute right-2 bottom-2 rounded-md bg-black/75 px-1.5 py-0.5 font-mono text-[11px] font-medium text-white">
            {formatDuration(video.duration)}
          </span>
        ) : null}
      </div>
      <div className="mt-3 space-y-1 px-0.5">
        {video.playback === "live" ? <PlaybackBadge playback="live" /> : null}
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-[color:var(--kino-ink)] transition-colors group-hover:text-[color:var(--kino-accent)]">
          {video.title}
        </h3>
        {video.channelTitle ? (
          <p className="truncate text-sm text-[color:var(--kino-muted)]">
            {video.channelTitle}
          </p>
        ) : null}
        {meta.length > 0 ? (
          <p className="text-xs text-[color:var(--kino-muted)]">{meta.join(" · ")}</p>
        ) : null}
      </div>
    </Link>
  );
}
