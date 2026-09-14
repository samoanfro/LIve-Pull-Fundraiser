import "server-only";
import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Returns null (rather than throwing) when STRIPE_SECRET_KEY is not
 * configured, so pages that don't need Stripe keep working in
 * environments where it hasn't been set up yet. Callers that need Stripe
 * must check for null and surface a clear error.
 */
export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;

  if (!cached) {
    cached = new Stripe(key);
  }
  return cached;
}
