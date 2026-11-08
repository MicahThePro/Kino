"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SearchType } from "@/lib/youtube/types";

const FILTERS: { id: SearchType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "video", label: "Videos" },
  { id: "short", label: "Shorts" },
  { id: "live", label: "Live" },
  { id: "channel", label: "Channels" },
  { id: "playlist", label: "Playlists" },
];

export function SearchFilters({
  query,
  active,
}: {
  query: string;
  active: SearchType;
}) {
  return (
    <div className="mb-6 flex flex-wrap gap-2 animate-kino-in">
      {FILTERS.map((filter) => {
        const href =
          filter.id === "all"
            ? `/search?q=${encodeURIComponent(query)}`
            : `/search?q=${encodeURIComponent(query)}&type=${filter.id}`;
        const selected = active === filter.id;
        return (
          <Link
            key={filter.id}
            href={href}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              selected
                ? "bg-[color:var(--kino-ink)] text-white"
                : "bg-white/80 text-[color:var(--kino-muted)] hover:bg-white hover:text-[color:var(--kino-ink)]",
            )}
          >
            {filter.label}
          </Link>
        );
      })}
    </div>
  );
}
