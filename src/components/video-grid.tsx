import { VideoCard } from "@/components/video-card";
import type { VideoItem } from "@/lib/youtube/types";

export function VideoGrid({
  videos,
  playlistId,
}: {
  videos: VideoItem[];
  playlistId?: string;
}) {
  if (videos.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[color:var(--kino-line)] px-6 py-16 text-center text-[color:var(--kino-muted)]">
        No videos here yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} playlistId={playlistId} />
      ))}
    </div>
  );
}
