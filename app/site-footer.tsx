import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-[#071a22] text-white">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-12">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent text-sm font-black text-accent-foreground">
                LP
              </span>
              <span className="font-bold">Live Pull Fundraising</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
              Live Pull is owned and operated by Social Health Marketplace LLC,
              a Utah for-profit company, as a contracted commerce and
              fulfillment provider for Social Health Initiative.
            </p>
          </div>

          <div className="grid gap-7 text-sm leading-6 text-white/65 sm:grid-cols-2">
            <div>
              <h2 className="font-bold text-white">Purchase disclosure</h2>
              <p className="mt-2">
                Customers purchase real physical products at the displayed
                price. A product purchase is not represented as a tax-deductible
                charitable contribution. Any optional contribution is separate,
                voluntary, and does not affect product or Pack ID assignment.
              </p>
            </div>
            <div>
              <h2 className="font-bold text-white">Collectible disclosure</h2>
              <p className="mt-2">
                Contents may vary. This is standard commerce, not a raffle,
                sweepstakes, wager, or cash-prize program. Brand names and
                trademarks belong to their respective owners; no manufacturer
                sponsorship or endorsement is implied.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs leading-5 text-white/50 sm:flex-row sm:items-start sm:justify-between">
          <p>© {new Date().getFullYear()} Social Health Marketplace LLC</p>
          <p className="max-w-2xl sm:text-right">
            Shipping, taxes, duties, availability, and refund terms are shown
            during checkout and may vary by destination. Charitable and tax
            treatment depends on applicable law; consult your own tax adviser.
          </p>
        </div>
      </div>
    </footer>
  );
}
