import Link from "next/link";
import { CartProvider } from "@/lib/cart/cart-context";
import { CartHeaderLink } from "./cart-header-link";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-foreground">
              LP
            </span>
            <span className="font-semibold tracking-tight text-foreground">
              Live Pull Fundraising
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/campaigns"
              className="text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              Campaigns
            </Link>
            <CartHeaderLink />
          </nav>
        </header>
        <main className="flex-1 px-6 py-8">{children}</main>
      </div>
    </CartProvider>
  );
}
