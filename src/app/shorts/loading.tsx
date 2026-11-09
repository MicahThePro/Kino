export default function ShortsLoading() {
  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-black">
      <div className="flex h-full items-end gap-3">
        <div className="h-full aspect-[9/16] animate-pulse bg-white/10" />
        <div className="mb-8 hidden flex-col gap-4 md:flex">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="size-11 animate-pulse rounded-full bg-white/15" />
          ))}
        </div>
      </div>
    </div>
  );
}
