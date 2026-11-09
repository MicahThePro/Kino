"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
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

function homeParams(topics: string[], selection: FeedSelection, fresh: boolean) {
  const params = new URLSearchParams();
  const narrowed = selection.mode === "topic" ? [selection.topic] : selection.mode === "interests" ? topics : [];
  narrowed.forEach((topic) => params.append("topics", topic));
  if (selection.mode === "topic") params.set("only", selection.topic);
  if (fresh) {
    params.set("fresh", "1");
    params.set("r", String(Date.now()));
  }
  return params;
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
  const [refreshing, setRefreshing] = useState(false);
  const [pull, setPull] = useState(0);
  const [paging, setPaging] = useState(false);
  const pullRef = useRef(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const cursorsRef = useRef(cursors);
  const pagingRef = useRef(false);
  cursorsRef.current = cursors;

  const applyPayload = useCallback((payload: HomePayload) => {
    setLive(payload.live ?? []);
    setVideos(payload.videos ?? payload.data ?? []);
    setCursors(payload.cursors ?? {});
    setMode(payload.mode);
    setError(payload.error);
  }, []);

  const refresh = useCallback(() => {
    if (refreshing) return;
    setRefreshing(true);
    const params = homeParams(topics, selection, true);
    fetch(`/api/youtube/home?${params}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<HomePayload>)
      .then((payload) => applyPayload(payload))
      .catch(() => setError("Could not load recommendations."))
      .finally(() => {
        setRefreshing(false);
        pullRef.current = 0;
        setPull(0);
      });
  }, [applyPayload, refreshing, selection, topics]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    setLoading(true);
    const params = homeParams(topics, selection, false);
    fetch(`/api/youtube/home?${params}`, { cache: "no-store" })
      .then((response) => response.json() as Promise<HomePayload>)
      .then((payload) => {
        if (!cancelled) applyPayload(payload);
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
  }, [ready, topics, filterKey, selection, applyPayload]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>("[data-kino-scroll]");
    if (!root) return;
    let startY = 0;
    let tracking = false;
    let wheel = 0;
    let wheelTimer = 0;
    const onStart = (event: TouchEvent) => {
      if (root.scrollTop > 2) return;
      tracking = true;
      startY = event.touches[0]?.clientY ?? 0;
    };
    const onMove = (event: TouchEvent) => {
      if (!tracking || root.scrollTop > 2) {
        tracking = false;
        pullRef.current = 0;
        setPull(0);
        return;
      }
      const delta = (event.touches[0]?.clientY ?? 0) - startY;
      if (delta <= 0) return;
      event.preventDefault();
      const next = Math.min(delta * 0.55, 112);
      pullRef.current = next;
      setPull(next);
    };
    const onEnd = () => {
      if (!tracking) return;
      tracking = false;
      if (pullRef.current > 72) refresh();
      else {
        pullRef.current = 0;
        setPull(0);
      }
    };
    const onWheel = (event: WheelEvent) => {
      if (root.scrollTop > 2 || event.deltaY >= 0) {
        wheel = 0;
        return;
      }
      wheel += -event.deltaY;
      const next = Math.min(wheel * 0.3, 112);
      pullRef.current = next;
      setPull(next);
      window.clearTimeout(wheelTimer);
      wheelTimer = window.setTimeout(() => {
        wheel = 0;
        if (!refreshing && pullRef.current < 72) {
          pullRef.current = 0;
          setPull(0);
        }
      }, 280);
      if (wheel > 160) {
        wheel = 0;
        refresh();
      }
    };
    root.addEventListener("touchstart", onStart, { passive: true });
    root.addEventListener("touchmove", onMove, { passive: false });
    root.addEventListener("touchend", onEnd);
    root.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      root.removeEventListener("touchstart", onStart);
      root.removeEventListener("touchmove", onMove);
      root.removeEventListener("touchend", onEnd);
      root.removeEventListener("wheel", onWheel);
      window.clearTimeout(wheelTimer);
    };
  }, [refresh, refreshing]);

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
      <div
        className="pointer-events-none sticky top-0 z-20 flex justify-center"
        style={{ height: pull > 0 || refreshing ? Math.max(pull, refreshing ? 48 : 0) : 0 }}
        aria-hidden={pull === 0 && !refreshing}
      >
        {pull > 0 || refreshing ? (
          <span className="mt-2 grid size-9 place-items-center rounded-full bg-white shadow">
            <RefreshCw
              className={`size-5 text-neutral-800 ${refreshing ? "animate-spin" : ""}`}
              style={refreshing ? undefined : { transform: `rotate(${pull * 3}deg)` }}
            />
          </span>
        ) : null}
      </div>
      <InterestsBar
        topics={topics}
        selection={selection}
        onChange={setTopics}
        onSelect={setSelection}
        onRefresh={refresh}
        refreshing={refreshing}
      />
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
