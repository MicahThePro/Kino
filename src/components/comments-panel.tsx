"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
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
}: {
  videoId: string;
  comment: CommentItem;
}) {
  const [replies, setReplies] = useState<CommentItem[] | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
      setReplies(page.comments);
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="flex gap-3 py-3">
      <div className="mt-0.5 size-9 shrink-0 overflow-hidden rounded-full bg-[color:var(--kino-wash)]">
        {comment.authorAvatar ? (
          // Avatars are small remote images; a plain img avoids the image optimizer for comment threads.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={comment.authorAvatar} alt="" className="size-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 text-xs text-[color:var(--kino-muted)]">
          <span className="font-semibold text-[color:var(--kino-ink)]">{comment.author}</span>
          {comment.published ? <span>{comment.published}</span> : null}
          {comment.pinned ? <span className="font-semibold text-[color:var(--kino-accent)]">Pinned</span> : null}
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--kino-ink)]">
          {comment.text}
        </p>
        <div className="mt-1 flex items-center gap-3 text-xs text-[color:var(--kino-muted)]">
          {comment.likes ? <span>{comment.likes} likes</span> : null}
          {comment.replyToken ? (
            <button type="button" onClick={toggle} className="font-semibold hover:text-[color:var(--kino-ink)]">
              {open ? "Hide replies" : `${comment.replyCount || ""} replies`.trim()}
            </button>
          ) : null}
        </div>
        {open ? (
          <div className="mt-2 border-l border-[color:var(--kino-line)] pl-3">
            {loading ? <p className="text-xs text-[color:var(--kino-muted)]">Loading replies…</p> : null}
            {replies?.map((reply) => (
              <CommentRow key={reply.id} videoId={videoId} comment={reply} />
            ))}
            {replies && replies.length === 0 && !loading ? (
              <p className="text-xs text-[color:var(--kino-muted)]">No replies loaded.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </article>
  );
}

function CommentList({ videoId }: { videoId: string }) {
  const [page, setPage] = useState<CommentPage | null>(null);
  const [extra, setExtra] = useState<CommentItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadComments(videoId)
      .then((next) => {
        if (cancelled) return;
        setPage(next);
        setCursor(next.cursor);
        setExtra([]);
        setError(next.error || null);
      })
      .catch(() => {
        if (!cancelled) setError("Comments could not be loaded.");
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
    setExtra((current) => [...current, ...next.comments]);
    setCursor(next.cursor);
  }

  const comments = [...(page?.comments ?? []), ...extra];

  return (
    <div>
      {page?.mode === "demo" ? (
        <p className="mb-2 text-xs text-[color:var(--kino-muted)]">
          Showing backup comments. YouTube did not return this thread.
        </p>
      ) : null}
      {error && page?.mode !== "demo" ? (
        <p className="mb-2 text-xs text-[color:var(--kino-muted)]">{error}</p>
      ) : null}
      {loading ? <p className="text-sm text-[color:var(--kino-muted)]">Loading comments…</p> : null}
      <div className="divide-y divide-[color:var(--kino-line)]">
        {comments.map((comment) => (
          <CommentRow key={comment.id} videoId={videoId} comment={comment} />
        ))}
      </div>
      {cursor ? (
        <button
          type="button"
          onClick={more}
          className="mt-3 rounded-full bg-[color:var(--kino-ink)] px-4 py-1.5 text-sm font-semibold text-white"
        >
          More comments
        </button>
      ) : null}
    </div>
  );
}

export function CommentsPanel({
  videoId,
  variant = "inline",
}: {
  videoId: string;
  variant?: "inline" | "sheet";
}) {
  const [open, setOpen] = useState(variant === "inline");

  if (variant === "sheet") {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[color:var(--kino-ink)] shadow-sm"
        >
          <MessageCircle className="size-4" />
          Comments
        </button>
        {open ? (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/40">
            <div className="flex max-h-[78dvh] w-full max-w-lg flex-col rounded-t-3xl bg-[color:var(--kino-surface)] shadow-2xl">
              <div className="flex items-center justify-between px-4 py-3">
                <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">Comments</h2>
                <button type="button" aria-label="Close comments" onClick={() => setOpen(false)}>
                  <X className="size-5" />
                </button>
              </div>
              <div className="overflow-y-auto px-4 pb-6">
                <CommentList videoId={videoId} />
              </div>
            </div>
          </div>
        ) : null}
      </>
    );
  }

  return (
    <section className="space-y-2">
      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-[color:var(--kino-ink)]">
        Comments
      </h2>
      <CommentList videoId={videoId} />
    </section>
  );
}
