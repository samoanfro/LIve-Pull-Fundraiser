import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe/client";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type Stripe from "stripe";

// Stripe webhook is the sole authority for payment success -- never trust
// the browser's checkout success redirect. See PRODUCT_BUILD_SPEC.md §12-13
// and §25.
// ACH (us_bank_account) payments settle over several business days rather
// than instantly. While one is in flight we extend the inventory
// reservation well past its normal 15-minute checkout-page TTL so the pack
// isn't released back to available inventory before the transfer clears.
const ACH_PENDING_HOLD_MINUTES = 14 * 24 * 60;

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { error: "Stripe is not configured." },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 },
    );
  }

  const supabase = createServiceRoleClient();

  // Idempotency guard: claim this event id before doing any work. A unique
  // violation here means we've already processed it -- treat as a no-op
  // success rather than redoing (or duplicating) order finalization.
  const { error: claimError } = await supabase
    .from("stripe_webhook_events")
    .insert({ stripe_event_id: event.id, event_type: event.type });

  if (claimError) {
    if (claimError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    return NextResponse.json({ error: claimError.message }, { status: 500 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        if (session.payment_status === "paid") {
          // Card (and any other instant method): payment is already final.
          await supabase.from("payments").insert({
            order_id: orderId,
            stripe_payment_intent_id: paymentIntentId,
            status: "succeeded",
            amount_cents: session.amount_total ?? 0,
            currency: session.currency ?? "usd",
          });

          await supabase.rpc("finalize_paid_order", {
            target_order_id: orderId,
          });
        } else {
          // Delayed method (e.g. ACH via us_bank_account): the customer has
          // submitted their bank details, but the transfer hasn't cleared.
          // Record it as processing and hold the reservation until the
          // later async_payment_succeeded/failed event resolves it.
          await supabase.from("payments").insert({
            order_id: orderId,
            stripe_payment_intent_id: paymentIntentId,
            status: "processing",
            amount_cents: session.amount_total ?? 0,
            currency: session.currency ?? "usd",
          });

          await supabase.rpc("extend_order_reservations", {
            target_order_id: orderId,
            ttl_minutes: ACH_PENDING_HOLD_MINUTES,
          });
        }
      }
      break;
    }

    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        await supabase
          .from("payments")
          .update({ status: "succeeded" })
          .eq("order_id", orderId)
          .eq("stripe_payment_intent_id", paymentIntentId);

        await supabase.rpc("finalize_paid_order", {
          target_order_id: orderId,
        });
      }
      break;
    }

    case "checkout.session.async_payment_failed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        const paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : (session.payment_intent?.id ?? null);

        await supabase
          .from("payments")
          .update({ status: "failed" })
          .eq("order_id", orderId)
          .eq("stripe_payment_intent_id", paymentIntentId);

        await supabase.rpc("release_order_reservations", {
          target_order_id: orderId,
        });
        await supabase
          .from("orders")
          .update({ status: "CANCELLED" })
          .eq("id", orderId);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        await supabase.rpc("release_order_reservations", {
          target_order_id: orderId,
        });
        await supabase
          .from("orders")
          .update({ status: "CANCELLED" })
          .eq("id", orderId);
      }
      break;
    }

    default:
      // Other event types are not handled yet (e.g. refunds land in Phase 8).
      break;
  }

  return NextResponse.json({ received: true });
}
