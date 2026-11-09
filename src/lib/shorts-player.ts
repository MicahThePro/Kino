import type { VideoItem } from "@/lib/youtube/types";
import { readInterests } from "@/lib/interests";
import { noteUserGesture, readWantSound, userActivated, writeWantSound } from "@/lib/playback";

export type ShortsSnapshot = {
  videoId: string;
  muted: boolean;
  prompt: boolean;
};

let snapshot: ShortsSnapshot = { videoId: "", muted: true, prompt: false };
const listeners = new Set<() => void>();
let host: HTMLDivElement | null = null;
let frame: HTMLIFrameElement | null = null;
let preload: HTMLIFrameElement | null = null;
let primed: VideoItem[] | null = null;
let primePromise: Promise<VideoItem[] | null> | null = null;
let sessionUnmuted = false;
let heardSound = false;
let playing = false;
let fallbackTimer = 0;

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribeShorts(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getShortsSnapshot() {
  return snapshot;
}

function setSnapshot(next: ShortsSnapshot) {
  if (next.videoId === snapshot.videoId && next.muted === snapshot.muted && next.prompt === snapshot.prompt) return;
  snapshot = next;
  if (host) {
    host.dataset.videoId = snapshot.videoId;
    host.dataset.muted = snapshot.muted ? "1" : "0";
    host.dataset.prompt = snapshot.prompt ? "1" : "0";
  }
  emit();
}

export function embedUrl(id: string, muted: boolean, autoplay = true) {
  const params = new URLSearchParams({
    autoplay: autoplay ? "1" : "0",
    mute: muted ? "1" : "0",
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
    origin: window.location.origin,
  });
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}?${params}`;
}

function post(func: string, args: unknown[] = []) {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
}

function listen() {
  frame?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
}

function shouldUnmute() {
  if (!readWantSound()) return false;
  if (snapshot.prompt && !sessionUnmuted) return false;
  return sessionUnmuted || userActivated();
}

function onMessage(event: MessageEvent) {
  if (!frame || event.source !== frame.contentWindow || typeof event.data !== "string") return;
  let payload: { event?: string; info?: number | { muted?: boolean; playerState?: number } };
  try {
    payload = JSON.parse(event.data);
  } catch {
    return;
  }
  const info = payload.info;
  const state = typeof info === "number" ? info : info?.playerState;
  if (payload.event === "onStateChange" && state === 0) post("playVideo");
  if (state === 1) {
    playing = true;
    window.clearTimeout(fallbackTimer);
  }
  if (state === 1 && info && typeof info === "object" && typeof info.muted === "boolean") {
    if (!info.muted) {
      heardSound = true;
      sessionUnmuted = true;
      setSnapshot({ ...snapshot, muted: false, prompt: false });
    } else if (readWantSound() && !heardSound) {
      sessionUnmuted = false;
      setSnapshot({ ...snapshot, muted: true, prompt: true });
    }
  }
}

function ensureFrame(id: string, muted: boolean) {
  if (!host) {
    host = document.createElement("div");
    host.id = "kino-shorts-player";
    host.style.cssText = "position:absolute;inset:0;pointer-events:none;";
  }
  if (!frame) {
    frame = document.createElement("iframe");
    frame.allow = "autoplay; encrypted-media; picture-in-picture";
    frame.setAttribute("playsinline", "true");
    frame.setAttribute("allowfullscreen", "true");
    frame.title = "Short";
    frame.style.cssText = "position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none;";
    host.appendChild(frame);
    window.addEventListener("message", onMessage);
    frame.addEventListener("load", () => {
      listen();
      post("playVideo");
      post(shouldUnmute() ? "unMute" : "mute");
      window.clearTimeout(fallbackTimer);
      fallbackTimer = window.setTimeout(() => {
        if (heardSound || !readWantSound()) return;
        if (userActivated()) {
          post("unMute");
          post("setVolume", [100]);
          post("playVideo");
          return;
        }
        post("mute");
        post("playVideo");
        sessionUnmuted = false;
        setSnapshot({ ...snapshot, muted: true, prompt: true });
      }, 1200);
    });
  }
  host.dataset.videoId = id;
  host.dataset.muted = muted ? "1" : "0";
  host.dataset.prompt = snapshot.prompt ? "1" : "0";
  if (!frame.src.includes(`/embed/${id}`)) {
    playing = false;
    frame.src = embedUrl(id, muted);
  }
  setSnapshot({ videoId: id, muted, prompt: snapshot.prompt });
  return host;
}

export function shortsPlayerHost() {
  return host;
}

export function playShort(id: string) {
  if (!id || typeof window === "undefined") return;
  const want = readWantSound();
  if (!frame) {
    if (want && userActivated()) sessionUnmuted = true;
    ensureFrame(id, !want);
    return;
  }
  const unmute = shouldUnmute();
  if (snapshot.videoId !== id) {
    playing = false;
    post("loadVideoById", [{ videoId: id, startSeconds: 0 }]);
  }
  post("playVideo");
  post(unmute ? "unMute" : "mute");
  if (unmute) post("setVolume", [100]);
  setSnapshot({ videoId: id, muted: !unmute, prompt: unmute ? false : snapshot.prompt });
}

export function preloadShort(id: string) {
  if (!id || typeof document === "undefined" || id === snapshot.videoId) return;
  if (!preload) {
    preload = document.createElement("iframe");
    preload.title = "";
    preload.setAttribute("aria-hidden", "true");
    preload.tabIndex = -1;
    preload.allow = "autoplay";
    preload.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;left:-9999px;top:0;";
    document.body.appendChild(preload);
  }
  if (!preload.src.includes(`/embed/${id}`)) preload.src = embedUrl(id, true, false);
}

export function unmuteFromGesture() {
  noteUserGesture();
  sessionUnmuted = true;
  heardSound = true;
  writeWantSound(true);
  listen();
  post("unMute");
  post("setVolume", [100]);
  post("playVideo");
  setSnapshot({ ...snapshot, muted: false, prompt: false });
}

export function toggleShortMute() {
  if (snapshot.muted || snapshot.prompt) unmuteFromGesture();
  else {
    sessionUnmuted = false;
    writeWantSound(false);
    post("mute");
    setSnapshot({ ...snapshot, muted: true, prompt: false });
  }
}

export function armShortsFromGesture() {
  noteUserGesture();
  const id = primed?.[0]?.id;
  if (!id) return;
  if (!readWantSound()) {
    ensureFrame(id, true);
    return;
  }
  sessionUnmuted = true;
  if (!frame) ensureFrame(id, false);
  else playShort(id);
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
