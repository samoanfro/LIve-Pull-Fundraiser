"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";

export function CartHeaderLink() {
  const { totalQuantity } = useCart();

  return (
    <Link
      href="/cart"
      className="flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
    >
      Cart
      {totalQuantity > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">
          {totalQuantity}
        </span>
      )}
    </Link>
  );
}
