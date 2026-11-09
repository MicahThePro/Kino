import { TunedHome } from "@/components/tuned-home";

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
          Recommended long videos and livestreams, plus a Shorts feed. Add
          interests to tilt Home, Shorts, and Live toward what you care about.
        </p>
      </section>
      <TunedHome />
    </main>
  );
}
