"use client";

import { useEffect, useState } from "react";
import { MessageCircle, ThumbsDown, ThumbsUp, X } from "lucide-react";
import type { CommentItem, CommentPage } from "@/lib/youtube/types";

async function loadComments(videoId: string, cursor?: string, replyToken?: string) {
  const params = new URLSearchParams({ v: videoId });
  if (replyToken) params.set("replyToken", replyToken);
  else if (cursor) params.set("cursor", cursor);
  const response = await fetch(`/api/youtube/comments?${params}`);
  if (!response.ok) throw new Error("Comments failed");
  return (await response.json()) as CommentPage;
}

function CommentRow({
  videoId,
  comment,
  nested,
}: {
  videoId: string;
  comment: CommentItem;
  nested?: boolean;
}) {
  const [replies, setReplies] = useState<CommentItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [vote, setVote] = useState<"up" | "down" | null>(null);
  const initial = (comment.author || "?").replace(/^@/, "").slice(0, 1).toUpperCase();

  async function toggle() {
    if (open) {
      setOpen(false);
      return;
    }
    setOpen(true);
    if (replies || !comment.replyToken) return;
    setLoading(true);
    try {
      const page = await loadComments(videoId, undefined, comment.replyToken);
      const seen = new Set<string>();
      setReplies(page.comments.filter((item) => {
        if (!item.id || seen.has(item.id) || item.id === comment.id) return false;
        seen.add(item.id);
        return true;
      }));
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className={`flex gap-3 py-3 ${nested ? "ml-6" : ""}`}>
      <div className="size-10 shrink-0 overflow-hidden rounded-full bg-neutral-200">
        {comment.authorAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.authorAvatar} alt="" className="size-full object-cover" />
        ) : (
          <span className="grid size-full place-items-center text-sm font-semibold text-neutral-700">
            {initial}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-neutral-500">
          <span className="font-semibold text-neutral-900">{comment.author}</span>
          {comment.published ? <span> · {comment.published}</span> : null}
          {comment.pinned ? <span className="ml-2 font-semibold text-red-600">Pinned</span> : null}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-900">{comment.text}</p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-600">
          <button
            type="button"
            aria-label="Like comment"
            aria-pressed={vote === "up"}
            onClick={() => setVote((current) => (current === "up" ? null : "up"))}
            className="inline-flex items-center gap-1"
          >
            <ThumbsUp className={`size-3.5 ${vote === "up" ? "fill-current" : ""}`} />
            {comment.likes || ""}
          </button>
          <button
            type="button"
            aria-label="Dislike comment"
            aria-pressed={vote === "down"}
            onClick={() => setVote((current) => (current === "down" ? null : "down"))}
          >
            <ThumbsDown className={`size-3.5 ${vote === "down" ? "fill-current" : ""}`} />
          </button>
          {comment.replyToken ? (
            <button type="button" onClick={toggle} className="font-semibold">
              {open ? "Hide replies" : comment.replyCount ? `${comment.replyCount} replies` : "Replies"}
            </button>
          ) : null}
        </div>
        {open ? (
          <div className="mt-1">
            {loading ? <p className="py-2 text-xs text-neutral-500">Loading replies…</p> : null}
            {replies?.map((reply) => (
              <CommentRow key={reply.id} videoId={videoId} comment={reply} nested />
            ))}
            {replies && replies.length === 0 && !loading ? (
              <p className="py-2 text-xs text-neutral-500">No replies loaded.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

export function CommentList({ videoId }: { videoId: string }) {
  const [page, setPage] = useState<CommentPage | null>(null);
  const [extra, setExtra] = useState<CommentItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadComments(videoId)
      .then((next) => {
        if (cancelled) return;
        setPage(next);
        setCursor(next.cursor);
        setExtra([]);
      })
      .catch(() => {
        if (!cancelled) setPage({ mode: "demo", comments: [], error: "Comments could not be loaded." });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  async function more() {
    if (!cursor) return;
    const next = await loadComments(videoId, cursor);
    setExtra((current) => {
      const seen = new Set([...(page?.comments ?? []), ...current].map((item) => item.id));
      return [...current, ...next.comments.filter((item) => item.id && !seen.has(item.id))];
    });
    setCursor(next.cursor && next.cursor !== cursor ? next.cursor : undefined);
  }

  const comments = (() => {
    const seen = new Set<string>();
    const unique: CommentItem[] = [];
    for (const comment of [...(page?.comments ?? []), ...extra]) {
      if (!comment.id || seen.has(comment.id)) continue;
      seen.add(comment.id);
      unique.push(comment);
    }
    return unique;
  })();

  return (
    <div>
      {page?.mode === "demo" ? (
        <p className="mb-2 text-xs text-neutral-500">
          Showing backup comments. YouTube did not return this thread.
        </p>
      ) : null}
      {loading ? (
        <div className="space-y-4 py-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="flex gap-3">
              <div className="size-10 animate-pulse rounded-full bg-neutral-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-24 animate-pulse rounded bg-neutral-200" />
                <div className="h-3 w-full animate-pulse rounded bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div>{comments.map((comment) => <CommentRow key={comment.id} videoId={videoId} comment={comment} />)}</div>
      {cursor ? (
        <button
          type="button"
          onClick={more}
          className="mt-2 rounded-full px-3 py-1.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-100"
        >
          More comments
        </button>
      ) : null}
    </div>
  );
}

export function CommentsBody({
  videoId,
  onClose,
  docked,
}: {
  videoId: string;
  onClose?: () => void;
  docked?: boolean;
}) {
  return (
    <div className={`flex min-h-0 flex-1 flex-col ${docked ? "h-full" : ""}`}>
      <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
        <h2 className="text-base font-bold text-neutral-950">Comments</h2>
        {onClose ? (
          <button type="button" aria-label="Close comments" onClick={onClose} className="rounded-full p-1 hover:bg-neutral-100">
            <X className="size-5" />
          </button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <CommentList videoId={videoId} />
      </div>
    </div>
  );
}

export function CommentsSheet({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/50" onClick={onClose}>
      <div
        className="flex max-h-[75dvh] w-full flex-col rounded-t-2xl bg-white text-black shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-neutral-300" />
        <CommentsBody videoId={videoId} onClose={onClose} />
      </div>
    </div>
  );
}

export function CommentsPanel({ videoId }: { videoId: string }) {
  const [desktop, setDesktop] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const apply = () => setDesktop(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  if (!desktop) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-900"
        >
          <MessageCircle className="size-4" />
          Comments
        </button>
        {open ? <CommentsSheet videoId={videoId} onClose={() => setOpen(false)} /> : null}
      </>
    );
  }

  return (
    <section className="rounded-xl border border-neutral-200 bg-white">
      <CommentsBody videoId={videoId} />
    </section>
  );
}
