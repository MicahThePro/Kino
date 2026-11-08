import { VideoCard } from "@/components/video-card";
import type { VideoItem } from "@/lib/youtube/types";

export function VideoGrid({
  videos,
  playlistId,
  empty = "No videos here yet.",
  variant = "standard",
}: {
  videos: VideoItem[];
  playlistId?: string;
  empty?: string;
  variant?: "standard" | "shorts";
}) {
  if (videos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[color:var(--kino-line)] px-6 py-16 text-center text-[color:var(--kino-muted)]">
        {empty}
      </p>
    );
  }

  return (
    <div
      className={
        variant === "shorts"
          ? "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
          : "grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      }
    >
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} playlistId={playlistId} />
      ))}
    </div>
  );
}
