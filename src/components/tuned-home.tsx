"use client";

import { useEffect, useRef, useState } from "react";
import { InterestsBar, useInterests } from "@/components/interests-bar";
import { HomeFeedSkeleton } from "@/components/home-feed";
import { ModeBanner } from "@/components/mode-banner";
import { VideoGrid } from "@/components/video-grid";
import type { FeedSelection } from "@/lib/interests";
import type { VideoItem, YoutubeMode } from "@/lib/youtube/types";

type HomePayload = {
  mode: YoutubeMode;
  live: VideoItem[];
  videos?: VideoItem[];
  data?: VideoItem[];
  cursors?: Record<string, string>;
  error?: string;
};

function dedupe(items: VideoItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

function selectionKey(selection: FeedSelection) {
  return selection.mode === "topic" ? `topic:${selection.topic}` : selection.mode;
}

export function TunedHome() {
  const { topics, setTopics, selection, setSelection, ready } = useInterests();
  const filterKey = selectionKey(selection);
  const [live, setLive] = useState<VideoItem[]>([]);
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [cursors, setCursors] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<YoutubeMode>("live");
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [paging, setPaging] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const cursorsRef = useRef(cursors);
  const pagingRef = useRef(false);
  cursorsRef.current = cursors;

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams();
    const narrowed = selection.mode === "topic" ? [selection.topic] : selection.mode === "interests" ? topics : [];
    narrowed.forEach((topic) => params.append("topics", topic));
    if (selection.mode === "topic") params.set("only", selection.topic);
    fetch(`/api/youtube/home?${params}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<HomePayload>)
      .then((payload) => {
        if (cancelled) return;
        setLive(payload.live ?? []);
        setVideos(payload.videos ?? payload.data ?? []);
        setCursors(payload.cursors ?? {});
        setMode(payload.mode);
        setError(payload.error);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load recommendations.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, topics, filterKey, selection]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || selection.mode === "all" || (selection.mode === "interests" && topics.length === 0)) return;
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      if (pagingRef.current || Object.keys(cursorsRef.current).length === 0) return;
      pagingRef.current = true;
      setPaging(true);
      const shown = [
        ...document.querySelectorAll<HTMLAnchorElement>("a[href^='/watch?v=']"),
      ].map((link) => new URL(link.href).searchParams.get("v") || "").filter(Boolean);
      fetch("/api/youtube/home", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topics: selection.mode === "topic" ? [selection.topic] : topics,
          only: selection.mode === "topic" ? selection.topic : undefined,
          cursors: cursorsRef.current,
          exclude: shown,
        }),
      })
        .then((response) => response.json() as Promise<HomePayload>)
        .then((payload) => {
          setLive((current) => dedupe([...current, ...(payload.live ?? [])]));
          setVideos((current) => dedupe([...current, ...(payload.videos ?? [])]));
          setCursors(payload.cursors ?? {});
        })
        .catch(() => undefined)
        .finally(() => {
          pagingRef.current = false;
          setPaging(false);
        });
    }, { rootMargin: "400px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [topics, filterKey, selection, loading]);

  return (
    <>
      <InterestsBar topics={topics} selection={selection} onChange={setTopics} onSelect={setSelection} />
      {loading ? <HomeFeedSkeleton /> : null}
      {!loading ? (
        <>
          <ModeBanner mode={mode} error={error} />
          {live.length > 0 ? (
            <section className="mb-10">
              <h2 className="mb-5 font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
                {selection.mode === "topic" ? `Live ${selection.topic}` : selection.mode === "interests" && topics.length > 0 ? "Live for you" : "Live now"}
              </h2>
              <VideoGrid videos={live} />
            </section>
          ) : null}
          <section>
            <h2 className="mb-5 font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
              {selection.mode === "topic" ? selection.topic : selection.mode === "interests" && topics.length > 0 ? "For you" : mode === "live" ? "Recommended" : "Featured watches"}
            </h2>
            <VideoGrid videos={videos} />
          </section>
          {selection.mode !== "all" && topics.length > 0 ? <div ref={sentinel} className="h-8" /> : null}
          {paging ? <p className="py-4 text-center text-sm text-[color:var(--kino-muted)]">Loading more…</p> : null}
        </>
      ) : null}
    </>
  );
}
