"use client";

import Link from "next/link";
import { MAX_CART_QUANTITY, useCart } from "@/lib/cart/cart-context";
import { heading, btnPrimary, btnSecondary } from "@/lib/ui";

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
    <div className="mx-auto max-w-2xl">
      <h1 className={`${heading} text-2xl`}>Your Cart</h1>

      <ul className="mt-6 divide-y divide-border">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <p className="font-medium text-foreground">{item.name}</p>
              <p className="text-sm text-muted">
                ${(item.priceCents / 100).toFixed(2)} each
              </p>
            </div>
            <div className="flex items-center justify-between gap-4 sm:justify-end">
              <div className="grid grid-cols-[2.75rem_3rem_2.75rem] overflow-hidden rounded-md border border-border bg-surface" aria-label={`Quantity for ${item.name}`}>
                <button
                  type="button"
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="h-11 text-xl font-medium text-brand transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:text-muted/40"
                  aria-label={`Decrease ${item.name} quantity`}
                >
                  −
                </button>
                <output className="flex h-11 items-center justify-center border-x border-border text-sm font-bold text-foreground" aria-live="polite">
                  {item.quantity}
                </output>
                <button
                  type="button"
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                  disabled={item.quantity >= MAX_CART_QUANTITY}
                  className="h-11 text-xl font-medium text-brand transition hover:bg-surface-raised disabled:cursor-not-allowed disabled:text-muted/40"
                  aria-label={`Increase ${item.name} quantity`}
                >
                  +
                </button>
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="min-h-11 px-2 text-sm font-medium text-danger hover:underline"
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

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link href="/campaigns" className={`${btnSecondary} w-full`}>
          Keep shopping
        </Link>
        <Link href="/checkout" className={`${btnPrimary} w-full`}>
          Begin Checkout
        </Link>
      </div>
    </div>
  );
}
