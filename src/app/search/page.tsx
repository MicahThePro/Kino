import { ModeBanner } from "@/components/mode-banner";
import { SearchFilters } from "@/components/search-filters";
import { SearchResults } from "@/components/search-results";
import { SiteHeader } from "@/components/site-header";
import { searchYoutube } from "@/lib/youtube/client";
import type { SearchType } from "@/lib/youtube/types";

type SearchPageProps = {
  searchParams: Promise<{ q?: string; type?: string }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = params.q?.trim();
  return {
    title: q ? `Search: ${q}` : "Search",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const type: SearchType =
    params.type === "video" ||
    params.type === "short" ||
    params.type === "live" ||
    params.type === "channel" ||
    params.type === "playlist"
      ? params.type
      : "all";

  const results = q
    ? await searchYoutube(q, type)
    : { mode: "demo" as const, data: [], error: undefined };

  return (
    <>
      <SiteHeader initialQuery={q} />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-6 animate-kino-in">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[color:var(--kino-ink)]">
            {q ? (
              <>
                Results for{" "}
                <span className="text-[color:var(--kino-accent)]">“{q}”</span>
              </>
            ) : (
              "Search YouTube"
            )}
          </h1>
          {!q ? (
            <p className="mt-2 text-[color:var(--kino-muted)]">
              Type a query in the bar above to find videos, Shorts, livestreams, channels, and playlists.
            </p>
          ) : null}
        </div>

        {q ? <SearchFilters query={q} active={type} /> : null}
        {q ? <ModeBanner mode={results.mode} error={results.error} /> : null}
        {q ? (
          <SearchResults results={results.data} />
        ) : (
          <div className="rounded-2xl border border-dashed border-[color:var(--kino-line)] px-6 py-20 text-center text-[color:var(--kino-muted)]">
            Waiting for a search.
          </div>
        )}
      </main>
    </>
  );
}
