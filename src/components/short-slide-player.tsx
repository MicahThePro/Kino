"use client";

import { useEffect, useRef } from "react";
import {
  loadYouTubeApi,
  registerShortPlayer,
  type ShortPlayerEvent,
} from "@/lib/shorts-player";

const ALLOW = "autoplay; encrypted-media; picture-in-picture; fullscreen";

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
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<YTPlayer | null>(null);
  const ready = useRef(false);
  const activeRef = useRef(active);
  const audibleRef = useRef(audible);
  const onEventRef = useRef(onEvent);
  const unmuteAt = useRef(0);
  const kicked = useRef(false);
  const blocked = useRef(false);
  const instance = useRef(`p${Math.random().toString(36).slice(2, 10)}`);
  activeRef.current = active;
  audibleRef.current = audible;
  onEventRef.current = onEvent;

  useEffect(() => {
    const element = host.current;
    if (!element || !shell.current) return;
    let destroyed = false;
    shell.current.dataset.playerInstance = instance.current;
    shell.current.dataset.reloaded = "0";
    loadYouTubeApi().then(() => {
      if (destroyed || !host.current || !window.YT?.Player) return;
      player.current = new window.YT.Player(host.current, {
        videoId,
        host: "https://www.youtube.com",
        playerVars: {
          playsinline: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          autoplay: 0,
          enablejsapi: 1,
          origin: window.location.origin,
          iv_load_policy: 3,
          fs: 0,
          disablekb: 1,
        },
        events: {
          onReady: (event) => {
            if (destroyed) return;
            ready.current = true;
            const iframe = event.target.getIframe?.();
            if (iframe && shell.current) {
              iframe.setAttribute("allow", ALLOW);
              iframe.setAttribute("playsinline", "");
              iframe.setAttribute("webkit-playsinline", "");
              shell.current.dataset.initialSrc = iframe.src;
            }
            event.target.mute();
            if (activeRef.current) event.target.playVideo();
            else event.target.cueVideoById(videoId);
            if (shell.current) shell.current.dataset.ytState = String(event.target.getPlayerState?.() ?? -1);
            onEventRef.current({ id: videoId, type: "ready" });
          },
          onStateChange: (event) => {
            if (destroyed) return;
            const state = Number(event.data);
            const iframe = event.target.getIframe?.();
            const initial = shell.current?.dataset.initialSrc;
            if (shell.current && initial && iframe?.src && iframe.src !== initial) {
              shell.current.dataset.reloaded = "1";
            }
            if (shell.current) shell.current.dataset.ytState = String(state);
            onEventRef.current({ id: videoId, type: "state", state });
            if (state === 1 || state === 3) kicked.current = false;
            if ((state === 5 || state === -1) && activeRef.current && !kicked.current) {
              kicked.current = true;
              event.target.playVideo();
            }
            if (state === 1) {
              if (activeRef.current && audibleRef.current && !blocked.current) {
                unmuteAt.current = Date.now();
                event.target.unMute();
                event.target.setVolume(100);
              }
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
            const log = document.body.dataset.ytErrors || "";
            document.body.dataset.ytErrors = `${log} ${videoId}:${code}`.trim().slice(-400);
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
        /* already gone */
      }
      player.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    const target = player.current;
    if (!ready.current || !target?.playVideo) return;
    if (active) target.playVideo();
    else target.pauseVideo();
  }, [active]);

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
      play: () => player.current?.playVideo(),
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
      className="absolute inset-0 z-0"
    >
      <div ref={host} className="h-full w-full" />
    </div>
  );
}

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  mute: () => void;
  unMute: () => void;
  setVolume: (volume: number) => void;
  cueVideoById: (id: string) => void;
  getPlayerState: () => number;
  getIframe: () => HTMLIFrameElement;
  destroy: () => void;
};
