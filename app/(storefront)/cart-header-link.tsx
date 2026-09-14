"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";

export function CartHeaderLink() {
  const { totalQuantity } = useCart();

  return (
    <Link
      href="/cart"
      className="text-sm font-medium text-zinc-700 hover:underline dark:text-zinc-300"
    >
      Cart{totalQuantity > 0 ? ` (${totalQuantity})` : ""}
    </Link>
  );
}
