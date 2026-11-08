import Image from "next/image";
import Link from "next/link";
import { ListVideo } from "lucide-react";
import type { PlaylistItem } from "@/lib/youtube/types";

export function PlaylistCard({ playlist }: { playlist: PlaylistItem }) {
  return (
    <Link
      href={`/playlist/${encodeURIComponent(playlist.id)}`}
      className="group block animate-kino-rise outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--kino-accent)]"
    >
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-[color:var(--kino-wash)]">
        {playlist.thumbnail ? (
          <Image
            src={playlist.thumbnail}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : null}
        <div className="absolute inset-y-0 right-0 flex w-2/5 flex-col items-center justify-center gap-1 bg-black/65 text-white backdrop-blur-[2px]">
          <ListVideo className="size-6" />
          <span className="text-sm font-semibold">
            {playlist.itemCount ?? "—"}
          </span>
          <span className="text-[10px] tracking-wide uppercase opacity-80">
            videos
          </span>
        </div>
      </div>
      <div className="mt-3 space-y-1 px-0.5">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-[color:var(--kino-ink)] group-hover:text-[color:var(--kino-accent)]">
          {playlist.title}
        </h3>
        <p className="truncate text-sm text-[color:var(--kino-muted)]">
          {playlist.channelTitle}
        </p>
        <p className="text-xs text-[color:var(--kino-muted)]">View full playlist</p>
      </div>
    </Link>
  );
}
