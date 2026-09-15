import Link from "next/link";
import { btnPrimary } from "@/lib/ui";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(234,148,44,0.14) 0%, rgba(253,253,253,0) 70%)",
        }}
      />
      <div className="relative">
        <p className="text-sm font-semibold tracking-widest text-brand uppercase">
          Live Pull Fundraising
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Buy a real pack.
          <br />
          Watch it opened live.
        </h1>
        <p className="mt-4 max-w-md text-lg text-muted mx-auto">
          Receive exactly what&apos;s pulled from your assigned pack, or
          donate the contents back to support the mission.
        </p>
        <Link href="/campaigns" className={`${btnPrimary} mt-8 px-8 py-4`}>
          Browse Campaigns
        </Link>
      </div>
    </div>
  );
}
