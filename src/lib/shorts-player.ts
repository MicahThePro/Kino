import type { VideoItem } from "@/lib/youtube/types";
import { readInterests } from "@/lib/interests";

let primed: VideoItem[] | null = null;
let primePromise: Promise<VideoItem[] | null> | null = null;

export function isIOS() {
  if (typeof navigator === "undefined") return false;
  const agent = navigator.userAgent || "";
  return /iPhone|iPad|iPod/i.test(agent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function takePrimedShorts() {
  return primed;
}

export function primeShorts() {
  if (primed) return Promise.resolve(primed);
  if (primePromise) return primePromise;
  const params = new URLSearchParams({
    seed: String(Math.floor(Math.random() * 1_000_000_000)),
  });
  readInterests().forEach((topic) => params.append("topics", topic));
  primePromise = fetch(`/api/youtube/shorts?${params}`, { cache: "no-store" })
    .then((response) => response.json())
    .then((feed: { items?: VideoItem[] }) => {
      primed = feed.items?.filter((item) => item.id) ?? [];
      return primed;
    })
    .catch(() => null)
    .finally(() => {
      primePromise = null;
    });
  return primePromise;
}

export function resetPrime() {
  primed = null;
  primePromise = null;
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

type YTEvent = { data: number; target: YTPlayer };

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId?: string;
          host?: string;
          playerVars?: Record<string, number | string>;
          events: {
            onReady: (event: { target: YTPlayer }) => void;
            onStateChange: (event: YTEvent) => void;
            onError: (event: YTEvent) => void;
          };
        },
      ) => YTPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; BUFFERING: number; CUED: number; ENDED: number; UNSTARTED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<void> | null = null;

export function loadYouTubeApi() {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    if (!document.querySelector("script[src='https://www.youtube.com/iframe_api']")) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    }
  });
  return apiPromise;
}

export type ShortPlayerEvent =
  | { id: string; type: "ready" }
  | { id: string; type: "state"; state: number }
  | { id: string; type: "error"; code: number }
  | { id: string; type: "sound-blocked" };

export type ShortPlayerHandle = {
  play: () => void;
  pause: () => void;
  unmute: () => void;
  mute: () => void;
};

const handles = new Map<string, ShortPlayerHandle>();

export function shortPlayerHandle(id: string) {
  return handles.get(id);
}

export function registerShortPlayer(id: string, handle: ShortPlayerHandle) {
  handles.set(id, handle);
  return () => {
    if (handles.get(id) === handle) handles.delete(id);
  };
}
