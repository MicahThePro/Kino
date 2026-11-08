import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start justify-center px-4 py-20 sm:px-6">
        <p className="text-sm font-semibold tracking-wide text-[color:var(--kino-accent)] uppercase">
          404
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-extrabold text-[color:var(--kino-ink)]">
          That page is offline
        </h1>
        <p className="mt-3 text-[color:var(--kino-muted)]">
          The video, channel, or playlist could not be found. Try another search.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-10 items-center rounded-full bg-[color:var(--kino-ink)] px-5 text-sm font-semibold text-white hover:bg-[color:var(--kino-accent)]"
        >
          Back home
        </Link>
    </main>
  );
}
