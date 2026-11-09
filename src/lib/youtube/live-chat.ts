import { absoluteUrl, getInnertube, textOf } from "./innertube";

export type LiveChatMessage = {
  id: string;
  author: string;
  avatar: string;
  text: string;
};

function pushMessage(messages: LiveChatMessage[], seen: Set<string>, item: {
  id?: string;
  message?: unknown;
  author?: { name?: string; best_thumbnail?: { url?: string }; thumbnails?: Array<{ url?: string }> };
  timestamp?: number;
}) {
  const text = textOf(item.message).trim();
  const author = item.author?.name?.trim() || "Viewer";
  if (!text) return;
  const id = item.id || `${author}:${item.timestamp || 0}:${text}`;
  if (seen.has(id)) return;
  seen.add(id);
  const avatar = absoluteUrl(item.author?.best_thumbnail?.url || item.author?.thumbnails?.[0]?.url || "");
  messages.push({ id, author, avatar, text });
}

export async function readLiveChat(videoId: string): Promise<{ messages: LiveChatMessage[]; live: boolean; error?: string }> {
  try {
    const yt = await getInnertube();
    const info = await yt.getInfo(videoId);
    const chat = info.getLiveChat();
    if (!chat) return { messages: [], live: false };
    const messages: LiveChatMessage[] = [];
    const seen = new Set<string>();
    await new Promise<void>((resolve) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout>;
      const finish = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          chat.stop();
        } catch {
          /* already stopped */
        }
        resolve();
      };
      timer = setTimeout(finish, 1500);
      chat.on("chat-update", (action) => {
        const item = "item" in action ? action.item : null;
        if (!item || typeof item !== "object" || !("message" in item)) return;
        pushMessage(messages, seen, item as Parameters<typeof pushMessage>[2]);
      });
      chat.on("error", () => finish());
      chat.on("end", () => finish());
      try {
        chat.start();
      } catch {
        finish();
      }
    });
    return { messages: messages.slice(-50), live: true };
  } catch (error) {
    return {
      messages: [],
      live: false,
      error: error instanceof Error ? error.message : "Live chat is unavailable",
    };
  }
}
