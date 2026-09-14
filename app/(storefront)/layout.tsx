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
      <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
        <header className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <Link
            href="/"
            className="font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Live Pull Fundraising
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              href="/campaigns"
              className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
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
