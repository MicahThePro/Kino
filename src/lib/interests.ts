export const INTERESTS_KEY = "kino-interests";
export const INTERESTS_PROMPT_KEY = "kino-interests-prompted";
export const INTERESTS_EVENT = "kino-interests";

export const SUGGESTED_INTERESTS = [
  "Minecraft",
  "Basketball",
  "Music",
  "Cooking",
  "Science",
  "Travel",
  "Gaming",
  "Soccer",
];

export function readInterests(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(INTERESTS_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((topic) => String(topic).trim().slice(0, 40))
      .filter((topic, index, all) => topic && all.findIndex((item) => item.toLowerCase() === topic.toLowerCase()) === index)
      .slice(0, 12);
  } catch {
    return [];
  }
}

export function writeInterests(topics: string[]) {
  const clean = topics
    .map((topic) => topic.trim().slice(0, 40))
    .filter((topic, index, all) => topic && all.findIndex((item) => item.toLowerCase() === topic.toLowerCase()) === index)
    .slice(0, 12);
  window.localStorage.setItem(INTERESTS_KEY, JSON.stringify(clean));
  window.dispatchEvent(new Event(INTERESTS_EVENT));
}

export function interestsPromptSeen() {
  return window.localStorage.getItem(INTERESTS_PROMPT_KEY) === "1";
}

export function markInterestsPromptSeen() {
  window.localStorage.setItem(INTERESTS_PROMPT_KEY, "1");
}
