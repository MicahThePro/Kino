"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { SearchBar } from "@/components/search-bar";
import { cn } from "@/lib/utils";

export function SiteHeader({ initialQuery = "" }: { initialQuery?: string }) {
  const pathname = usePathname();
  const compact = pathname.startsWith("/watch");

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-[color:var(--kino-line)] bg-[color:var(--kino-surface)]/90 backdrop-blur-md",
        "animate-kino-in",
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:gap-5 sm:px-6",
          compact ? "lg:py-3" : "lg:py-4",
        )}
      >
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 outline-none"
          aria-label="Kino home"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-[color:var(--kino-accent)] text-white shadow-[0_10px_30px_-12px_rgba(225,29,46,0.75)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
            <Clapperboard className="size-4.5" strokeWidth={2.25} />
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl font-bold tracking-tight text-[color:var(--kino-ink)] sm:text-2xl">
            Kino
          </span>
        </Link>

        <div className="min-w-0 flex-1">
          <SearchBar initialQuery={initialQuery} />
        </div>
      </div>
    </header>
  );
}
