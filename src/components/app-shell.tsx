"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Play } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home", icon: House },
  { href: "/shorts", label: "Shorts", icon: Play },
];

function NavLink({
  href,
  label,
  icon: Icon,
  compact,
}: {
  href: string;
  label: string;
  icon: typeof House;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
        compact && "flex-1 flex-col gap-1 px-2 py-2 text-[11px]",
        active
          ? "bg-[color:var(--kino-ink)] text-white"
          : "text-[color:var(--kino-muted)] hover:bg-white hover:text-[color:var(--kino-ink)]",
      )}
    >
      <Icon className={compact ? "size-5" : "size-5"} strokeWidth={2.25} />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shorts = pathname.startsWith("/shorts");

  return (
    <div className="flex h-dvh flex-col">
      <SiteHeader />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-56 shrink-0 border-r border-[color:var(--kino-line)] bg-[color:var(--kino-surface)]/80 px-3 py-4 md:block">
          <nav className="flex flex-col gap-1" aria-label="Main">
            {LINKS.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>
          <p className="mt-6 px-3 text-xs leading-relaxed text-[color:var(--kino-muted)]">
            Signed-out recommendations. Kino does not personalize with a YouTube account.
          </p>
        </aside>
        <div
          className={cn(
            "min-h-0 min-w-0 flex-1",
            shorts ? "overflow-hidden pb-14 md:pb-0" : "overflow-y-auto pb-16 md:pb-0",
          )}
        >
          {children}
        </div>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[color:var(--kino-line)] bg-[color:var(--kino-surface)]/95 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
        aria-label="Main"
      >
        {LINKS.map((link) => (
          <NavLink key={link.href} {...link} compact />
        ))}
      </nav>
    </div>
  );
}
