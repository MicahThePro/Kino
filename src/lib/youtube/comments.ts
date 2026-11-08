import { DEMO_COMMENTS, demoReplies } from "./demo-data";
import { getInnertube, textOf } from "./innertube";
import type { CommentItem, CommentPage } from "./types";

type CommentViewNode = {
  comment_id?: string;
  content?: unknown;
  author?: { name?: string; thumbnails?: Array<{ url?: string }> };
  like_count?: string;
  published_time?: string;
  reply_count?: string;
  is_pinned?: boolean;
  creator_thumbnail_url?: string;
};

type LooseNode = CommentViewNode & {
  type?: string;
  contents?: LooseNode[];
  items?: LooseNode[];
  comment?: CommentViewNode;
  comment_replies_data?: { contents?: LooseNode[] };
  endpoint?: { payload?: { token?: string } };
};

function asNode(value: unknown): LooseNode | null {
  if (!value || typeof value !== "object") return null;
  return value as LooseNode;
}

function mapComment(node: LooseNode): CommentItem | null {
  const view = node.comment ?? (node.comment_id ? node : undefined);
  const id = view?.comment_id || "";
  const text = textOf(view?.content);
  if (!id || !text) return null;
  const replyToken = node.comment_replies_data?.contents?.find(
    (item) => item.type === "ContinuationItem",
  )?.endpoint?.payload?.token;

  return {
    id,
    author: view?.author?.name || "Viewer",
    authorAvatar: view?.author?.thumbnails?.[0]?.url || view?.creator_thumbnail_url,
    text,
    likes: view?.like_count,
    published: view?.published_time,
    replyCount: view?.reply_count,
    replyToken,
    pinned: view?.is_pinned,
  };
}

function readPage(page: unknown): { comments: CommentItem[]; cursor?: string } {
  const root = asNode(page);
  const endpoints = [
    ...((root as { on_response_received_endpoints?: unknown[] } | null)
      ?.on_response_received_endpoints ?? []),
    ...((root as { on_response_received_actions?: unknown[] } | null)
      ?.on_response_received_actions ?? []),
  ];
  const comments: CommentItem[] = [];
  let cursor: string | undefined;

  const visit = (node: LooseNode) => {
    if (node.type === "ContinuationItem" && node.endpoint?.payload?.token) {
      cursor = node.endpoint.payload.token;
      return;
    }
    const comment = mapComment(node);
    if (comment) comments.push(comment);
  };

  if (Array.isArray((root as { contents?: unknown[] } | null)?.contents)) {
    for (const item of (root as { contents: unknown[] }).contents) {
      const node = asNode(item);
      if (node) visit(node);
    }
  }

  for (const endpoint of endpoints) {
    const node = asNode(endpoint);
    const contents = node?.contents ?? node?.items ?? [];
    for (const item of contents) {
      const child = asNode(item);
      if (child) visit(child);
    }
  }

  return { comments, cursor };
}

export async function listComments(
  videoId: string,
  cursor?: string,
): Promise<CommentPage> {
  const id = videoId.trim();
  if (!id) return { mode: "live", comments: [] };
  if (cursor === "demo-replies") {
    return { mode: "demo", comments: demoReplies() };
  }

  try {
    const yt = await getInnertube();
    if (cursor) {
      const page = await yt.actions.execute("/next", { token: cursor, parse: true });
      const parsed = readPage(page);
      return { mode: "live", comments: parsed.comments, cursor: parsed.cursor };
    }

    const comments = await yt.getComments(id);
    const parsed = readPage({
      contents: comments.contents,
      on_response_received_endpoints: comments.page?.on_response_received_endpoints,
    });
    if (parsed.comments.length === 0) {
      return {
        mode: "demo",
        comments: DEMO_COMMENTS,
        error: "No comments were returned",
      };
    }
    return { mode: "live", comments: parsed.comments, cursor: parsed.cursor };
  } catch (error) {
    return {
      mode: "demo",
      comments: cursor ? [] : DEMO_COMMENTS,
      error: error instanceof Error ? error.message : "Failed to load comments",
    };
  }
}
