"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import {
  INTERESTS_EVENT,
  SUGGESTED_INTERESTS,
  interestsPromptSeen,
  markInterestsPromptSeen,
  readInterests,
  writeInterests,
} from "@/lib/interests";

export function InterestsBar({
  topics,
  active,
  onChange,
  onFilter,
}: {
  topics: string[];
  active: string | null;
  onChange: (topics: string[]) => void;
  onFilter: (topic: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [prompt, setPrompt] = useState(false);

  useEffect(() => {
    setPrompt(topics.length === 0 && !interestsPromptSeen());
  }, [topics.length]);

  function add(value: string) {
    const next = value.trim().slice(0, 40);
    if (!next) return;
    const current = readInterests();
    if (current.some((topic) => topic.toLowerCase() === next.toLowerCase())) return;
    const updated = [...current, next];
    writeInterests(updated);
    onChange(updated);
    markInterestsPromptSeen();
    setPrompt(false);
    setDraft("");
  }

  function remove(value: string) {
    const updated = topics.filter((topic) => topic !== value);
    writeInterests(updated);
    onChange(updated);
    if (active?.toLowerCase() === value.toLowerCase()) onFilter(null);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    add(draft);
  }

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm font-semibold text-[color:var(--kino-ink)]">Your interests</span>
        {topics.length > 0 ? (
          <button
            type="button"
            onClick={() => onFilter(null)}
            className={`rounded-full px-3 py-1 text-sm font-medium ${active ? "bg-neutral-100 text-neutral-700" : "bg-black text-white"}`}
          >
            All
          </button>
        ) : null}
        {topics.map((topic) => (
          <span
            key={topic}
            className={`inline-flex items-center rounded-full ${active?.toLowerCase() === topic.toLowerCase() ? "bg-black text-white" : "bg-neutral-100 text-neutral-800"}`}
          >
            <button type="button" className="px-3 py-1 text-sm font-medium" onClick={() => onFilter(active?.toLowerCase() === topic.toLowerCase() ? null : topic)}>
              {topic}
            </button>
            <button type="button" aria-label={`Remove ${topic}`} className="pr-2" onClick={() => remove(topic)}>
              <X className="size-3.5" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-full border border-neutral-300 px-3 py-1 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
        >
          <Plus className="size-4" />
          Tune your feed
        </button>
      </div>

      {prompt ? (
        <div className="mt-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold text-[color:var(--kino-ink)]">What do you want to see?</p>
              <p className="mt-1 text-sm text-[color:var(--kino-muted)]">
                Add a game, sport, creator, or hobby. Home, Shorts, and Live will favor it.
              </p>
            </div>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => {
                markInterestsPromptSeen();
                setPrompt(false);
              }}
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_INTERESTS.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => add(topic)}
                className="rounded-full bg-white px-3 py-1 text-sm font-medium ring-1 ring-neutral-200"
              >
                {topic}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Tune your feed</h2>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)}>
                <X className="size-5" />
              </button>
            </div>
            <form onSubmit={onSubmit}>
              <input
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Minecraft, basketball, a creator…"
                aria-label="Add an interest"
                className="h-11 w-full rounded-full border border-neutral-300 px-4 text-base outline-none focus:border-black"
              />
              <p className="mt-2 text-xs text-[color:var(--kino-muted)]">Press Enter to add. Stored only in this browser.</p>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">
              {SUGGESTED_INTERESTS.filter((topic) => !topics.some((item) => item.toLowerCase() === topic.toLowerCase())).map((topic) => (
                <button key={topic} type="button" onClick={() => add(topic)} className="rounded-full bg-neutral-100 px-3 py-1 text-sm">
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function useInterests() {
  const [topics, setTopics] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setTopics(readInterests());
    sync();
    setReady(true);
    window.addEventListener(INTERESTS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(INTERESTS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { topics, setTopics, ready };
}
