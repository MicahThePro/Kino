"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    if (!next) {
      router.push("/");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(next)}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="group relative mx-auto flex w-full max-w-2xl items-center"
      role="search"
    >
      <Search
        className="pointer-events-none absolute left-3.5 size-4 text-[color:var(--kino-muted)] transition-colors group-focus-within:text-[color:var(--kino-accent)]"
        aria-hidden
      />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search"
        aria-label="Search YouTube"
        className="h-11 rounded-full border-[color:var(--kino-line)] bg-white pl-10 pr-12 text-base shadow-[0_1px_0_rgba(20,16,12,0.04)] transition-[box-shadow,border-color] focus-visible:border-[color:var(--kino-accent)] focus-visible:ring-[color:var(--kino-accent)]/20 sm:pr-24"
      />
      <Button
        type="submit"
        size="sm"
        aria-label="Search"
        className="absolute right-1.5 h-9 w-9 rounded-full bg-[color:var(--kino-ink)] px-0 text-white hover:bg-[color:var(--kino-accent)] sm:w-auto sm:px-4"
      >
        <Search className="size-4 sm:hidden" />
        <span className="hidden sm:inline">Search</span>
      </Button>
    </form>
  );
}
