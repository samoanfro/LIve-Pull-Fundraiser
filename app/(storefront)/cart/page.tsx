"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { heading, btnPrimary } from "@/lib/ui";

export default function CartPage() {
  const { items, setQuantity, removeItem, totalCents } = useCart();

  if (items.length === 0) {
    return (
      <div>
        <h1 className={`${heading} text-2xl`}>Your Cart</h1>
        <p className="mt-4 text-muted">
          Your cart is empty.{" "}
          <Link href="/campaigns" className="text-accent-text hover:underline">
            Browse campaigns
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className={`${heading} text-2xl`}>Your Cart</h1>

      <ul className="mt-6 divide-y divide-border">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex items-center justify-between py-4"
          >
            <div>
              <p className="font-medium text-foreground">{item.name}</p>
              <p className="text-sm text-muted">
                ${(item.priceCents / 100).toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  setQuantity(item.productId, Number(e.target.value))
                }
                className="w-16 rounded-lg border border-border bg-surface-raised px-2 py-2 text-center text-foreground"
              />
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="text-sm text-danger"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <p className="font-semibold text-foreground">Total</p>
        <p className="font-semibold text-foreground">
          ${(totalCents / 100).toFixed(2)}
        </p>
      </div>

      <Link href="/checkout" className={`${btnPrimary} mt-6 block w-full`}>
        Begin Checkout
      </Link>
    </div>
  );
}
