import { Info } from "lucide-react";
import type { YoutubeMode } from "@/lib/youtube/types";

export function ModeBanner({
  mode,
  error,
}: {
  mode: YoutubeMode;
  error?: string;
}) {
  if (!error && mode === "live") return null;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl border border-[color:var(--kino-line)] bg-white/70 px-4 py-3 text-sm text-[color:var(--kino-ink)] animate-kino-in">
      <Info className="mt-0.5 size-4 shrink-0 text-[color:var(--kino-accent)]" />
      <div className="space-y-1">
        <p className="font-medium">
          {error
            ? "Showing backup results after a YouTube lookup hiccup"
            : "Browsing backup catalog"}
        </p>
        <p className="text-[color:var(--kino-muted)]">
          Kino reads YouTube through an open client — no API key required. Embeds still work either way.
        </p>
        {error ? (
          <p className="text-xs text-[color:var(--kino-muted)]">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
