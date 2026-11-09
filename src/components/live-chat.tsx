"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveChatMessage } from "@/lib/youtube/live-chat";

export function LiveChat({ videoId }: { videoId: string }) {
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [live, setLive] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [domain, setDomain] = useState("");
  const [open, setOpen] = useState(true);
  const [stuck, setStuck] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDomain(window.location.hostname);
    let cancelled = false;
    async function pull() {
      try {
        const response = await fetch(`/api/youtube/live-chat?v=${encodeURIComponent(videoId)}`, { cache: "no-store" });
        const payload = (await response.json()) as { messages?: LiveChatMessage[]; live?: boolean; error?: string };
        if (cancelled) return;
        setLive(payload.live !== false);
        setError(payload.error);
        if (payload.messages && payload.messages.length > 0) {
          setMessages((current) => {
            const seen = new Set(current.map((item) => item.id));
            const next = payload.messages!.filter((item) => item.id && !seen.has(item.id));
            return [...current, ...next].slice(-80);
          });
        }
      } catch {
        if (!cancelled) setError("Live chat is unavailable");
      }
    }
    pull();
    const timer = window.setInterval(pull, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [videoId]);

  useEffect(() => {
    if (!stuck) return;
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages, stuck, open]);

  const useEmbed = !live || (messages.length === 0 && Boolean(error));

  return (
    <section className="overflow-hidden rounded-2xl border border-[color:var(--kino-line)] bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-[color:var(--kino-line)] px-3 py-2">
        <h2 className="text-base font-bold text-[color:var(--kino-ink)]">Live chat</h2>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="min-h-10 rounded-full px-3 text-sm font-semibold text-neutral-700"
        >
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open ? (
        useEmbed ? (
          domain ? (
            <iframe
              title="Live chat"
              src={`https://www.youtube.com/live_chat?v=${encodeURIComponent(videoId)}&embed_domain=${encodeURIComponent(domain)}`}
              className="h-[min(48dvh,440px)] w-full max-w-full border-0 bg-white lg:h-[calc(100dvh-12rem)]"
            />
          ) : (
            <div className="grid h-40 place-items-center text-sm text-[color:var(--kino-muted)]">Opening chat…</div>
          )
        ) : (
          <div className="relative flex h-[min(48dvh,440px)] flex-col lg:h-[calc(100dvh-12rem)]">
            <div
              ref={listRef}
              onScroll={(event) => {
                const node = event.currentTarget;
                const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
                setStuck(distance < 48);
              }}
              className="min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto px-3 py-3"
            >
              {messages.length === 0 ? (
                <p className="text-sm text-[color:var(--kino-muted)]">Waiting for new messages…</p>
              ) : null}
              {messages.map((message) => {
                const initial = message.author.replace(/^@/, "").slice(0, 1).toUpperCase() || "?";
                return (
                  <article key={message.id} className="flex min-w-0 gap-2">
                    <div className="size-7 shrink-0 overflow-hidden rounded-full bg-neutral-200">
                      {message.avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={message.avatar} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="grid size-full place-items-center text-xs font-bold text-neutral-700">{initial}</span>
                      )}
                    </div>
                    <p className="min-w-0 flex-1 text-sm leading-snug break-words text-neutral-900">
                      <span className="mr-1 font-semibold">{message.author}</span>
                      {message.text}
                    </p>
                  </article>
                );
              })}
            </div>
            {!stuck ? (
              <button
                type="button"
                onClick={() => {
                  const node = listRef.current;
                  if (!node) return;
                  node.scrollTop = node.scrollHeight;
                  setStuck(true);
                }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white shadow-lg"
              >
                Jump to latest
              </button>
            ) : null}
            <p className="shrink-0 border-t border-[color:var(--kino-line)] px-3 py-2 text-xs text-[color:var(--kino-muted)]">
              Read-only chat from this stream.
            </p>
          </div>
        )
      ) : null}
    </section>
  );
}
