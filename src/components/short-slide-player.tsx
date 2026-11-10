"use client";

import { useEffect, useRef } from "react";
import {
  loadYouTubeApi,
  registerShortPlayer,
  type ShortPlayerEvent,
} from "@/lib/shorts-player";

const ALLOW = "autoplay; encrypted-media; picture-in-picture; fullscreen";

function autoplaySrc(videoId: string) {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    playsinline: "1",
    controls: "0",
    rel: "0",
    modestbranding: "1",
    enablejsapi: "1",
    iv_load_policy: "3",
    fs: "0",
    disablekb: "1",
    loop: "1",
    playlist: videoId,
    origin: window.location.origin,
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params}`;
}

export function ShortSlidePlayer({
  videoId,
  active,
  audible,
  onEvent,
}: {
  videoId: string;
  active: boolean;
  audible: boolean;
  onEvent: (event: ShortPlayerEvent) => void;
}) {
  const shell = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const ready = useRef(false);
  const activeRef = useRef(active);
  const audibleRef = useRef(audible);
  const onEventRef = useRef(onEvent);
  const unmuteAt = useRef(0);
  const blocked = useRef(false);
  const retried = useRef(false);
  const instance = useRef(`p${Math.random().toString(36).slice(2, 10)}`);
  activeRef.current = active;
  audibleRef.current = audible;
  onEventRef.current = onEvent;

  useEffect(() => {
    const shellNode = shell.current;
    if (!shellNode) return;
    let destroyed = false;
    shellNode.dataset.playerInstance = instance.current;
    shellNode.dataset.reloaded = "0";
    shellNode.dataset.autoplay = "1";
    const iframe = document.createElement("iframe");
    iframe.src = autoplaySrc(videoId);
    iframe.title = "Short";
    iframe.allow = ALLOW;
    iframe.setAttribute("playsinline", "");
    iframe.setAttribute("webkit-playsinline", "");
    iframe.setAttribute("allowfullscreen", "");
    iframe.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;";
    shellNode.appendChild(iframe);
    shellNode.dataset.initialSrc = iframe.src;

    loadYouTubeApi().then(() => {
      if (destroyed || !window.YT?.Player || !iframe.isConnected) return;
      player.current = new window.YT.Player(iframe, {
        events: {
          onReady: (event) => {
            if (destroyed) return;
            ready.current = true;
            event.target.mute();
            if (activeRef.current) event.target.playVideo();
            const frame = event.target.getIframe?.();
            if (frame && shell.current) {
              frame.setAttribute("allow", ALLOW);
              frame.setAttribute("playsinline", "");
              const writes = frame.src !== shell.current.dataset.initialSrc ? "1" : "0";
              shell.current.dataset.srcWrites = writes;
            }
            if (shell.current) shell.current.dataset.ytState = String(event.target.getPlayerState?.() ?? -1);
            onEventRef.current({ id: videoId, type: "ready" });
          },
          onStateChange: (event) => {
            if (destroyed) return;
            const state = Number(event.data);
            const frame = event.target.getIframe?.();
            if (shell.current && frame?.src && shell.current.dataset.initialSrc && frame.src !== shell.current.dataset.initialSrc) {
              const writes = Number(shell.current.dataset.srcWrites || "0") + 1;
              shell.current.dataset.srcWrites = String(writes);
              shell.current.dataset.initialSrc = frame.src;
              if (writes > 1) shell.current.dataset.reloaded = "1";
            }
            if (shell.current) shell.current.dataset.ytState = String(state);
            onEventRef.current({ id: videoId, type: "state", state });
            if ((state === -1 || state === 5) && activeRef.current && ready.current && !retried.current) {
              retried.current = true;
              event.target.mute();
              event.target.loadVideoById(videoId);
              return;
            }
            if (state === 1 && activeRef.current && audibleRef.current && !blocked.current) {
              unmuteAt.current = Date.now();
              event.target.unMute();
              event.target.setVolume(100);
              return;
            }
            if (
              state === 2 &&
              activeRef.current &&
              audibleRef.current &&
              unmuteAt.current > 0 &&
              Date.now() - unmuteAt.current < 800
            ) {
              blocked.current = true;
              event.target.mute();
              event.target.playVideo();
              onEventRef.current({ id: videoId, type: "sound-blocked" });
            }
          },
          onError: (event) => {
            if (destroyed) return;
            const code = Number(event.data);
            if (shell.current) shell.current.dataset.ytError = String(code);
            onEventRef.current({ id: videoId, type: "error", code });
          },
        },
      });
    });

    return () => {
      destroyed = true;
      ready.current = false;
      try {
        player.current?.destroy();
      } catch {
        iframe.remove();
      }
      player.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    audibleRef.current = audible;
    if (!audible) {
      blocked.current = false;
      player.current?.mute?.();
      return;
    }
    blocked.current = false;
    if (active && player.current?.getPlayerState?.() === 1) {
      unmuteAt.current = Date.now();
      player.current.unMute();
      player.current.setVolume(100);
    }
  }, [audible, active]);

  useEffect(() => {
    return registerShortPlayer(videoId, {
      play: () => {
        player.current?.mute();
        player.current?.loadVideoById(videoId);
      },
      pause: () => player.current?.pauseVideo(),
      unmute: () => {
        blocked.current = false;
        unmuteAt.current = Date.now();
        player.current?.unMute();
        player.current?.setVolume(100);
        player.current?.playVideo();
      },
      mute: () => player.current?.mute(),
    });
  }, [videoId]);

  return (
    <div
      ref={shell}
      data-short-player={videoId}
      data-player-instance={instance.current}
      data-reloaded="0"
      data-autoplay="1"
      className="absolute inset-0 z-0"
    />
  );
}

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  cueVideoById: (id: string) => void;
  loadVideoById: (id: string) => void;
  getPlayerState: () => number;
  getIframe: () => HTMLIFrameElement;
  destroy: () => void;
};
