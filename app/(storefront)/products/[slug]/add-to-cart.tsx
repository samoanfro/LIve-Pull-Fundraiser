"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/lib/cart/cart-context";
import { btnPrimary, btnSecondary } from "@/lib/ui";

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
        className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-base font-medium text-muted"
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
        className={`${btnPrimary} w-full`}
      >
        Add to Cart
      </button>
      {added && (
        <button
          type="button"
          onClick={() => router.push("/cart")}
          className={`${btnSecondary} w-full`}
        >
          Added — View Cart
        </button>
      )}
    </div>
  );
}
