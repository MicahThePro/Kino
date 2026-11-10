"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { House, Play } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { primeShorts, resetPrime } from "@/lib/shorts-player";
import { INTERESTS_EVENT } from "@/lib/interests";
import { noteUserGesture } from "@/lib/playback";
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
      onPointerDown={() => noteUserGesture()}
      onClick={() => noteUserGesture()}
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors",
        compact && "min-h-12 flex-1 py-2",
        active
          ? "bg-neutral-100 text-black"
          : "text-neutral-700 hover:bg-neutral-100",
      )}
    >
      <Icon className={compact ? "size-5" : "size-5"} strokeWidth={2.25} />
      {label}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const shorts = pathname.startsWith("/shorts");
  const warmed = useRef(false);

  useEffect(() => {
    if (shorts) {
      if (warmed.current) return;
      warmed.current = true;
      router.prefetch("/");
      fetch("/api/youtube/home").catch(() => undefined);
      return;
    }
    router.prefetch("/shorts");
    primeShorts().catch(() => undefined);
    const refresh = () => {
      resetPrime();
      primeShorts().catch(() => undefined);
    };
    window.addEventListener(INTERESTS_EVENT, refresh);
    return () => window.removeEventListener(INTERESTS_EVENT, refresh);
  }, [router, shorts]);

  return (
    <div className="flex h-dvh flex-col bg-white">
      <SiteHeader />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[72px] shrink-0 border-r border-neutral-200 bg-white px-1 py-3 md:block">
          <nav className="flex flex-col gap-1" aria-label="Main">
            {LINKS.map((link) => (
              <NavLink key={link.href} {...link} />
            ))}
          </nav>
        </aside>
        <div
          data-kino-scroll
          className={cn(
            "min-h-0 min-w-0 flex-1",
            shorts ? "flex h-full flex-col overflow-hidden pb-[4.25rem] md:pb-0" : "overflow-x-hidden overflow-y-auto overscroll-y-contain pb-[4.75rem] md:pb-0",
          )}
        >
          {shorts ? <div className="min-h-0 flex-1">{children}</div> : children}
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
