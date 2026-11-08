import Image from "next/image";
import Link from "next/link";
import { formatCount, formatSubscribers } from "@/lib/youtube/format";
import type { ChannelItem } from "@/lib/youtube/types";

export function ChannelCard({ channel }: { channel: ChannelItem }) {
  const meta = [
    formatSubscribers(channel.subscriberCount),
    channel.videoCount
      ? `${formatCount(channel.videoCount)} videos`
      : null,
  ].filter(Boolean);

  return (
    <Link
      href={`/channel/${encodeURIComponent(channel.id)}`}
      className="group flex items-center gap-4 rounded-2xl px-2 py-3 outline-none transition-colors hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-[color:var(--kino-accent)] animate-kino-rise"
    >
      <div className="relative size-16 shrink-0 overflow-hidden rounded-full bg-[color:var(--kino-wash)] ring-1 ring-[color:var(--kino-line)]">
        {channel.thumbnail ? (
          <Image
            src={channel.thumbnail}
            alt=""
            fill
            sizes="64px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
      </div>
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-[color:var(--kino-ink)] group-hover:text-[color:var(--kino-accent)]">
          {channel.title}
        </h3>
        {channel.customUrl ? (
          <p className="truncate text-sm text-[color:var(--kino-muted)]">
            {channel.customUrl}
          </p>
        ) : null}
        {meta.length > 0 ? (
          <p className="mt-0.5 text-xs text-[color:var(--kino-muted)]">
            {meta.join(" · ")}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
