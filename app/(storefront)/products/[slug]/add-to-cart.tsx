"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";

export function AddToCart({
  productId,
  organizationId,
  name,
  priceCents,
  soldOut,
}: {
  productId: string;
  organizationId: string;
  name: string;
  priceCents: number;
  soldOut: boolean;
}) {
  const { addItem } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);

  if (soldOut) {
    return (
      <button
        type="button"
        disabled
        className="w-full rounded-md bg-zinc-300 px-4 py-3 text-base font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      >
        Sold Out
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => {
          addItem({ productId, organizationId, name, priceCents });
          setAdded(true);
        }}
        className="w-full rounded-md bg-zinc-900 px-4 py-3 text-base font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Add to Cart
      </button>
      {added && (
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className="w-full rounded-md border border-zinc-300 px-4 py-3 text-base font-medium dark:border-zinc-700"
        >
          Added — View Cart
        </button>
      )}
    </div>
  );
}
