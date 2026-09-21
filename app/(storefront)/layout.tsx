import Link from "next/link";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartHeaderLink } from "./cart-header-link";
import { SiteFooter } from "../site-footer";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-20 border-b border-border bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
              LP
            </span>
            <span className="truncate font-semibold text-foreground">
              Live Pull Fundraising
            </span>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/live"
              className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              <span className="h-2 w-2 rounded-full bg-danger" />
              Live
            </Link>
            <Link
              href="/campaigns"
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Campaigns
            </Link>
            <CartHeaderLink />
          </nav>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 sm:px-8 sm:py-12">
          {children}
        </main>
        <SiteFooter />
      </div>
    </CartProvider>
  );
}
