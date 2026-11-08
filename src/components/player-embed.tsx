type PlayerEmbedProps = {
  videoId: string;
  playlistId?: string;
  title: string;
};

export function PlayerEmbed({ videoId, playlistId, title }: PlayerEmbedProps) {
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

  return (
    <div className="overflow-hidden rounded-2xl bg-black shadow-[0_24px_60px_-28px_rgba(20,16,12,0.55)] animate-kino-in">
      <div className="relative aspect-video w-full">
        <iframe
          key={`${videoId}-${playlistId ?? ""}`}
          src={watchSrc}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </div>
  );
}
