export const INTERESTS_KEY = "kino-interests";
export const INTERESTS_PROMPT_KEY = "kino-interests-prompted";
export const INTEREST_FILTER_KEY = "kino-interest-filter";
export const INTERESTS_EVENT = "kino-interests";

export type FeedSelection =
  | { mode: "interests" }
  | { mode: "all" }
  | { mode: "topic"; topic: string };

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

export function readFeedSelection(topics: string[]): FeedSelection {
  if (typeof window === "undefined") return { mode: "interests" };
  const raw = window.localStorage.getItem(INTEREST_FILTER_KEY);
  if (raw === "all") return { mode: "all" };
  if (raw && raw !== "interests") {
    const match = topics.find((topic) => topic.toLowerCase() === raw.toLowerCase());
    if (match) return { mode: "topic", topic: match };
  }
  return { mode: "interests" };
}

export function writeFeedSelection(selection: FeedSelection) {
  if (selection.mode === "interests") {
    window.localStorage.removeItem(INTEREST_FILTER_KEY);
    return;
  }
  window.localStorage.setItem(INTEREST_FILTER_KEY, selection.mode === "all" ? "all" : selection.topic);
}

export function interestsPromptSeen() {
  return window.localStorage.getItem(INTERESTS_PROMPT_KEY) === "1";
}

export function markInterestsPromptSeen() {
  window.localStorage.setItem(INTERESTS_PROMPT_KEY, "1");
}
