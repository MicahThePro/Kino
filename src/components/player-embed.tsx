"use client";

import { useEffect, useRef, useState } from "react";
import { PlaybackBadge } from "@/components/playback-badge";
import { noteUserGesture, readWantSound, userActivated, writeWantSound } from "@/lib/playback";
import type { Playback } from "@/lib/youtube/types";

type PlayerEmbedProps = {
  videoId: string;
  playlistId?: string;
  title: string;
  playback?: Playback;
};

function watchSrc(videoId: string, playlistId: string | undefined, muted: boolean) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: muted ? "1" : "0",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
    enablejsapi: "1",
  });
  const embedList = playlistId && !playlistId.startsWith("PLDemo") ? playlistId : undefined;
  const base = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}`;
  return embedList
    ? `${base}?list=${encodeURIComponent(embedList)}&${params}`
    : `${base}?${params}`;
}

export function PlayerEmbed({ videoId, playlistId, title, playback }: PlayerEmbedProps) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [prompt, setPrompt] = useState(false);
  const [muted, setMuted] = useState(true);
  const vertical = playback === "short";
  const frameTitle = playback === "live" ? `${title} (live)` : playback === "short" ? `${title} (Short)` : title;

  function post(func: string, args: unknown[] = []) {
    frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }

  function unmute() {
    noteUserGesture();
    writeWantSound(true);
    setMuted(false);
    setPrompt(false);
    post("unMute");
    post("setVolume", [100]);
    post("playVideo");
  }

  useEffect(() => {
    let playing = false;
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || typeof event.data !== "string") return;
      try {
        const payload = JSON.parse(event.data) as { event?: string; info?: number | { playerState?: number; muted?: boolean } };
        const info = payload.info;
        const state = typeof info === "number" ? info : info?.playerState;
        if (state === 1) playing = true;
        if (state === 1 && info && typeof info === "object" && info.muted && readWantSound()) {
          setMuted(true);
          setPrompt(true);
        }
        if (state === 1 && info && typeof info === "object" && info.muted === false) {
          setMuted(false);
          setPrompt(false);
        }
      } catch {
        return;
      }
    };
    window.addEventListener("message", onMessage);
    const timer = window.setTimeout(() => {
      if (!readWantSound()) return;
      if (userActivated()) {
        post("unMute");
        post("setVolume", [100]);
        post("playVideo");
        setMuted(false);
        setPrompt(false);
        return;
      }
      if (playing) {
        setMuted(true);
        setPrompt(true);
        return;
      }
      post("mute");
      post("playVideo");
      setMuted(true);
      setPrompt(true);
    }, 1200);
    return () => {
      window.removeEventListener("message", onMessage);
      window.clearTimeout(timer);
    };
  }, [videoId]);

  useEffect(() => {
    if (!prompt) return;
    const once = (event: Event) => {
      if (!event.isTrusted) return;
      unmute();
    };
    const options = { capture: true, passive: true } as const;
    window.addEventListener("pointerdown", once, options);
    window.addEventListener("keydown", once, options);
    window.addEventListener("touchstart", once, options);
    return () => {
      window.removeEventListener("pointerdown", once, options);
      window.removeEventListener("keydown", once, options);
      window.removeEventListener("touchstart", once, options);
    };
  }, [prompt]);

  return (
    <div className={vertical ? "mx-auto w-[min(100%,calc(78dvh*9/16))] animate-kino-in" : "animate-kino-in"}>
      {playback === "live" ? (
        <div className="mb-2">
          <PlaybackBadge playback="live" />
        </div>
      ) : null}
      <div className="overflow-hidden rounded-2xl bg-black shadow-[0_24px_60px_-28px_rgba(20,16,12,0.55)]">
        <div className={vertical ? "relative aspect-[9/16] w-full" : "relative aspect-video w-full"}>
          <iframe
            ref={frameRef}
            key={`${videoId}-${playlistId ?? ""}-${playback ?? "video"}`}
            src={watchSrc(videoId, playlistId, true)}
            title={frameTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
            onLoad={() => {
              frameRef.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
              post("playVideo");
              if (readWantSound()) {
                post("unMute");
                post("setVolume", [100]);
                if (userActivated()) {
                  setMuted(false);
                  setPrompt(false);
                }
              }
            }}
          />
          {prompt ? (
            <button
              type="button"
              onClick={unmute}
              className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-2 text-sm font-bold text-black shadow-lg"
            >
              Tap to unmute
            </button>
          ) : null}
          <button
            type="button"
            aria-label={muted ? "Unmute" : "Mute"}
            onClick={() => {
              if (muted) unmute();
              else {
                writeWantSound(false);
                setMuted(true);
                setPrompt(false);
                post("mute");
              }
            }}
            className="absolute top-3 right-3 z-10 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
      </div>
    </div>
  );
}
