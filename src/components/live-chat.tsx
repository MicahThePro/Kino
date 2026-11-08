"use client";

import { useEffect, useState } from "react";

export function LiveChat({ videoId }: { videoId: string }) {
  const [domain, setDomain] = useState("");

  useEffect(() => {
    setDomain(window.location.hostname);
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--kino-line)] bg-white">
      <div className="flex items-center justify-between border-b border-[color:var(--kino-line)] px-4 py-3">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-[color:var(--kino-ink)]">
          Live chat
        </h2>
        <span className="text-xs text-[color:var(--kino-muted)]">YouTube</span>
      </div>
      {domain ? (
        <iframe
          title="Live chat"
          src={`https://www.youtube.com/live_chat?v=${encodeURIComponent(videoId)}&embed_domain=${encodeURIComponent(domain)}`}
          className="h-[min(70dvh,560px)] w-full border-0 bg-white lg:h-[calc(100dvh-12rem)]"
        />
      ) : (
        <div className="grid h-64 place-items-center text-sm text-[color:var(--kino-muted)]">
          Opening chat…
        </div>
      )}
    </section>
  );
}
