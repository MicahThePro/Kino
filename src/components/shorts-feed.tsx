"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { CommentsPanel } from "@/components/comments-panel";
import type { ShortsFeed } from "@/lib/youtube/shorts-feed";
import type { VideoItem } from "@/lib/youtube/types";

function embedSrc(id: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id,
    controls: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
  });
  if (typeof window !== "undefined") params.set("origin", window.location.origin);
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?${params}`;
}

function post(frame: HTMLIFrameElement | null, func: "unMute" | "mute" | "playVideo" | "pauseVideo") {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
}

export function ShortsFeed({ initial }: { initial: ShortsFeed }) {
  const scroller = useRef<HTMLDivElement>(null);
  const frames = useRef(new Map<string, HTMLIFrameElement | null>());
  const [items, setItems] = useState<VideoItem[]>(initial.items);
  const [active, setActive] = useState(initial.items[0]?.id ?? "");
  const [sound, setSound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState(initial.mode === "demo");
  const requested = useRef(new Set<string>());

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const slides = [...root.querySelectorAll<HTMLElement>("[data-short-id]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.6)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = best?.target.getAttribute("data-short-id");
        if (id) setActive(id);
      },
      { root, threshold: [0.6, 0.85] },
    );
    slides.forEach((slide) => observer.observe(slide));
    return () => observer.disconnect();
  }, [items]);

  useEffect(() => {
    for (const [id, frame] of frames.current) {
      if (id === active) {
        post(frame, "playVideo");
        post(frame, sound ? "unMute" : "mute");
      } else {
        post(frame, "pauseVideo");
        post(frame, "mute");
      }
    }
  }, [active, sound]);

  useEffect(() => {
    const index = items.findIndex((item) => item.id === active);
    if (index < 0 || index < items.length - 2 || loading) return;
    const after = items[items.length - 1]?.id;
    if (!after || requested.current.has(after)) return;
    requested.current.add(after);
    setLoading(true);
    fetch(`/api/youtube/shorts?after=${encodeURIComponent(after)}`)
      .then((response) => response.json() as Promise<ShortsFeed>)
      .then((feed) => {
        if (feed.mode === "demo") setNote(true);
        setItems((current) => {
          const seen = new Set(current.map((item) => item.id));
          const next = feed.items.filter((item) => !seen.has(item.id));
          return next.length > 0 ? [...current, ...next] : current;
        });
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [active, items, loading]);

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const root = scroller.current;
    if (!root) return;
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    root.scrollBy({ top: event.key === "ArrowDown" ? root.clientHeight : -root.clientHeight, behavior: "smooth" });
  }

  return (
    <div
      ref={scroller}
      tabIndex={0}
      onKeyDown={onKeyDown}
      className="relative h-full snap-y snap-mandatory overflow-y-scroll bg-black outline-none"
    >
      {note ? (
        <p className="pointer-events-none absolute z-10 m-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
          Backup Shorts. YouTube’s reel did not respond. Not personalized.
        </p>
      ) : null}
      {items.map((item) => {
        const playing = item.id === active;
        return (
          <section
            key={item.id}
            data-short-id={item.id}
            className="flex h-full snap-start snap-always items-center justify-center"
          >
            <div className="relative h-full max-h-full w-auto max-w-full aspect-[9/16]">
              {playing ? (
                <iframe
                  ref={(node) => {
                    frames.current.set(item.id, node);
                  }}
                  src={embedSrc(item.id)}
                  title={item.title}
                  allow="autoplay; encrypted-media; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full border-0"
                />
              ) : (
                <button
                  type="button"
                  className="absolute inset-0 bg-black"
                  onClick={() => {
                    document.querySelector(`[data-short-id="${item.id}"]`)?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />
                </button>
              )}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pr-16 text-white">
                <p className="text-xs font-semibold tracking-wide text-white/80 uppercase">Short</p>
                <h2 className="mt-1 line-clamp-2 text-lg font-bold">{item.title}</h2>
                {item.channelTitle ? <p className="text-sm text-white/80">{item.channelTitle}</p> : null}
              </div>
              <div className="absolute right-3 bottom-24 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setSound((value) => !value)}
                  className="grid size-11 place-items-center rounded-full bg-black/60 text-white"
                  aria-label={sound ? "Mute" : "Unmute"}
                >
                  {sound ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                </button>
                <CommentsPanel videoId={item.id} variant="sheet" />
              </div>
            </div>
          </section>
        );
      })}
      {loading ? (
        <p className="py-6 text-center text-sm text-white/70">Loading more Shorts…</p>
      ) : null}
    </div>
  );
}
