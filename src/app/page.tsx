import { Suspense } from "react";
import { HomeFeed, HomeFeedSkeleton } from "@/components/home-feed";

export default function HomePage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <section className="mb-8 max-w-2xl animate-kino-in">
        <p className="mb-2 font-[family-name:var(--font-display)] text-sm font-semibold tracking-[0.18em] text-[color:var(--kino-accent)] uppercase">
          Kino
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl leading-none font-extrabold tracking-tight text-[color:var(--kino-ink)] sm:text-5xl">
          Search. Play. Stay awhile.
        </h1>
        <p className="mt-3 max-w-xl text-base text-[color:var(--kino-muted)] sm:text-lg">
          Recommended long videos and livestreams, plus a Shorts feed. Nothing
          here is signed in to YouTube, so it is not your personal home page.
        </p>
      </section>
      <Suspense fallback={<HomeFeedSkeleton />}>
        <HomeFeed />
      </Suspense>
    </main>
  );
}
