import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ChannelTab } from "@/lib/youtube/types";

const TABS: { id: ChannelTab; label: string }[] = [
  { id: "videos", label: "Videos" },
  { id: "shorts", label: "Shorts" },
  { id: "live", label: "Live" },
];

export function ChannelTabs({
  channelId,
  active,
}: {
  channelId: string;
  active: ChannelTab;
}) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2 animate-kino-in" aria-label="Channel sections">
      {TABS.map((tab) => {
        const href =
          tab.id === "videos"
            ? `/channel/${encodeURIComponent(channelId)}`
            : `/channel/${encodeURIComponent(channelId)}?tab=${tab.id}`;
        const selected = active === tab.id;
        return (
          <Link
            key={tab.id}
            href={href}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center rounded-full px-4 py-2 text-sm font-medium transition-colors",
              selected
                ? "bg-[color:var(--kino-ink)] text-white"
                : "bg-white/80 text-[color:var(--kino-muted)] hover:bg-white hover:text-[color:var(--kino-ink)]",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
