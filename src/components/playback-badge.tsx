import { cn } from "@/lib/utils";
import type { Playback } from "@/lib/youtube/types";

export function PlaybackBadge({
  playback,
  className,
}: {
  playback?: Playback;
  className?: string;
}) {
  if (!playback || playback === "video") return null;

  if (playback === "live") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-md bg-[color:var(--kino-accent)] px-1.5 py-0.5 text-[11px] font-bold tracking-wide text-white",
          className,
        )}
      >
        <span className="size-1.5 rounded-full bg-white" aria-hidden />
        LIVE
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold text-white",
        className,
      )}
    >
      {playback === "short" ? "Short" : "Stream"}
    </span>
  );
}
