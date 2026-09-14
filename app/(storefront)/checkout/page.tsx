"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";

export default function CheckoutPage() {
  const { items, totalCents } = useCart();
  const [email, setEmail] = useState("");
  const [asGuest, setAsGuest] = useState(true);

  if (items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Checkout
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-400">
          Your cart is empty.{" "}
          <Link href="/campaigns" className="underline">
            Browse campaigns
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Checkout
      </h1>

      <div className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <ul className="flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item.productId} className="flex justify-between">
              <span>
                {item.name} &times; {item.quantity}
              </span>
              <span>
                ${((item.priceCents * item.quantity) / 100).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-zinc-200 pt-3 font-semibold dark:border-zinc-800">
          <span>Total</span>
          <span>${(totalCents / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setAsGuest(true)}
          className={`rounded-md px-3 py-2 ${asGuest ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900" : "border border-zinc-300 dark:border-zinc-700"}`}
        >
          Continue as Guest
        </button>
        <Link
          href="/login"
          className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700"
        >
          Sign In Instead
        </Link>
      </div>

      {asGuest && (
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Email for order confirmation
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-md border border-zinc-300 px-3 py-3 text-base font-normal dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
      )}

      <button
        type="button"
        disabled
        title="Payment processing is not built yet"
        className="mt-6 w-full rounded-md bg-zinc-300 px-4 py-3 text-base font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      >
        Continue to Payment (coming in Phase 4)
      </button>
      <p className="mt-2 text-center text-xs text-zinc-500">
        Stripe Checkout and inventory reservation are not implemented yet.
      </p>
    </div>
  );
}
