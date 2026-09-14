"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";

export default function CartPage() {
  const { items, setQuantity, removeItem, totalCents } = useCart();

  if (items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Your Cart
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
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Your Cart
      </h1>

      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800">
        {items.map((item) => (
          <li
            key={item.productId}
            className="flex items-center justify-between py-4"
          >
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {item.name}
              </p>
              <p className="text-sm text-zinc-500">
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
                className="w-16 rounded-md border border-zinc-300 px-2 py-2 text-center dark:border-zinc-700 dark:bg-zinc-900"
              />
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                className="text-sm text-red-600 dark:text-red-400"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex items-center justify-between border-t border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
          Total
        </p>
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
          ${(totalCents / 100).toFixed(2)}
        </p>
      </div>

      <Link
        href="/checkout"
        className="mt-6 block w-full rounded-md bg-zinc-900 px-4 py-3 text-center text-base font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Begin Checkout
      </Link>
    </div>
  );
}
