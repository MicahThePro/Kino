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
  client_id?: string;
}) {
  const text = textOf(item.message).replace(/\s+/g, " ").trim();
  const author = item.author?.name?.trim() || "Viewer";
  if (!text) return;
  const id = item.id || item.client_id || `${author}:${item.timestamp || 0}:${text}`;
  if (seen.has(id)) return;
  seen.add(id);
  const avatar = absoluteUrl(item.author?.best_thumbnail?.url || item.author?.thumbnails?.[0]?.url || "");
  messages.push({ id, author, avatar, text });
}

function collectAction(messages: LiveChatMessage[], seen: Set<string>, action: unknown) {
  if (!action || typeof action !== "object") return;
  const record = action as {
    type?: string;
    item?: Parameters<typeof pushMessage>[2];
    actions?: unknown[];
    client_id?: string;
  };
  if (Array.isArray(record.actions)) {
    for (const nested of record.actions) collectAction(messages, seen, nested);
  }
  if (record.item && typeof record.item === "object" && "message" in record.item) {
    pushMessage(messages, seen, { ...record.item, client_id: record.client_id });
  }
}

export async function readLiveChat(videoId: string): Promise<{ messages: LiveChatMessage[]; live: boolean; error?: string }> {
  try {
    const yt = await getInnertube();
    const info = await yt.getInfo(videoId);
    const chat = info.getLiveChat();
    if (!chat) return { messages: [], live: false };
    const messages: LiveChatMessage[] = [];
    const seen = new Set<string>();
    let failure = "";
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
      timer = setTimeout(finish, 4000);
      chat.on("start", (contents) => {
        for (const action of contents.actions ?? []) collectAction(messages, seen, action);
        if (messages.length > 0) finish();
      });
      chat.on("chat-update", (action) => {
        collectAction(messages, seen, action);
        if (messages.length >= 30) finish();
      });
      chat.on("error", (error) => {
        failure = error instanceof Error ? error.message : "Live chat could not be read";
        if (messages.length > 0) finish();
      });
      chat.on("end", () => finish());
      try {
        chat.start();
      } catch (error) {
        failure = error instanceof Error ? error.message : "Live chat could not be read";
        finish();
      }
    });
    return {
      messages: messages.slice(-50),
      live: true,
      error: messages.length === 0 ? failure || "No live chat messages were returned" : undefined,
    };
  } catch (error) {
    return {
      messages: [],
      live: false,
      error: error instanceof Error ? error.message : "Live chat is unavailable",
    };
  }
}
