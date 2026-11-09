"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  MoreVertical,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import { CommentsBody, CommentsSheet } from "@/components/comments-panel";
import { readInterests } from "@/lib/interests";
import type { ShortsFeed } from "@/lib/youtube/shorts-feed";
import type { VideoItem } from "@/lib/youtube/types";

const SEEN_KEY = "kino-seen-shorts";

function readSeen() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEEN_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [] as string[];
  }
}

function rememberSeen(ids: string[]) {
  const next = [...ids, ...readSeen()].filter((id, index, all) => id && all.indexOf(id) === index).slice(0, 120);
  window.localStorage.setItem(SEEN_KEY, JSON.stringify(next));
}

function embedSrc(id: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id,
    controls: "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
    iv_load_policy: "3",
    fs: "0",
    disablekb: "1",
  });
  if (typeof window !== "undefined") params.set("origin", window.location.origin);
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?${params}`;
}

function post(frame: HTMLIFrameElement | null, func: "unMute" | "mute" | "playVideo" | "pauseVideo") {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args: [] }), "*");
}

function ShortNavButton({
  direction,
  unavailable,
  solid,
  onClick,
}: {
  direction: "up" | "down";
  unavailable: boolean;
  solid?: boolean;
  onClick: () => void;
}) {
  const Icon = direction === "up" ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      aria-label={direction === "up" ? "Previous Short" : "Next Short"}
      disabled={unavailable}
      onClick={onClick}
      className={`pointer-events-auto grid size-11 place-items-center rounded-full transition ${
        solid ? "bg-white text-black shadow-md hover:bg-neutral-100" : "bg-black/50 text-white backdrop-blur-sm"
      } ${unavailable ? "pointer-events-none opacity-30" : ""}`}
    >
      <Icon className="size-6" strokeWidth={2.25} />
    </button>
  );
}

function ActionButton({
  label,
  count,
  pressed,
  onClick,
  children,
}: {
  label: string;
  count?: string;
  pressed?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className="flex flex-col items-center gap-1 text-white"
    >
      <span
        className={`grid size-11 place-items-center rounded-full ${pressed ? "bg-white text-black" : "bg-black/45 md:bg-white/10"}`}
      >
        {children}
      </span>
      <span className="text-[10px] font-medium leading-none whitespace-nowrap">{count || label}</span>
    </button>
  );
}

export function ShortsFeed() {
  const scroller = useRef<HTMLDivElement>(null);
  const frames = useRef(new Map<string, HTMLIFrameElement | null>());
  const paging = useRef(false);
  const [items, setItems] = useState<VideoItem[]>([]);
  const [active, setActive] = useState("");
  const [sound, setSound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState(false);
  const [commentsFor, setCommentsFor] = useState<string | null>(null);
  const [liked, setLiked] = useState<Record<string, "up" | "down" | null>>({});
  const [copied, setCopied] = useState(false);
  const [moreFor, setMoreFor] = useState<string | null>(null);

  const activeIndex = Math.max(0, items.findIndex((item) => item.id === active));
  const itemsRef = useRef(items);
  itemsRef.current = items;

  function go(direction: -1 | 1) {
    const root = scroller.current;
    const total = itemsRef.current.length;
    if (!root || total === 0) return;
    const height = root.clientHeight || 1;
    const index = Math.round(root.scrollTop / height);
    const next = Math.max(0, Math.min(total - 1, index + direction));
    if (next === index) return;
    root.scrollTo({ top: next * height, behavior: "smooth" });
  }

  useEffect(() => {
    const root = scroller.current;
    if (!root) return;
    const slides = [...root.querySelectorAll<HTMLElement>("[data-short-id]")];
    const observer = new IntersectionObserver(
      (entries) => {
        const best = entries
          .filter((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.65)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = best?.target.getAttribute("data-short-id");
        if (id) setActive(id);
      },
      { root, threshold: [0.65, 0.9] },
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
  }, [active, sound, items.length]);

  useEffect(() => {
    let cancelled = false;
    const seen = readSeen();
    const params = new URLSearchParams({
      seed: String(Math.floor(Math.random() * 1_000_000_000)),
    });
    readInterests().forEach((topic) => params.append("topics", topic));
    if (seen.length > 0) params.set("exclude", seen.slice(0, 60).join(","));
    fetch(`/api/youtube/shorts?${params}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<ShortsFeed>)
      .then((feed) => {
        if (cancelled) return;
        const ordered = [
          ...feed.items.filter((item) => !seen.includes(item.id)),
          ...feed.items.filter((item) => seen.includes(item.id)),
        ];
        setItems(ordered);
        setActive(ordered[0]?.id ?? "");
        setNote(feed.mode === "demo");
        if (ordered[0]) rememberSeen([ordered[0].id]);
      })
      .catch(() => {
        if (!cancelled) setNote(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (active) rememberSeen([active]);
  }, [active]);

  useEffect(() => {
    if (items.length === 0 || activeIndex < items.length - 2 || paging.current) return;
    const after = items[items.length - 1]?.id;
    if (!after) return;
    paging.current = true;
    setLoading(true);
    const params = new URLSearchParams({
      after,
      seed: String(Math.floor(Math.random() * 1_000_000_000)),
      exclude: items.map((item) => item.id).slice(-60).join(","),
    });
    readInterests().forEach((topic) => params.append("topics", topic));
    fetch(`/api/youtube/shorts?${params}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<ShortsFeed>)
      .then(async (feed) => {
        if (feed.mode === "demo") setNote(true);
        let incoming = feed.items;
        const known = new Set(items.map((item) => item.id));
        if (!incoming.some((item) => item.id && !known.has(item.id))) {
          const retry = new URLSearchParams({
            seed: String(Math.floor(Math.random() * 1_000_000_000)),
            exclude: items.map((item) => item.id).slice(-60).join(","),
          });
          readInterests().forEach((topic) => retry.append("topics", topic));
          const again = await fetch(`/api/youtube/shorts?${retry}`, { cache: "no-store" });
          const extra = (await again.json()) as ShortsFeed;
          incoming = extra.items;
        }
        setItems((current) => {
          const seen = new Set(current.map((item) => item.id));
          const next = incoming.filter((item) => item.id && !seen.has(item.id));
          return next.length > 0 ? [...current, ...next] : current;
        });
      })
      .catch(() => undefined)
      .finally(() => {
        paging.current = false;
        setLoading(false);
      });
  }, [activeIndex, items]);

  useEffect(() => {
    function onKey(event: globalThis.KeyboardEvent) {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      const target = event.target;
      if (target instanceof HTMLElement) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      event.preventDefault();
      go(event.key === "ArrowDown" ? 1 : -1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function share(item: VideoItem) {
    const url = `${window.location.origin}/watch?v=${encodeURIComponent(item.id)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: item.title || "Short", url });
        return;
      }
    } catch {
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  function rail(item: VideoItem, className: string) {
    const vote = liked[item.id] ?? null;
    return (
      <div className={className}>
        <div className="relative flex flex-col gap-3">
        <ActionButton
          label="Like"
          pressed={vote === "up"}
          onClick={() =>
            setLiked((current) => ({ ...current, [item.id]: current[item.id] === "up" ? null : "up" }))
          }
        >
          <ThumbsUp className="size-5" />
        </ActionButton>
        <ActionButton
          label="Dislike"
          pressed={vote === "down"}
          onClick={() =>
            setLiked((current) => ({
              ...current,
              [item.id]: current[item.id] === "down" ? null : "down",
            }))
          }
        >
          <ThumbsDown className="size-5" />
        </ActionButton>
        <ActionButton label="Comments" onClick={() => setCommentsFor(item.id)}>
          <MessageCircle className="size-5" />
        </ActionButton>
        <ActionButton label={copied ? "Copied" : "Share"} onClick={() => share(item)}>
          <Share2 className="size-5" />
        </ActionButton>
        <ActionButton label="More" onClick={() => setMoreFor(moreFor === item.id ? null : item.id)}>
          <MoreVertical className="size-5" />
        </ActionButton>
        {moreFor === item.id ? (
          <div className="absolute right-14 bottom-0 z-20 w-44 rounded-xl bg-white p-1 text-left text-sm text-black shadow-xl">
            <a
              className="block rounded-lg px-3 py-2 hover:bg-neutral-100"
              href={`https://www.youtube.com/shorts/${encodeURIComponent(item.id)}`}
              target="_blank"
              rel="noreferrer"
            >
              Open on YouTube
            </a>
            <Link
              className="block rounded-lg px-3 py-2 hover:bg-neutral-100"
              href={`/watch?v=${encodeURIComponent(item.id)}`}
            >
              Open watch page
            </Link>
          </div>
        ) : null}
        </div>
      </div>
    );
  }

  const commentsItem = items.find((item) => item.id === commentsFor);

  if (items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-black">
        <div className="h-full aspect-[9/16] max-w-full animate-pulse bg-white/10" />
      </div>
    );
  }

  const atFirst = activeIndex <= 0;
  const atLast = activeIndex >= items.length - 1;

  return (
    <div className="relative flex h-full min-h-0 bg-black text-white">
      <div className="relative h-full min-w-0 flex-1 @container">
      <div
        ref={scroller}
        tabIndex={0}
        className="relative h-full min-w-0 snap-y snap-mandatory overflow-y-scroll outline-none"
      >
        {note ? (
          <p className="pointer-events-none absolute top-3 left-3 z-10 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
            Backup Shorts. Not personalized.
          </p>
        ) : null}
        {items.map((item, index) => {
          const playing = item.id === active;
          const near = Math.abs(index - activeIndex) <= 1;
          const title = item.title && item.title !== "Short" ? item.title : "";
          const initial = (item.channelTitle || title || "?").slice(0, 1).toUpperCase();
          return (
            <section
              key={item.id}
              data-short-id={item.id}
              className="relative flex h-full w-full min-w-0 snap-start snap-always items-center justify-center overflow-hidden"
            >
              <div className="flex h-full max-h-full min-w-0 items-end justify-center gap-3">
                <div className="relative h-full max-h-full min-h-0 w-auto max-w-full min-w-0" style={{ aspectRatio: "9 / 16" }}>
                  <div className="absolute inset-0 overflow-hidden bg-neutral-950">
                    {near ? (
                      <iframe
                        ref={(node) => {
                          frames.current.set(item.id, node);
                        }}
                        src={embedSrc(item.id)}
                        title={title || "Short"}
                        allow="autoplay; encrypted-media; picture-in-picture"
                        className="absolute inset-0 h-full w-full border-0"
                        onLoad={() => {
                          const frame = frames.current.get(item.id) ?? null;
                          if (item.id !== active) {
                            post(frame, "pauseVideo");
                            post(frame, "mute");
                          }
                        }}
                      />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => setSound((value) => !value)}
                      className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-black/55 text-white"
                      aria-label={sound ? "Mute" : "Unmute"}
                    >
                      {sound && playing ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                    </button>
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/85 via-black/35 to-transparent px-3 pt-16 pb-3 pr-16 md:pr-4">
                      <div className="pointer-events-auto flex items-center gap-2">
                        {item.channelId ? (
                          <Link
                            href={`/channel/${encodeURIComponent(item.channelId)}`}
                            className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-black"
                          >
                            {initial}
                          </Link>
                        ) : (
                          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-sm font-bold text-black">
                            {initial}
                          </span>
                        )}
                        {item.channelTitle ? (
                          <p className="min-w-0 truncate text-sm font-semibold">{item.channelTitle}</p>
                        ) : null}
                        {item.channelId ? (
                          <Link
                            href={`/channel/${encodeURIComponent(item.channelId)}`}
                            className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-bold text-black"
                          >
                            Subscribe
                          </Link>
                        ) : null}
                      </div>
                      {title ? <h2 className="mt-2 line-clamp-2 text-sm font-medium leading-snug">{title}</h2> : null}
                    </div>
                  </div>
                </div>
                <div className="mb-4 hidden md:block">{rail(item, "")}</div>
              </div>
              {rail(item, "absolute right-3 bottom-36 z-10 md:hidden")}
            </section>
          );
        })}
      </div>
      <div
        className="pointer-events-none absolute top-1/2 z-30 hidden -translate-y-1/2 flex-col gap-3 md:flex"
        style={{ left: "calc(50% + min(100cqh * 9 / 32, 50% - 5rem) + 3.25rem)" }}
      >
        <ShortNavButton direction="up" unavailable={atFirst} solid onClick={() => go(-1)} />
        <ShortNavButton direction="down" unavailable={atLast} solid onClick={() => go(1)} />
      </div>
      <div className="pointer-events-none absolute top-1/2 left-3 z-30 flex -translate-y-1/2 flex-col gap-3 md:hidden">
        <ShortNavButton direction="up" unavailable={atFirst} onClick={() => go(-1)} />
        <ShortNavButton direction="down" unavailable={atLast} onClick={() => go(1)} />
      </div>
      </div>

      {commentsItem ? (
        <aside className="hidden h-full w-[min(420px,40vw)] shrink-0 flex-col bg-white text-black md:flex">
          <CommentsBody
            videoId={commentsItem.id}
            onClose={() => setCommentsFor(null)}
            docked
          />
        </aside>
      ) : null}

      {commentsItem ? (
        <div className="md:hidden">
          <CommentsSheet videoId={commentsItem.id} onClose={() => setCommentsFor(null)} />
        </div>
      ) : null}

      {loading ? (
        <p className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 text-xs text-white/70">
          Loading more Shorts…
        </p>
      ) : null}
    </div>
  );
}
