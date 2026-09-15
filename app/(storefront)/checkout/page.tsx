"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { createCheckoutSessionAction } from "./actions";
import { heading, card, btnPrimary, btnSecondary, input } from "@/lib/ui";

export default function CheckoutPage() {
  const { items, totalCents, clear } = useCart();
  const [email, setEmail] = useState("");
  const [asGuest, setAsGuest] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (items.length === 0) {
    return (
      <div>
        <h1 className={`${heading} text-2xl`}>Checkout</h1>
        <p className="mt-4 text-muted">
          Your cart is empty.{" "}
          <Link href="/campaigns" className="text-accent hover:underline">
            Browse campaigns
          </Link>
          .
        </p>
      </div>
    );
  }

  async function handleContinue() {
    setError("");
    if (!email || !email.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);

    const result = await createCheckoutSessionAction(
      items.map((item) => ({
        productId: item.productId,
        organizationId: item.organizationId,
        quantity: item.quantity,
      })),
      email,
    );

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    if (result.url) {
      clear();
      window.location.href = result.url;
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h1 className={`${heading} text-2xl`}>Checkout</h1>

      <div className={`${card} mt-6`}>
        <ul className="flex flex-col gap-2 text-sm text-foreground">
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
        <div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold text-foreground">
          <span>Total</span>
          <span>${(totalCents / 100).toFixed(2)}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-2 text-sm">
        <button
          type="button"
          onClick={() => setAsGuest(true)}
          className={
            asGuest
              ? `${btnPrimary} px-3 py-2 text-sm`
              : `${btnSecondary} px-3 py-2 text-sm`
          }
        >
          Continue as Guest
        </button>
        <Link href="/login" className={`${btnSecondary} px-3 py-2 text-sm`}>
          Sign In Instead
        </Link>
      </div>

      {asGuest && (
        <label className="mt-4 flex flex-col gap-1 text-sm font-medium text-muted">
          Email for order confirmation
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={`${input} font-normal`}
          />
        </label>
      )}

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <button
        type="button"
        onClick={handleContinue}
        disabled={submitting}
        className={`${btnPrimary} mt-6 w-full`}
      >
        {submitting ? "Starting checkout..." : "Continue to Payment"}
      </button>
      <p className="mt-2 text-center text-xs text-muted">
        You&apos;ll be redirected to Stripe to complete your payment securely.
      </p>
    </div>
  );
}
