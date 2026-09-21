export function ProductVisual({
  name,
  compact = false,
}: {
  name: string;
  compact?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={`product-visual relative isolate overflow-hidden ${compact ? "min-h-44" : "min-h-72 sm:min-h-[26rem]"}`}
      aria-hidden="true"
    >
      <div className="absolute inset-0 opacity-70 product-grid" />
      <div className="absolute top-[13%] left-[12%] h-24 w-24 rounded-full border-[18px] border-white/20 sm:h-32 sm:w-32" />
      <div className="absolute right-[9%] bottom-[8%] h-32 w-32 rotate-12 rounded-lg border border-white/25 bg-white/10 sm:h-44 sm:w-44" />
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <div className={`relative flex rotate-[-5deg] flex-col justify-between rounded-lg border border-white/50 bg-white/95 p-4 shadow-2xl ${compact ? "h-32 w-24" : "h-56 w-40 sm:h-72 sm:w-52 sm:p-6"}`}>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-brand uppercase">Live Pull</span>
            <span className="h-2 w-2 rounded-full bg-accent" />
          </div>
          <div className="flex flex-1 items-center justify-center">
            <span className={`${compact ? "text-3xl" : "text-5xl sm:text-6xl"} font-black text-brand/20`}>
              {initials || "LP"}
            </span>
          </div>
          <div>
            <div className="h-1.5 w-full rounded-full bg-brand/15" />
            <div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-accent/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
