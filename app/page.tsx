import Link from "next/link";
import { HeroArt } from "./hero-art";
import { SiteFooter } from "./site-footer";

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <header className="absolute inset-x-0 top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-accent text-sm font-black text-accent-foreground shadow-sm">
              LP
            </span>
            <span className="text-sm font-bold text-foreground sm:text-base">
              Live Pull Fundraising
            </span>
          </Link>
          <Link
            href="/campaigns"
            className="rounded-md border border-brand/20 bg-white/80 px-4 py-2 text-sm font-semibold text-brand backdrop-blur transition hover:border-brand/40 hover:bg-white"
          >
            View campaigns
          </Link>
        </div>
      </header>

      <main>
        <section className="relative flex min-h-[82svh] items-center pt-24">
          <div className="hero-wash pointer-events-none absolute inset-0" />
          <div className="relative mx-auto grid w-full max-w-7xl items-center gap-6 px-5 pb-14 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12 lg:pb-20">
            <div className="max-w-xl py-8">
              <p className="text-sm font-bold text-brand uppercase">
                A transparent way to give
              </p>
              <h1 className="mt-4 text-4xl font-black leading-[1.05] text-foreground sm:text-5xl lg:text-7xl">
                Every pack has a story.
                <span className="mt-2 block text-brand">Yours helps a mission.</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-8 text-muted sm:text-xl">
                Purchase a real collectible pack, watch your exact pack opened,
                and choose whether to receive the pulls or donate them back.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/campaigns"
                  className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-4 text-base font-bold text-accent-foreground shadow-[0_8px_24px_rgba(234,148,44,0.24)] transition hover:bg-accent-hover"
                >
                  Browse Campaigns
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-md border border-brand/20 bg-white px-6 py-4 text-base font-semibold text-brand transition hover:border-brand/40 hover:bg-surface-raised"
                >
                  See how it works
                </a>
              </div>
              <p className="mt-6 flex items-center gap-2 text-sm font-medium text-muted">
                <span className="h-2 w-2 rounded-full bg-success" />
                Real products. Permanent Pack IDs. No raffles.
              </p>
            </div>

            <div className="relative min-h-52 sm:min-h-64 lg:min-h-[520px]" aria-hidden="true">
              <div className="absolute inset-0 flex items-center">
                <HeroArt />
              </div>
              <div className="absolute right-[4%] bottom-[8%] w-52 rounded-md border border-white/70 bg-white/90 p-4 shadow-xl backdrop-blur sm:w-60">
                <p className="text-xs font-bold text-brand uppercase">Pack journey</p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  Assigned to you, opened on camera, tracked through fulfillment.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="bg-brand text-white">
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-18">
            <div className="max-w-2xl">
              <p className="text-sm font-bold text-[#8dd7dc] uppercase">How it works</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                From sealed pack to verified outcome.
              </h2>
            </div>
            <ol className="mt-10 grid gap-px overflow-hidden rounded-md bg-white/15 md:grid-cols-3">
              {[
                ["01", "Choose a campaign", "Select a real product supporting the nonprofit mission."],
                ["02", "Watch your pack open", "A permanent Pack ID connects the physical pack to your order."],
                ["03", "Choose what happens next", "Ship your pulls home or donate them back to the cause."],
              ].map(([number, title, description]) => (
                <li key={number} className="bg-brand p-6 sm:p-8">
                  <span className="text-sm font-bold text-[#8dd7dc]">{number}</span>
                  <h3 className="mt-5 text-xl font-bold">{title}</h3>
                  <p className="mt-3 leading-7 text-white/75">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-surface py-14 sm:py-18">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-5 sm:px-8 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold text-accent-text uppercase">Ready to take part?</p>
              <h2 className="mt-2 text-3xl font-bold text-foreground">
                Find a campaign worth pulling for.
              </h2>
            </div>
            <Link
              href="/campaigns"
              className="inline-flex items-center justify-center rounded-md bg-brand px-6 py-4 font-bold text-white transition hover:bg-[#083f54]"
            >
              Explore live campaigns
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
