const SOUND_KEY = "kino-want-sound";

let gestureAt = 0;

export function readWantSound() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(SOUND_KEY) !== "0";
}

export function writeWantSound(on: boolean) {
  window.localStorage.setItem(SOUND_KEY, on ? "1" : "0");
}

export function noteUserGesture() {
  gestureAt = Date.now();
}

export function userActivated() {
  if (typeof navigator !== "undefined" && navigator.userActivation?.hasBeenActive) return true;
  return Date.now() - gestureAt < 8000;
}
